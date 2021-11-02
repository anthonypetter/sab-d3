async function drawBars() {
  // # Access data
  let dataset = await d3.json("../nyc_weather_data.json");

  /**
   * humidity |
   * This is a single-axis chart, so, no need for "x" and "y" accessors.
   * */
  const metricAccessor = d => d.humidity;
  /** bin length */
  const yAccessor = d => d.length;

  // # Create dimensions
  const width = 600;

  let dimensions = {
    width: width,
    height: width * 0.6,
    margin: {
      top: 30,
      right: 10,
      bottom: 50,
      left: 50,
    },
    boundedWidth: 0,
    boundedHeight: 0,
  };
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // # Draw canvas
  const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.right
    }px)`);

  // # Create scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, metricAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  // # Create bins
  const binsGenerator = d3.bin()
    .domain(xScale.domain())
    .value(metricAccessor)
    .thresholds(12);  // 13 bins in total. d3 decides on final results. Use array to define directly.

  // This is a new set of data that we can manipulate.
  const bins = binsGenerator(dataset);

  // Take a look at the results. x0 is the lower bound. x1 is the upper bound (not including).
  console.log(bins);

  // # Creating the y scale
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(bins, yAccessor)]) // Not extent() because we want to start at 0!
    .range([dimensions.boundedHeight, 0])
    .nice();

  // # Draw data
  // binsGroup is a <g> to hold all bins.
  const binsGroup = bounds.append("g")
    .data(bins);

  // Will create a new <g> for each bin. Each will be given a <g>.
  const binGroups = binsGroup.selectAll("g")  // Only one (we JUST appended it).
    .data(bins)
    .join("g"); // Join function is like the one for an array to make a string!

  const barPadding = 1;

  const barRects = binGroups.append("rect") // rect needs x, y, width, height
    .attr("x", d => xScale(d.x0) + barPadding / 2)  // How far horizontal
    .attr("y", d => yScale(yAccessor(d)))           // How far vertical
    .attr("width", d => d3.max([                    // How wide
      0,  // Pass 0 just in case we calculate a negative number!
      xScale(d.x1) - xScale(d.x0) - barPadding, // Heavy use of scale here!
    ]))
    .attr("height", d => dimensions.boundedHeight - yScale(yAccessor(d)))
    .attr("fill", "cornflowerblue");

  // # Adding labels
  const barText = binGroups.filter(yAccessor) // Filter falsy values (0 length).
    .append("text")
    .attr("x", d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2) // Center
    .attr("y", d => yScale(yAccessor(d)) - 5) // 5px higher
    .text(yAccessor)  // The bin length
    .style("text-anchor", "middle") // Center align text by making anchor in middle.
    .attr("fill", "darkgrey")
    .style("font-size", "12px")
    .style("font-family", "sans-serif");
}
drawBars();
