async function drawLineChart() {

  // 1. Access data

  let dataset = await d3.json("./../resources/nyc_weather_data.json");

  const yAccessor = d => d.humidity;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const dateFormatter = d3.timeFormat("%Y-%m-%d");
  const xAccessor = d => dateParser(d.date);
  dataset = dataset.sort((a,b) => xAccessor(a) - xAccessor(b));
  const weeks = d3.timeWeeks(xAccessor(dataset[0]), xAccessor(dataset[dataset.length - 1]));
  const downsampledData = downsampleData(dataset, xAccessor, yAccessor);

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
      .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

  const defs = bounds.append("defs");

  // 4. Create scales

  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  const xScale = d3.scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  // 5. Draw data

  // Make a seasons background color guide.
  const seasonBoundaries = ["3-20", "6-21", "9-21", "12-21"];
  const seasonNames = ["Spring", "Summer", "Autumn", "Winter"];

  let seasonsData = [];
  const startDate = xAccessor(dataset[0]);
  const endDate = xAccessor(dataset[dataset.length - 1]);

  /**
   * Using .offset() forces getting two years ago. No matter the timeframe, -13
   * months will get you at least two years in the past. I believe that the
   * function needs to have the ENTIRE year offset to provide it. So, if we're
   * using data that starts Jan 1 2018 we need to go back to Dec 1 2016 (13
   * months earlier) to get 2017 to the end of 2018. We need 2017 because of the
   * way our loop works is that we need the dimension of the first season on the
   * graph: the start of winter on 2017-12-21.
   */
  const years = d3.timeYears(d3.timeMonth.offset(startDate, -13), endDate);
  console.log(years);
  console.log(d3.timeMonth.offset(startDate, -13));
  years.forEach((yearDate) => {
    const year = +d3.timeFormat("%Y")(yearDate);  // Force the date number.
    seasonBoundaries.forEach((boundary, index) => {
      const seasonStart = dateParser(`${year}-${boundary}`);
      const seasonEnd = seasonBoundaries[index + 1] ? // If we're not at the end.
        dateParser(`${year}-${seasonBoundaries[index + 1]}`) :
        dateParser(`${year + 1}-${seasonBoundaries[0]}`); // Next year's spring.

      const boundaryStart = d3.max([startDate, seasonStart]); // Left hugging.
      const boundaryEnd = d3.min([endDate, seasonEnd]); // Right hugging.

      // Get the days from dataset that lie between boundaries (ending inclusive).
      const days = dataset.filter(d =>
        xAccessor(d) > boundaryStart && xAccessor(d) <= boundaryEnd);
      if (!days.length) return; // No days selected.

      seasonsData.push({
        start: boundaryStart,
        end: boundaryEnd,
        name: seasonNames[index],
        mean: d3.mean(days, yAccessor), // Mean of season.
      });
    });
  });

  const seasonOffset = 10;
  const seasons = bounds.selectAll(".season")
      .data(seasonsData)
    .enter().append("rect")
      .attr("x", d => xScale(d.start))
      .attr("width", d => xScale(d.end) - xScale(d.start))
      .attr("y", seasonOffset)
      .attr("height", dimensions.boundedHeight - seasonOffset)
      .attr("class", d => `season ${d.name}`);


  const dots = bounds.selectAll(".dot")
    .data(dataset)
    .enter().append("circle")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 2)
      .attr("class", "dot");

  const lineGenerator = d3.area()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)))
    .curve(d3.curveBasis);

  const line = bounds.append("path")
      .attr("class", "line")
      .attr("d", lineGenerator(downsampledData));


  // 6. Draw peripherals

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(3);

  const yAxis = bounds.append("g")
      .attr("class", "y-axis")
    .call(yAxisGenerator);

  const yAxisLabel = yAxis.append("text")
      .attr("y", -dimensions.margin.left + 10)
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("class", "y-axis-label")
      .text("relative humidity");

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .ticks();

  const xAxis = bounds.append("g")
      .attr("class", "x-axis")
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);
}
drawLineChart();


function downsampleData(data, xAccessor, yAccessor) {
  const weeks = d3.timeWeeks(xAccessor(data[0]), xAccessor(data[data.length - 1]));

  return weeks.map((week, index) => {
    const weekEnd = weeks[index + 1] || new Date();
    const days = data.filter(d => xAccessor(d) > week && xAccessor(d) <= weekEnd);
    return {
      date: d3.timeFormat("%Y-%m-%d")(week),
      humidity: d3.mean(days, yAccessor),
    };
  });
}
