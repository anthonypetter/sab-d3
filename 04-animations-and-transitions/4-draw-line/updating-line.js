async function drawLineChart() {
  const TICK_RATE = 1000;
  const DAYS = 100; // Desired number of days you want to show at once.

  // 1. Access data
  let dataset = await d3.json("./../../nyc_weather_data.json");

  // 2. Create chart dimensions

  const yAccessor = d => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = d => dateParser(d.date);
  dataset = dataset.sort((a, b) => xAccessor(a) - xAccessor(b)).slice(0, DAYS + 1);

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
    .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

  /**
   * <defs> elements are used by SVG to store any re-usable definitions for later.
   * SVG can reference the elements kept inside by using their id values.
   * A clipPath is an element that will only paint inside its children elements.
   */
  bounds.append("defs")
    .append("clipPath")
      .attr("id", "bounds-clip-path")
    .append("rect")
      .attr("width", dimensions.boundedWidth)
      .attr("height", dimensions.boundedHeight);

  // init static elements
  bounds.append("rect")
    .attr("class", "freezing");

  // Place this clipPath here because z-index is set at append time.
  const clip = bounds.append("g")
    .attr("clip-path", "url(#bounds-clip-path)");
  clip.append("path") // Path is made a child of clip, not bounds.
    .attr("class", "line");

  bounds.append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
  bounds.append("g")
    .attr("class", "y-axis");

  const drawLine = (dataset) => {

    // 4. Create scales

    const yScale = d3.scaleLinear()
      .domain(d3.extent(dataset, yAccessor))
      .range([dimensions.boundedHeight, 0]);

    const freezingTemperaturePlacement = yScale(32);
    const freezingTemperatures = bounds.select(".freezing")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", freezingTemperaturePlacement)
      .attr("height", d3.max([0, dimensions.boundedHeight - freezingTemperaturePlacement]));

    const xScale = d3.scaleTime()
      .domain(d3.extent(dataset.slice(0, DAYS), xAccessor))
      .range([0, dimensions.boundedWidth]);

    // 5. Draw data

    const lineGenerator = d3.line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)));

    // Shift a moving line
    const lastTwoPoints = dataset.slice(-2);
    const pixelsBetweenLastPoints = xScale(xAccessor(lastTwoPoints[1]))
      - xScale(xAccessor(lastTwoPoints[0]));

    // This generates the line. Since we have DAYS + 1 of data, it shifts to the
    // left, hiding the exiting data point, and revealing the +1 point on the right.
    const line = bounds.select(".line")
        .attr("d", lineGenerator(dataset))
        .style("transform", "none")
      .transition().duration(TICK_RATE)
        .style("transform", `translateX(${-pixelsBetweenLastPoints}px)`);


    // 6. Draw peripherals

    const yAxisGenerator = d3.axisLeft()
      .scale(yScale);

    const yAxis = bounds.select(".y-axis")
      .call(yAxisGenerator);

    const xAxisGenerator = d3.axisBottom()
      .scale(xScale);

    const xAxis = bounds.select(".x-axis")
      .transition().duration(TICK_RATE)
      .call(xAxisGenerator);
  };

  // Draw the initial line.
  drawLine(dataset);

  // update the line on an interval
  setInterval(addNewDay, TICK_RATE * 1.5);
  function addNewDay() {
    dataset = [
      ...dataset.slice(1),
      generateNewDataPoint(dataset)
    ];
    drawLine(dataset);
  }

  function generateNewDataPoint(dataset) {
    const lastDataPoint = dataset[dataset.length - 1];
    const nextDay = d3.timeDay.offset(xAccessor(lastDataPoint), 1);

    return {
      date: d3.timeFormat("%Y-%m-%d")(nextDay),
      temperatureMax: yAccessor(lastDataPoint) + (Math.random() * 6 - 3),
    };
  }
}
drawLineChart();
