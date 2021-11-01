async function drawLineChart() {
  // 1. Access data
  // const dataset = await d3.json("./../my_weather_data.json");  // Corrupt!
  const dataset = await d3.json("./../nyc_weather_data.json");
  console.table(dataset[0]);

  /**
   * Accessor functions!
   * These may seem like extra work, but in truth they're useful. Putting them
   * near the top of your d3 files is good practice so that changes to data
   * structures or whatever can be handled in one place. They're also good for
   * basic documentation: you can see what a file is all about just by looking
   * at the accessors.
   */
  const dateParser = d3.timeParse("%Y-%m-%d");
  const yAccessor = d => d.temperatureMax;
  const xAccessor = d => dateParser(d.date);

  console.log(xAccessor(dataset[0]));

  // 2. Create chart dimensions
  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;


  // 3. Draw canvas
  /*
  // Most d3-selection methods will return a selection object.
  const wrapper = d3.select("#wrapper");
  const svg = wrapper.append("svg");

  // Attributes can be a constant or a function (will cover later).
  svg.attr("width", dimensions.width);
  svg.attr("height", dimensions.height);
  */

  // Short-hand, since we don't need to re-use svg.
  const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  // By itself, <g> is 0,0 in size. It expands to the size of its contents.
  const bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.top
    }px)`);

  // 4. Create scales
  /**
   * We need to scale our temperature variations (which could range from, say,
   * 10F to 100F) and convert them into a pixel range (from say, 0px to 200px).
   * We need to use a linear scale function to handle this for us.
   * Our scale needs two pieces of information: the domain (min/max input values)
   * and range (min/max output values).
   * Using d3.extent we give a dataset and an accessor function to find the min/max.
   *
   */
  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  console.log(yScale(-30));  // 246.2269

  const freezingTemperaturePlacement = yScale(32);
  const freezingTemperatures = bounds.append("rect")
    .attr("x", 0)
    .attr("width", dimensions.boundedWidth)
    .attr("y", freezingTemperaturePlacement)
    .attr("height", dimensions.boundedHeight - freezingTemperaturePlacement)
    .attr("fill", "#e0f3f3");

  const xScale = d3.scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);


  // 5. Draw data
  /**
   * Example of drawing a shape. "d" attribute will take a few comments that can
   * be capitalized (if giving an absolute value) or lowercased (if giving a
   * relative value):
   * M will move a point (followed by x and y values)
   * L will draw a line to a point (followed by x and y values)
   * Z will draw a line back to the first point
   * ...
   */
  // bounds.append("path").attr("d", "M 0 0 L 100 0 L 100 100 L 0 50 Z");

  /**
   * This method will create a generator that converts data points into a d string.
   * It needs two things: how to find an x-axis value and a y-axis value.
   */
  const lineGenerator = d3.line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)));

  const line = bounds.append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "#af9358")
    .attr("stroke-width", 2);


  // 6. Draw peripherals
  const yAxisGenerator = d3.axisLeft()
    .scale(yScale);

  // For the sake of organization, put yAxis into its own <g>.
  const yAxis = bounds.append("g")  // Shorter version
    .call(yAxisGenerator);  // call() feeds the append's return to the function.
  // const yAxis = bounds.append("g");  // Longer version
  // yAxisGenerator(yAxis); // See here, without call you need to do this.

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale);

  // We need to move the axis down to the bottom of the chart.
  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
}

drawLineChart();
