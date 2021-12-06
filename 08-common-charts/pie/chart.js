async function drawPie() {
  const GROUP_COUNT = 4; // + 1 for extra.


  // 1. Access data

  const dataset = await d3.json("../../resources/nyc_weather_data.json");

  const iconAccessor = d => d.icon;

  /**
   * This groups the data by the icon property and then sorts them in order of
   * their count.
   */
  const datasetByIcon = Array.from(d3.group(dataset, iconAccessor))
    .sort((a, b) => b[1].length - a[1].length);

  /**
   * This object takes the named icons we have in iconPaths and matches them
   * to the icon names from our data. One thing we do is we only take the first
   * four icons (the slice() function) and then merge together whatever remains
   * under "other".
   */
  const combinedDatasetByIcon = [
    ...datasetByIcon.slice(0, GROUP_COUNT),
    [
      "other",
      d3.merge(datasetByIcon.slice(GROUP_COUNT).map(d => d[1])),
    ],
  ];

  // 2. Create chart dimensions

  const width = 500;
  const dimensions = {
    width: width,
    height: width,
    margin: {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    },
    boundedWidth: 0,
    boundedHeight: 0,
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

  const arcGenerator = d3.pie() // Build-in pie creator.
      .padAngle(0.005)  // This is the white padding between segements.
      .value(([ _key, values ]) => values.length);  // Count of each group.

  const arcs = arcGenerator(combinedDatasetByIcon);

  /**
   * Creates an array of fractions. We have eight different groups for NYC so
   * it generates the following fractions:
   * [0/7, 1/7, 2/7, 3/7, 4/7, 5/7, 6/7, 7/7] (length of 8)
   */
  const interpolateWithSteps = numberOfSteps =>
    new Array(numberOfSteps).fill(null).map((_d, i) => i / (numberOfSteps - 1));

  console.log(interpolateWithSteps(datasetByIcon.length));
  console.log(arcs.map(d => d.data));

  /**
   * Here a basic color scale is created. It doesn't consider the size, rather,
   * it's simply taking the number of groups and divvying out the colors to them.
   */
  const colorScale = d3.scaleOrdinal()
      /**
       * Interesting to pay close attention to how the domain is built there.
       * arcs.sort sorts the datum of the arcGenerator after given the combined
       * dataset (see above). data[0] is the icon name. data[1] is the array of
       * weather data. So, by sorting by data[1].length we can sort by group
       * size and then mapping by data[0] we can return an array of the icons
       * in order.
       */
      .domain(
        arcs.sort(
          (a, b) => a.data[1].length - b.data[1].length,
        ).map(d => d.data[0]),
      )
      /**
       * Here we get the fraction steps and then pass it into the interpolateLab
       * function to give us shades.
       */
      .range(
        interpolateWithSteps(datasetByIcon.length).map(
          d3.interpolateLab("#f3a683", "#3dc1d3"),  // LAB is another color format.
        ),
      );

  const radius = dimensions.boundedWidth / 2;
  const arc = d3.arc()
    .innerRadius(radius * 0.7) // set to 0 for a pie chart
    .outerRadius(radius);

  // 5. Draw data

  const centeredGroup = bounds.append("g")
      .attr("class", "centered-group")
      .attr("transform", `translate(${dimensions.boundedHeight / 2}, ${dimensions.boundedWidth / 2})`);

  /**
   * Here we build the actual pie graph by providing the paths with data via
   * arcs (the arcGenerator). We join() on paths. Give the fill through attr().
   * Then via the "d" attr() we provide the d3.arc (see above). The path draws
   * based off the d attribute. There's no need to be too concerned about the
   * complexities of the jumbled combination of data points to draw the donut
   * shape.
   */
  centeredGroup.selectAll("path")
    .data(arcs)
    .join("path")
      .attr("fill", d => d.data[0] == "other" ? "#dadadd" : colorScale(d.data[0]))
      .attr("d", arc)
    .append("title")
      .text(d => d.data[0]);

  /**
   * d3 spares us the crazy math required to find out where the place our icon-
   * groups with the function arc.centroid(). Take a look at the documentation
   * for it, there are examples. So, we put a couple of new group icons
   */
  const iconGroups = centeredGroup.selectAll("g")
    .data(arcs)
      .join("g")
      .attr("class", "icon-group")
      .attr("transform", d => `translate(${arc.centroid(d)})`);

  iconGroups.append("path")
      .attr("class", "icon")
      .attr("d", d => iconPaths[d.data[0]])
      .attr("transform", _d => "translate(-25, -32) scale(0.5)");

  // 6. Draw peripherals

  bounds.append("text")
      .attr("class", "title")
      .text("2018 Weather")
      .attr("transform", `translate(${dimensions.boundedWidth / 2}, ${dimensions.boundedHeight / 2})`);

  bounds.append("text")
      .attr("class", "title-small")
      .text("New York City, NY")
      .attr("transform", `translate(${dimensions.boundedWidth / 2}, ${dimensions.boundedHeight / 2 + 30})`);

  iconGroups.append("text")
      .attr("class", "label")
      .text(d => d.data[1].length)
      .attr("transform", _d => "translate(0, 20)");

}
drawPie();
