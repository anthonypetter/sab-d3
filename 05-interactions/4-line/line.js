async function drawLineChart() {
  const DAYS = 100;

  // 1. Access data

  let dataset = await d3.json("./../../nyc_weather_data.json");

  const yAccessor = d => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = d => dateParser(d.date);
  dataset = dataset.sort((a,b) => xAccessor(a) - xAccessor(b)).slice(0, DAYS);

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

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
      .attr("transform", `translate(${
        dimensions.margin.left
      }, ${
        dimensions.margin.top
      })`);

  bounds.append("defs").append("clipPath")
      .attr("id", "bounds-clip-path")
    .append("rect")
      .attr("width", dimensions.boundedWidth)
      .attr("height", dimensions.boundedHeight);

  const clip = bounds.append("g")
    .attr("clip-path", "url(#bounds-clip-path)");

  // 4. Create scales

  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  const freezingTemperaturePlacement = yScale(32);
  const freezingTemperatures = clip.append("rect")
      .attr("class", "freezing")
      .attr("x", 0)
      .attr("width", d3.max([0, dimensions.boundedWidth]))
      .attr("y", freezingTemperaturePlacement)
      .attr("height", d3.max([0, dimensions.boundedHeight - freezingTemperaturePlacement]));

  const xScale = d3.scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  // 5. Draw data

  const lineGenerator = d3.line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)));

  const line = clip.append("path")
      .attr("class", "line")
      .attr("d", lineGenerator(dataset));

  // 6. Draw peripherals

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale);

  const yAxis = bounds.append("g")
      .attr("class", "y-axis")
    .call(yAxisGenerator);

  const yAxisLabel = yAxis.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 10)
      .html("Minimum Temperature (&deg;F)");

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale);

  const xAxis = bounds.append("g")
      .attr("class", "x-axis")
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  // 7. Set up interactions
  // Adding a mousemove listening rect. Notice that we don't set x,y; they're 0,0.
  const listeningRect = bounds.append("rect")
    .attr("class", "listening-rect")
    .attr("width", dimensions.boundedWidth)
    .attr("height", dimensions.boundedHeight)
    .on("mousemove", onMouseMove)
    .on("mouseleave", onMouseLeave);

  const tooltip = d3.select("#tooltip");
  const tooltipCircle = bounds.append("circle")
    .attr("r", 4)
    .attr("stroke", "#af9358")
    .attr("fill", "white")
    .attr("stoke-width", 2)
    .style("opacity", 0);

  /**
   * When you trigger a listening event with .on() d3-selection has a global
   * d3.event. It refers to the currently triggered event and goes away when the
   * event is complete. It also means we gain access to d3.pointer(), which
   * returns the x,y coordinates of the cursor RELATIVE to the specified container.
   *
   * Also, random. Remember that uhhh, fat arrow functions don't appear to be
   * "hoisted", so, if you wanna define after the point its used, you cannot
   * write it as a const.
   */
  function onMouseMove(e) {
    const mousePosition = d3.pointer(e);
    /**
     * Very cool. We can take the x position (a pixel number) and unconvert the
     * xScale's pixels (range) back into the domain (date values).
     */
    const hoveredDate = xScale.invert(mousePosition[0]);
    // console.log(mousePosition, hoveredDate.toString());

    /**
     * Disregard all of this. I did this on my flight to LAX and I do not know
     * if the author was accurate in her description of how lowestIndex()
     * works. I used a date range of just 5 days for experimentation and had
     * console.log print out the a-b calculations of every point and her explan-
     * tion that it would give the index of the lowest calculated value just
     * did not match at all with reality. It appeared, in truth, to choose the
     * last index with a negative number. I think I'll need to look up better
     * explanations later. Her rationale makes sense. Yeah, find indexes
     * where the distance is the lowest, sure. And if a library function simply
     * reveals to you the index of the lowest distance value. But I believe in
     * truth the function is using a-b to SORT the distances and gives a result
     * after sorting.
     * If I find that her explanation behind d3.leastIndex() is wrong, I should
     * report it. I think the "results" in her diagrams might be a total mis-
     * understanding of how it works.
     *
     *
     * The function d3.leastIndex() is a way to find where in a sorted array
     * your value might fit. If you define a comparator function that tries to
     * find the index of the given data with the smallest number generated by
     * the comparator function.
     * [100, 0, 10] with (a, b) => a - b  VS  [100, 0, 10] with (a, b) => b - a
     *  100-0  0-10          <--math-->        0-100  10-0
     *   [100, -10]        <--results-->        [-100, 10]
     *           1       <--lowest-index-->       0
     * Anyway, that's enough for d3.leastIndex(), let's talk about why it works
     * for our line here.
     *
     * We use Math.abs() because above or below slightly, we don't care, we want
     * a distance value. Let's assume we have 100 days (Jan 1 -> Apr 10) and let's
     * express the x of the mouse cursor location as a range from 0 to 100.
     * So, what happens is that if you hover at 0.05, you get a comparison
     * between Jan 1 and Jan 2.
     * Jan 1 (0.0) - 0.05 = 0.05          Jan 2 (1.0) - 0.05 = 0.95
     * Jan 2 (1.0) - 0.05 = 0.95          Jan 3 (2.0) - 0.05 = 1.95
     * Results in 0.05 - 0.95 = -0.90      0.95 - 1.95 = -1.00
     * Meanwhile, comparing Apr 9 vs Apr 10 will give like 97.95-98.95, that means
     * a 1.0 difference. Every other two points being compared will be 1.0
     * difference because they're exactly 1 difference from each other relative
     * to the hoveredDate. But when he hovered date is between the two? The
     * difference is smaller because it's between the two.
     * Let's say you hovered around 0.9. Closer to Jan 2 than Jan 1, but still
     * between the two...
     * Jan 1 (0.0) - 0.90 = 0.90          Jan 2 (1.0) - 0.90 = 0.10
     * Jan 2 (1.0) - 0.90 = 0.10          Jan 3 (2.0) - 0.90 = 1.10
     *
     */

    const getDistanceFromHoveredDate = d => Math.abs(xAccessor(d) - hoveredDate);
    // const format = d3.format(",");
    const closestIndex = d3.leastIndex(dataset, (a, b) => { // a, b are datum
      const distanceA = getDistanceFromHoveredDate(a);
      const distanceB = getDistanceFromHoveredDate(b);
      // console.log(`${format(distanceA)} - ${format(distanceB)} = ${format(distanceA-distanceB)}`);
      return distanceA - distanceB;
    });
    const closestDataPoint = dataset[closestIndex];
    // console.log(mousePosition, hoveredDate.toString(), closestIndex, closestDataPoint.date);

    // Get values for the tooltip.
    const closestXValue = xAccessor(closestDataPoint);  // Date
    const closestYValue = yAccessor(closestDataPoint);  // Minimum temp

    const formatDate = d3.timeFormat("%A, %B %-d, %Y");
    tooltip.select("#date")
      .text(formatDate(closestXValue));

    const onePointFormat = d3.format(".1f");
    const formatTemperature = d => `${onePointFormat(d)}°F`;
    tooltip.select("#temperature")
      .html(formatTemperature(closestYValue));  // html() to displaay ° right.

    // Position the tooltip.
    const x = xScale(closestXValue) + dimensions.margin.left;
    const y = yScale(closestYValue) + dimensions.margin.top;
    tooltip.style("transform", "translate("
      + `calc( -50% + ${x}px),`
      + `calc(-100% + ${y}px))`);
    tooltip.style("opacity", 1);

    tooltipCircle
      .attr("cx", xScale(closestXValue))
      .attr("cy", yScale(closestYValue));
    tooltipCircle.style("opacity", 1);
  }
  function onMouseLeave() {
    tooltip.style("opacity", 0);
    tooltipCircle.style("opacity", 0);
  }
}
drawLineChart();
