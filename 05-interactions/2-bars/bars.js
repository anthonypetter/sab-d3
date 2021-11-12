async function drawBars() {

  // 1. Access data

  const dataset = await d3.json("./../../resources/nyc_weather_data.json");

  // 2. Create chart dimensions

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

  // init static elements
  bounds.append("g")
      .attr("class", "bins");
  bounds.append("line")
      .attr("class", "mean");
  bounds.append("g")
      .attr("class", "x-axis")
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .append("text")
      .attr("class", "x-axis-label");

  const metricAccessor = d => d.humidity;
  const yAccessor = d => d.length;

  // 4. Create scales

  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, metricAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const binsGenerator = d3.bin()
    .domain(xScale.domain())
    .value(metricAccessor)
    .thresholds(12);

  const bins = binsGenerator(dataset);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();

  // 5. Draw data

  const barPadding = 1;

  let binGroups = bounds.select(".bins")
    .selectAll(".bin")
    .data(bins);

  binGroups.exit()
      .remove();

  const newBinGroups = binGroups.enter().append("g")
      .attr("class", "bin");

  newBinGroups.append("rect");
  newBinGroups.append("text");

  // update binGroups to include new points
  binGroups = newBinGroups.merge(binGroups);

  const barRects = binGroups.select("rect")
      .attr("x", d => xScale(d.x0) + barPadding)
      .attr("y", d => yScale(yAccessor(d)))
      .attr("height", d => dimensions.boundedHeight - yScale(yAccessor(d)))
      .attr("width", d => d3.max([
        0,
        xScale(d.x1) - xScale(d.x0) - barPadding
      ]));

  const mean = d3.mean(dataset, metricAccessor);

  const meanLine = bounds.selectAll(".mean")
      .attr("x1", xScale(mean))
      .attr("x2", xScale(mean))
      .attr("y1", -15)
      .attr("y2", dimensions.boundedHeight);

  const meanLabel = bounds.append("text")
    .attr("x", xScale(mean))
    .attr("y", -20)
    .text("mean")
    .attr("fill", "maroon")
    .style("text-anchor", "middle")
    .style("font-size", "12px");

  // draw axes
  const xAxisGenerator = d3.axisBottom()
    .scale(xScale);

  const xAxis = bounds.select(".x-axis")
    .call(xAxisGenerator);


  const xAxisLabel = xAxis.select(".x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .text("Humidity");

  // 7. Set up interactions
  /**
   * We use mouseenter (instead of mouseover) and mouseleave (instead of mouseout)
   * because we want to only trigger when over the actual element. But leave
   * on any child elements.
   */
  binGroups.select("rect")
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);

  const tooltip = d3.select("#tooltip");

  /**
   * Remember. It's interesting to consider how d3 is working with datum. It's
   * kind of a surprise to think about how this datum from the dataset manages
   * to be associated, reliably, with our <rect> elements within the binGroups
   * variable.
   * Additionally, to avoid issues with floating point weirdness we format using:
   *  -> https://github.com/d3/d3-format
   */
  function onMouseEnter(e, datum) {
    tooltip.select("#count")
      .text(yAccessor(datum));

    // Prevent overly long decminals.
    const formatHumidity = d3.format(".2f");
    tooltip.select("#range")
      .text([
        formatHumidity(datum.x0),
        formatHumidity(datum.x1),
      ].join(" - "));

    // Calcuate the x position of the tooltip. Need to match
    const x = xScale(datum.x0)
      + (xScale(datum.x1) - xScale(datum.x0)) / 2
      + dimensions.margin.left;

    // Calculate the y position of the tooltip.
    const y = yScale(yAccessor(datum))
      + dimensions.margin.top;

    // BAD: This makes the tooltip's top left corner meet the point we want.
    // tooltip.style("transform", `translate(${x}px, ${y}px)`);

    /**
     * CSS's calc() function can put together different units. Units such as:
     * top, right, left, bottom (all based on the parent's height/width)
     * margin percentage (based on the parent's width)
     * transform: translate() (based on the element's own size)
     * So, we can have the element reference and calculate its own dimensions.
     * (Alternatively, .getBoundingClientRect() could also work, but would be
     * expensive).
     */
    tooltip.style("transform", "translate("
    + `calc(-50% + ${x}px),`
    + `calc(-100% + ${y}px)`);
    tooltip.style("opacity", 1);
  }
  function onMouseLeave() {
    tooltip.style("opacity", 0);
  }
}
drawBars();
