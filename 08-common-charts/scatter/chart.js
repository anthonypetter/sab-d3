async function drawScatter() {

  // 1. Access data

  const dataset = await d3.json("../../resources/nyc_weather_data.json");

  // 2. Create chart dimensions

  const xAccessor = d => d.temperatureMin;
  const yAccessor = d => d.temperatureMax;

  const width = d3.min([
    window.innerWidth * 0.9,
    window.innerHeight * 0.9,
  ]);
  const dimensions = {
    width: width,
    height: width,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 50,
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

  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  const drawDots = (dataset) => {

    // 5. Draw data

    const dots = bounds.selectAll("circle")
      .data(dataset, d => d[0]);

    const newDots = dots.enter().append("circle");

    const allDots = newDots.merge(dots)
        .attr("cx", d => xScale(xAccessor(d)))
        .attr("cy", d => yScale(yAccessor(d)))
        .attr("r", 4);

    const oldDots = dots.exit()
        .remove();
  };
  drawDots(dataset);

  /**
   * Draw regression line.
   * Adding a line of best fit is something we can add ourselves. Using a
   * library to do it for me I have to thank user rotexhawk for giving me a
   * hint on CodeSandbox -> https://codesandbox.io/s/iyfpk
   * https://observablehq.com/@harrystevens/introducing-d3-regression
   * https://github.com/harrystevens/d3-regression
   */
  const drawLine = (dataset) => {
    const lineGenerator = d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    const linearRegression = d3.regressionLinear()
      .x(d => xAccessor(d))
      .y(d => yAccessor(d))
      .domain([ // Make sure to stretch to ends of chart. May not be best solution.
        Math.min(xScale.domain()[0], yScale.domain()[0]),
        Math.max(xScale.domain()[1], yScale.domain()[1]),
      ]);

    const regressionLine = linearRegression(dataset);

    console.log(regressionLine); // Very useful to look at this.

    const line = bounds.append("path")
        .attr("class", "line")
        .attr("d", lineGenerator(regressionLine));
  };
  drawLine(dataset);

  // 6. Draw peripherals

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale);

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
      .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const xAxisLabel = xAxis.append("text")
      .attr("class", "x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .html("Minimum Temperature (&deg;F)");

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(4);

  const yAxis = bounds.append("g")
    .call(yAxisGenerator);

  const yAxisLabel = yAxis.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 10)
      .html("Maximum Temperature (&deg;F)");
}
drawScatter();
