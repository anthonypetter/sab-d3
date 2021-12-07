async function drawScatter() {

  // 1. Access data

  const dataset = await d3.json("../../resources/nyc_weather_data.json");
  console.table(dataset[0]);

  // set data constants
  const xAccessor = d => d.temperatureMin;
  const yAccessor = d => d.temperatureMax;

  const colorScaleYear = 2000;  // Force to be the same year.
  const parseDate = d3.timeParse("%Y-%m-%d");
  const colorAccessor = d => parseDate(d.date).setYear(colorScaleYear);

  // 2. Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.85,
    window.innerHeight * 0.85,
  ]);
  const dimensions = {
    width: width,
    height: width,
    margin: {
      top: 90,
      right: 90,
      bottom: 50,
      left: 50,
    },
    boundedWidth: 0,
    boundedHeight: 0,
  };
  dimensions.boundedWidth = dimensions.width -
    dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight = dimensions.height -
    dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`,
    );

  const boundsBackground = bounds.append("rect")
      .attr("class", "bounds-background")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", 0)
      .attr("height", dimensions.boundedHeight);

  // 4. Create scales

  /**
   * Combine temp max and min into a single array and get the extent there.
   * Otherwise our X and Y domains will be different. For the sake of max/min
   * comparisons we should have the same 0 and max on both. That makes our
   * chart's aspect ratio a proper 1:1, so a 45° slope is the equal point.
   */
  const temperatureExtent = d3.extent([
    ...dataset.map(xAccessor),
    ...dataset.map(yAccessor),
  ]);

  const xScale = d3.scaleLinear()
    .domain(temperatureExtent)
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(temperatureExtent)
    .range([dimensions.boundedHeight, 0])
    .nice();

  // Default rainbow style.
  // const colorScale = d3.scaleSequential()
  //   .domain([
  //     parseDate("2000-01-01"),
  //     parseDate("2000-12-31"),
  //   ])
  //   .interpolator(d => d3.interpolateRainbow(-d));  // Inverted rainbow.

  /**
   * My own season-coloring style.
   * It's seriously limited because it must loop with the first and last day
   * of the year being the same. I didn't like putting the peaks of the seasons
   * on the solstices and equinoxes, so I vaguely put them half way through.
   * Seems about right, huh? Feb 15 being the dead of winter, April 30 being
   * the heart of spring, August 1 being the peak of summer, and November 11
   * being the depth of fall.
   * I then used an online tool to get me the middle point in the gradient
   * between Fall and Winter and named it "New Years".
   */
  const colorScale = d3.scaleLinear()
    .domain([
      parseDate(`${colorScaleYear}-01-01`),  // New Years
      parseDate(`${colorScaleYear}-02-15`),  // Winter
      parseDate(`${colorScaleYear}-04-30`),  // Spring
      parseDate(`${colorScaleYear}-08-01`),  // Summer
      parseDate(`${colorScaleYear}-11-02`),  // Fall
      parseDate(`${colorScaleYear}-12-31`),  // New Years
    ])
    .range([
      "#a47146",  // New Years
      "#483d8b",  // Winter
      "#00ff7f",  // Spring
      "#ff0",     // Summer
      "#ffa500",  // Fall
      "#a47146",  // New Years
    ]);

  // 5. Draw data

  const dotsGroup = bounds.append("g");
  const dots = dotsGroup.selectAll(".dot")
    .data(dataset, d => d[0])
    .join("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 4)
      .style("fill", d => colorScale(colorAccessor(d)))
      .style("stroke", "black")
      .style("stroke-opacity", "0.2");

  // 6. Draw peripherals

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .ticks(4);

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

  // 7. Set up interactions

}
drawScatter();
