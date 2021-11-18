async function drawPie() {

  // 1. Access data

  const dataset = await d3.json("../../resources/nyc_weather_data.json");

  const iconAccessor = d => d.icon;
  const datasetByIcon = Array.from(d3.group(dataset, iconAccessor))
    .sort((a,b) => b[1].length - a[1].length);
  const combinedDatasetByIcon = [
    ...datasetByIcon.slice(0, 4),
    [
      "other",
      d3.merge(datasetByIcon.slice(4).map(d => d[1]))
    ]
  ];

  // 2. Create chart dimensions

  const width = 500;
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    },
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

  const arcGenerator = d3.pie()
      .padAngle(0.005)
      .value(([ key, values ]) => values.length);

  const arcs = arcGenerator(combinedDatasetByIcon);

  const interpolateWithSteps = numberOfSteps => new Array(numberOfSteps).fill(null).map((d, i) => i / (numberOfSteps - 1));
  const colorScale = d3.scaleOrdinal()
      .domain(arcs.sort((a,b) => a.data[1].length - b.data[1].length).map(d => d.data[0]))
      .range(interpolateWithSteps(datasetByIcon.length).map(d3.interpolateLab("#f3a683", "#3dc1d3")));

  const radius = dimensions.boundedWidth / 2;
  const arc = d3.arc()
    .innerRadius(radius * 0.7) // set to 0 for a pie chart
    .outerRadius(radius);

  // 5. Draw data

  const centeredGroup = bounds.append("g")
      .attr("transform", `translate(${dimensions.boundedHeight / 2}, ${dimensions.boundedWidth / 2})`);

  centeredGroup.selectAll("path")
    .data(arcs)
    .join("path")
      .attr("fill", d => d.data[0] == "other" ? "#dadadd" : colorScale(d.data[0]))
      .attr("d", arc)
    .append("title")
      .text(d => d.data[0]);

  const iconGroups = centeredGroup.selectAll("g")
    .data(arcs)
      .join("g")
      .attr("transform", d => `translate(${arc.centroid(d)})`);

  iconGroups.append("path")
      .attr("class", "icon")
      .attr("d", d => iconPaths[d.data[0]])
      .attr("transform", d => "translate(-25, -32) scale(0.5)");

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
      .attr("transform", d => "translate(0, 20)");

}
drawPie();
