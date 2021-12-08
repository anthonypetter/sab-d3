async function drawScatter() {

  // 1. Access data

  const dataset = await d3.json("../../resources/nyc_weather_data.json");
  console.table(dataset[0]);

  // set data constants
  const xAccessor = d => d.temperatureMin;
  const yAccessor = d => d.temperatureMax;

  const COLOR_SCALE_YEAR = 2000;  // Force to be the same year. Forget about leap year issues.
  const parseDate = d3.timeParse("%Y-%m-%d");
  const colorAccessor = d => parseDate(d.date).setYear(COLOR_SCALE_YEAR);

  // Collection of the "midpoints" of each season (Northern Hemisphere).
  const WINTER_DATE = parseDate(`${COLOR_SCALE_YEAR}-02-03`); // Winter
  const SPRING_DATE = parseDate(`${COLOR_SCALE_YEAR}-05-06`); // Spring
  const SUMMER_DATE = parseDate(`${COLOR_SCALE_YEAR}-08-07`); // Summer
  const AUTUMN_DATE = parseDate(`${COLOR_SCALE_YEAR}-10-31`); // Autumn

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
    histogramMargin: 10,
    histogramHeight: 70,
    legendWidth: 250,
    legendHeight: 26,
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
   * being the depth of autumn.
   * I then used an online tool to get me the middle point in the gradient
   * between Autumn and Winter and named it "New Years".
   */
  const colorScale = d3.scaleLinear()
    .domain([
      parseDate(`${COLOR_SCALE_YEAR}-01-01`),  // New Years
      WINTER_DATE,  // Winter
      SPRING_DATE,  // Spring
      SUMMER_DATE,  // Summer
      AUTUMN_DATE,  // Autumn
      parseDate(`${COLOR_SCALE_YEAR}-12-31`),  // New Years
    ])
    .range([
      "#9b1f62",  // New Years
      "#483d8b",  // Winter
      "#00ff7f",  // Spring
      "#f2ba4a",  // Summer
      "#aa381e",  // Autumn
      "#9b1f62",  // New Years
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
      .style("fill", d => colorScale(colorAccessor(d)));

  // Top Histogram
  const topHistogramGenerator = d3.bin()
    .domain(xScale.domain())
    .value(xAccessor)
    .thresholds(20);

  const topHistogramBins = topHistogramGenerator(dataset);

  // Yes, we're creating a scale here and not up where the other scales are.
  const topHistogramYScale = d3.scaleLinear()
    .domain(d3.extent(topHistogramBins, d => d.length))
    .range([dimensions.histogramHeight, 0]);  // Y axis, so, [70, 0].

  const topHistogramBounds = bounds.append("g")
      .attr("transform", `translate(0, ${
        -dimensions.histogramHeight - dimensions.histogramMargin
      })`); // Move it up to the area at the top we want to use.

  /**
   * We use d3.area() because d3.line() doesn't have a bottom (unless we make
   * it, see what we did in the radar chart in ch 8). But that means that if
   * the Y axis of the first and last point are different you'll get a horrible
   * slicing effect.
   * Here we're giving the datum from the bins and using the bin's x0 and x1
   * positions in the xScale and finding the middle point between the two to be
   * our x. y0() is our floor (always the height, in this case). y1() is the
   * height of the datum we want to render.
   */
  const topHistogramLineGenerator = d3.area()
    .x(d => xScale((d.x0 + d.x1) / 2))
    .y0(dimensions.histogramHeight)
    .y1(d => topHistogramYScale(d.length))
    .curve(d3.curveBasis);

  const topHistogramElement = topHistogramBounds.append("path")
      .attr("d", _ => topHistogramLineGenerator(topHistogramBins))
      .attr("class", "histogram-area");

  // Right Historgram
  const rightHistorgramGenerator = d3.bin()
    .domain(yScale.domain())
    .value(yAccessor)
    .thresholds(20);

  const rightHistogramBins = rightHistorgramGenerator(dataset);

  const rightHistogramYScale = d3.scaleLinear()
    .domain(d3.extent(rightHistogramBins, d => d.length))
    .range([dimensions.histogramHeight, 0]);

  const rightHistogramBounds = bounds.append("g")
      .style("transform-origin", `0 ${dimensions.histogramHeight}px`)
      .style("transform", `translate(${
        dimensions.boundedWidth + dimensions.histogramMargin
      }px, -${
        dimensions.histogramHeight
      }px) rotate(90deg)`); // We're rotating the whole thing!

  const rightHistogramLineGenerator = d3.area()
    .x(d => yScale((d.x0 + d.x1) / 2))
    .y0(dimensions.histogramHeight)
    .y1(d => rightHistogramYScale(d.length))
    .curve(d3.curveBasis);

  const rightHistogramElement = rightHistogramBounds.append("path")
    .attr("d", _ => rightHistogramLineGenerator(rightHistogramBins))
    .attr("class", "histogram-area");

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

  /**
   * Creating the color gradient legend.
   * Something weird I realized. If you define your transform as a .style() you
   * need to use px values. But if its an attribute you just write the numbers.
   * Adding px to the transform below will break it.
   */
  const legendGroup = bounds.append("g")
      .attr("transform", `translate(${
        dimensions.boundedWidth - dimensions.legendWidth - 9
      }, ${
        dimensions.boundedHeight - 37
      })`);

  const defs = wrapper.append("defs");

  const numberOfGradientStops = 10;
  const stops = d3.range(numberOfGradientStops).map(
    i => (i / (numberOfGradientStops - 1)),
  );
  const legendGradientId = "legend-gradient";
  const gradient = defs.append("linearGradient")
      .attr("id", legendGradientId)
    .selectAll("stop")
    .data(stops)
    .join("stop")
      // .attr("stop-color", d => d3.interpolateRainbow(-d))
      .attr("stop-color", d => colorScale(
        colorAccessor({ date: fractionOfYear(d) }), // Yes. This is ridiculous.
      ))
      .attr("offset", d => `${d * 100}%`);
  const legendGradient = legendGroup.append("rect")
      .attr("height", dimensions.legendHeight)
      .attr("width", dimensions.legendWidth)
      .style("fill", `url(#${legendGradientId})`);

  // Adding ticks to the legend.
  const tickValues = [WINTER_DATE, SPRING_DATE, SUMMER_DATE, AUTUMN_DATE];
  const legendTickScale = d3.scaleLinear()
      // .domain(colorScale.domain()) // Doesn't work. Due to multiple domains?
      .domain([
        parseDate(`${COLOR_SCALE_YEAR}-01-01`),
        parseDate(`${COLOR_SCALE_YEAR}-12-31`),
      ])
      .range([0, dimensions.legendWidth]);
  const legendValues = legendGroup.selectAll(".legend-value")
    .data(tickValues)
    .join("text")
      .attr("class", "legend-value")
      .attr("x", legendTickScale)
      .attr("y", -6)
      .text(d3.timeFormat("%b %-d"));
  const legendValueTicks = legendGroup.selectAll(".legend-tick")
    .data(tickValues)
    .join("line")
      .attr("class", "legend-tick")
      .attr("x1", legendTickScale)
      .attr("x2", legendTickScale)
      .attr("y1", 6)
      .attr("y2", -2);


  // 7. Set up interactions
  // Day Dots interactions.
  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d)),
  );
  const voronoiPolygons = delaunay.voronoi();
  voronoiPolygons.xmax = dimensions.boundedWidth;
  voronoiPolygons.ymax = dimensions.boundedHeight;

  const voronoi = dotsGroup.selectAll(".voronoi")
    .data(dataset)
      .join("path")
      .attr("class", "voronoi")
      // .attr("stroke", "grey")
      .attr("d", (_d, i) => voronoiPolygons.renderCell(i));

  voronoi.on("mouseenter", onVoronoiMouseEnter)
    .on("mouseleave", onVoronoiMouseLeave);

  const tooltip = d3.select("#tooltip");
  const hoverElementsGroup = bounds.append("g")
    .attr("opacity", 0);

  const dayDot = hoverElementsGroup.append("circle")
      .attr("class", "tooltip-dot");

  const horizontalLine = hoverElementsGroup.append("rect")
      .attr("class", "hover-line");
  const verticalLine = hoverElementsGroup.append("rect")
      .attr("class", "hover-line");

  function onVoronoiMouseEnter(_e, datum) {
    hoverElementsGroup.style("opacity", 1);

    const x = xScale(xAccessor(datum));
    const y = yScale(yAccessor(datum));
    dayDot.attr("cx", _d => x)
        .attr("cy", _d => y)
        .attr("r", 7);

    const hoverLineThickness = 10;
    horizontalLine.attr("x", x)
      .attr("y", y - hoverLineThickness / 2)
      .attr("width", dimensions.boundedWidth
        + dimensions.histogramMargin
        + dimensions.histogramHeight
        - x)
      .attr("height", hoverLineThickness);
    verticalLine.attr("x", x - hoverLineThickness / 2)
      .attr("y", -dimensions.histogramMargin - dimensions.histogramHeight)
      .attr("width", hoverLineThickness)
      .attr("height", y
        + dimensions.histogramMargin
        + dimensions.histogramHeight);

    const formatTemperature = d3.format(".1f");
    tooltip.select("#max-temperature")
      .text(formatTemperature(yAccessor(datum)));
    tooltip.select("#min-temperature")
      .text(formatTemperature(xAccessor(datum)));

    const dateParser = d3.timeParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%A, %B %-d, %Y");
    tooltip.select("#date").text(formatDate(dateParser(datum.date)));

    tooltip.style("transform", "translate("
      + `calc(${x + dimensions.margin.left}px + -50%),`
      + `calc(${y + dimensions.margin.top - 4}px + -100%)`);

    tooltip.style("opacity", 1);
  }

  function onVoronoiMouseLeave() {
    hoverElementsGroup.style("opacity", 0);
    tooltip.style("opacity", 0);
  }


  // Legend hover interactions.
  const legendHighlightBarWidth = dimensions.legendWidth * 0.05;
  const legendHighlightGroup = legendGroup.append("g")
      .attr("opacity", 0);

  // We're setting these outside the function for performance reasons.
  const legendHighlightBar = legendHighlightGroup.append("rect")
      .attr("class", "legend-highlight-bar")
      .attr("width", legendHighlightBarWidth)
      .attr("height", dimensions.legendHeight);

  const legendHighlightText = legendHighlightGroup.append("text")
      .attr("class", "legend-highlight-text")
      .attr("x", legendHighlightBarWidth / 2)
      .attr("y", -6);

  legendGradient.on("mousemove", onLegendMouseMove)
    .on("mouseleave", onLegendMouseLeave);

  function onLegendMouseMove(e) {
    const [x] = d3.pointer(e);  // Get the x coord of pointer relative to e.

    /**
     * Median sorts the values given and gives the middle value (if given 3).
     * This is like how I used a minMax function long ago with Metric-Teacher.
     * What it basically does is it'll let you gate the value between a min and
     * max.
     */
    const barX = d3.median([
      0,
      x - legendHighlightBarWidth / 2,
      dimensions.legendWidth - legendHighlightBarWidth,
    ]);

    const minDateToHighlight = new Date(
      legendTickScale.invert(x - legendHighlightBarWidth),
    );
    const maxDateToHighlight = new Date(
      legendTickScale.invert(x + legendHighlightBarWidth),
    );

    legendHighlightGroup.style("opacity", 1)
        .style("transform", `translateX(${barX}px)`);

    const formatLegendDate = d3.timeFormat("%b %d");
    legendHighlightText.text([
      formatLegendDate(minDateToHighlight),
      formatLegendDate(maxDateToHighlight),
    ].join(" - "));

    legendValues.style("opacity", 0);
    legendValueTicks.style("opacity", 0);

    dots.transition().duration(100)
        .style("opacity", 0.08)
        .attr("r", 2);

    const getYear = d => +d3.timeFormat("%Y")(d);

    /**
     * Provides a boolean response to whether the current date is within range.
     * It also accounds for when you're looking at dates near the start and end
     * of the year. Depending if the min/max dates are a year below/above the
     * scale year we then shift the min/max year back to the scale year and do
     * the check from there.
     * @param {datum} d
     * @returns
     */
    const isDayWithinRange = (d) => {
      const date = colorAccessor(d);
      if (getYear(minDateToHighlight) < COLOR_SCALE_YEAR) {
        // If dates wrap around to PREVIOUS year,
        // check if this date is after the min date.
        return date >= new Date(minDateToHighlight)
          .setYear(COLOR_SCALE_YEAR) || date <= maxDateToHighlight;

      } else if (getYear(maxDateToHighlight) > COLOR_SCALE_YEAR) {
        // If dates wrap around to NEXT year,
        // check if this date is before the max date.
        return date <= new Date(maxDateToHighlight)
          .setYear(COLOR_SCALE_YEAR) || date >= minDateToHighlight;

      } else {
        // Not an edge case. So, just make sure the date is between min and max.
        return date >= minDateToHighlight && date <= maxDateToHighlight;
      }
    };

    const relevantDots = dots.filter(isDayWithinRange)
      .transition().duration(100)
        .style("opacity", 1)
        .attr("r", 5);

  }

  function onLegendMouseLeave() {
    dots.transition().duration(500)
        .style("opacity", 1)
        .attr("r", 4);

    legendValues.style("opacity", 1);
    legendValueTicks.style("opacity", 1);
    legendHighlightGroup.style("opacity", 0);
  }


  /**
   * Gives you the date within the year that corresponds (roughly) to whatever
   * fraction you give it.
   * Ex: If you give it 0.3 you'll get April 19th.
   * Uses local time because UTC isn't necessary.
   * @param {*} decimal The decimal fraction value of a calendar year.
   * @returns
   */
  function fractionOfYear(decimal) {
    // Yes, January is month 0.
    const startEpoch = new Date(COLOR_SCALE_YEAR, 0, 1) / 1000;
    const secondsInYear = 365 * 24 * 60 * 60;

    const resultDate = new Date(0).setSeconds((startEpoch + secondsInYear * decimal));
    const resultDateString = d3.timeFormat("%Y-%m-%d")(resultDate);
    console.log(decimal, resultDateString, (startEpoch + secondsInYear * decimal));
    return resultDateString;
  }
}
drawScatter();

