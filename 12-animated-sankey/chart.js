async function drawChart() {

  const LINE_LINK_LENGTH = 6;
  const MAX_PEOPLE = 10000;


  // 1. Access data

  const dataset = await d3.json("./../resources/education.json");

  // Sex.
  const sexAccessor = d => d.sex;
  const sexes = ["female", "male"];
  const sexIds = d3.range(sexes.length);  // [0, 1]

  // Education.
  const educationAccessor = d => d.education;
  const educationNames = [  // Save time just writing these ourself.
    "<High School",
    "High School",
    "Some Post-secondary",
    "Post-secondary",
    "Associate's",
    "Bachelor's and up",
  ];
  const educationIds = d3.range(educationNames.length);

  // Socioeconomic Status.
  const sesAccessor = d => d.ses;
  const sesNames = ["low", "middle", "high"];
  const sesIds = d3.range(sesNames.length);

  /**
   * Returns a key string.
   * Ex: {sex: "female", ses: "middle"} gives "female--middle".
   * @param {{sex: string, ses: string}} param0
   * @returns
   */
  const getStatusKey = ({sex, ses}) => [sex, ses].join("--");

  // Generating possibilities.
  const stackedProbabilities = {};
  dataset.forEach(startingPoint => {
    const key = getStatusKey(startingPoint);
    let stackedProbability = 0;
    stackedProbabilities[key] = educationNames.map((education, i) => {
      stackedProbability += (startingPoint[education] / 100);
      if (i === educationNames.length - 1) {
        return 1; // Account for rounding errors
      } else {
        return stackedProbability;
      }
    });
  });
  console.table(stackedProbabilities);

  function generatePerson(elapsed) {
    const sex = getRandomValue(sexIds);
    const ses = getRandomValue(sesIds);
    const statusKey = getStatusKey({
      sex: sexes[sex],
      ses: sesNames[ses],
    });

    /**
     * d3.bisect() takes an array and tells you where in the array you'd place
     * the second argument. Since our probabilities are 0->1 it works great with
     * Math.random(). Instead of dealing with writing a custom function that
     * does this basic checking, it's neat to just borrow a function from d3
     * that does it for us. Love it.
     */
    const probabilities = stackedProbabilities[statusKey];
    const education = d3.bisect(probabilities, Math.random());

    return { sex, ses, education, startTime: elapsed };
  }


  // 2. Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.9,
    1200,
  ]);
  const dimensions = {
    width: width,
    height: 500,
    margin: {
      top: 10,
      right: 200,
      bottom: 10,
      left: 120,
    },
    boundedWidth: 0,
    boundedHeight: 0,
    pathHeight: 50,
  };
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
      .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

  // 4. Create scales
  const xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, dimensions.boundedWidth])
    .clamp(true); // Makes it so that it is not possible to go beyond the range.

  /**
   * Here we define separate Y scales. This can allow us to dynamically size
   * our paths to grow when new ses or educations are added. Pretty cool.
   * Remember, this is Y axis. So, things are flipped around, as per usual.
   */
  const startYScale = d3.scaleLinear()
    .domain([sesIds.length, -1])
    .range([0, dimensions.boundedHeight]);
  const endYScale = d3.scaleLinear()
    .domain([educationIds.length, -1])
    .range([0, dimensions.boundedHeight]);

  const yTransitionProgressScale = d3.scaleLinear()
    .domain([0.45, 0.55]) // x progress. These numbers are hand-chosen.
    .range([0, 1])        // y progress. Just want a fraction.
    .clamp(true);         // Really hilarious what happens when set to false.


  // 5. Draw data
  /**
   * First three stops on the X scale (0, 1, 2) we follow the startYScale.
   * Beyond that (3, 4, 5) we follow the endYScale.
   * Using the monotoneX curve style it maintains, on the X axis, that every
   * point is met by the line correctly. We'd use Y if the chart was vertical.
   * See the docs for examples.
   */
  const linkLineGenerator = d3.line()
    .x((_d, i) => i * (dimensions.boundedWidth / (LINE_LINK_LENGTH - 1)))
    .y((d, i) => i <= 2 ? startYScale(d[0]) : endYScale(d[1]))
    .curve(d3.curveMonotoneX);

  /**
   * Automatically generate the arrays needed to populate the line generator.
   * 3 ses leading to 6 different education outcomes. That's 18 different
   * arrays.
   * I suppose it's a bit weird to generate entire arrays instead of just
   * writing 18 variations in a single array. But we're keeping it simple and
   * the line generator needs to have a dataset to base off of.
   */
  const linkOptions = d3.merge(
    sesIds.map(startId => (
      educationIds.map(endId => (
        new Array(LINE_LINK_LENGTH).fill([startId, endId])
      ))
    )),
  );

  const linksGroup = bounds.append("g");
  const links = linksGroup.selectAll(".category-path")
    .data(linkOptions)
    .join("path")
        .attr("class", "category-path")
        .attr("d", linkLineGenerator)
        .attr("stroke-width", dimensions.pathHeight);


  // 6. Draw peripherals
  const startingLabelsGroup = bounds.append("g")
      .style("transform", "translateX(-20px)");
  const startingLavels = startingLabelsGroup.selectAll(".start-label")
    .data(sesIds)
    .join("text")
      .attr("class", "label start-label")
      .attr("y", (_d, i) => startYScale(i))
      .text((_d, i) => sentenceCase(sesNames[i]));
  const startLabel = startingLabelsGroup.append("text")
      .attr("class", "start-title")
      .attr("y", startYScale(sesIds[sesIds.length - 1]) - 65)
      .text("Socioeconomic");
  const startLabelLineTwo = startingLabelsGroup.append("text")
      .attr("class", "start-title")
      .attr("y", startYScale(sesIds[sesIds.length - 1]) - 50)
      .text("Status");  // No linebreaks in SVG :(

  const endingLabelsGroup = bounds.append("g")
      .style("transform", `translateX(${dimensions.boundedWidth + 20}px)`);
  const endingLabels = endingLabelsGroup.selectAll(".end-label")
    .data(educationNames)
    .join("text")
      .attr("class", "label end-label")
      .attr("y", (_d, i) => endYScale(i) - 15)
      .text(d => d);

  const maleMarkers = endingLabelsGroup.selectAll(".male-marker")
    .data(educationIds)
    .join("circle")
      .attr("class", "ending-marker male-marker")
      .attr("r", 5.5)
      .attr("cx", 5)
      .attr("cy", d => endYScale(d) + 5);

  const trianglePoints = ["-7, 6", "0, -6", "7, 6"].join(" ");
  const femaleMarkers = endingLabelsGroup.selectAll(".female-marker")
    .data(educationIds)
    .join("polygon")
      .attr("class", "ending-marker female-marker")
      .attr("points", trianglePoints)
      .attr("transform", d => `translate(5, ${endYScale(d) + 20})`);


  // 7. Set up interactions

  let people = [];
  const markersGroup = bounds.append("g")
    .attr("class", "markers-group");

  function updateMarkers(elapsed) {
    const xProgressAccessor = d => (elapsed - d.startTime) / 5000;

    if (people.length < MAX_PEOPLE) {
      people = [
        ...people,
        generatePerson(elapsed),
      ];
    }
    console.log(people.length);

    const females = markersGroup.selectAll(".marker-triangle")
      .data(people.filter(d => sexAccessor(d) == 0));
    females.enter().append("polygon")
      .attr("class", "marker marker-triangle")
      .attr("points", trianglePoints);

    const males = markersGroup.selectAll(".marker-circle")
      .data(people.filter(d => sexAccessor(d) == 1));
    males.enter().append("circle")
      .attr("class", "marker marker-circle")
      .attr("r", 5.5);

    const markers = d3.selectAll(".marker");
    markers.style("transform", d => {
      const x = xScale(xProgressAccessor(d));
      const yStart = startYScale(sesAccessor(d)); // Where it starts
      const yEnd = endYScale(educationAccessor(d)); // Where it ends up
      const yChange = yEnd - yStart;  // The y distance it must cover
      const yProgress = yTransitionProgressScale(xProgressAccessor(d));
      const y = yStart + yChange * yProgress;
      return `translate(${x}px, ${y}px)`;
    });
  }
  d3.timer(updateMarkers);

}
drawChart();


// utility functions

const getRandomNumberInRange = (min, max) => Math.random() * (max - min) + min;

const getRandomValue = arr => arr[Math.floor(getRandomNumberInRange(0, arr.length))];

const sentenceCase = str => [
  str.slice(0, 1).toUpperCase(),
  str.slice(1),
].join("");
