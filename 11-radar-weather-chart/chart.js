async function drawChart() {

  const TEMPERATURE_TICKS = 4;
  const UV_INDEX_THRESHOLD = 8;

  // 1. Access data

  let dataset = await d3.json("../../resources/nyc_weather_data.json");
  console.table(dataset[0]);

  const dateParser = d3.timeParse("%Y-%m-%d");

  const temperatureMinAccessor = d => d.temperatureMin;
  const temperatureMaxAccessor = d => d.temperatureMax;
  const uvAccessor = d => d.uvIndex;
  const precipitationProbabilityAccessor = d => d.precipProbability;
  const precipitatioTypeAccessor = d => d.precipType;
  const cloudAccessor = d => d.cloudCover;
  const dateAccessor = d => dateParser(d.date);

  // 2. Create chart dimensions

  const width = 600;
  const dimensions = {
    width: width,
    height: width,
    radius: width / 2,
    margin: {
      top: 120,
      right: 120,
      bottom: 120,
      left: 120,
    },
    boundedHeight: 0,
    boundedWidth: 0,
    boundedRadius: 0,
  };
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top - dimensions.margin.bottom;
  dimensions.boundedRadius = dimensions.radius
    - ((dimensions.margin.left + dimensions.margin.right) / 2);

  // 3. Draw canvas

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);


  /**
   * We make a conscious decision to move the bounds of our chart to the center
   * so that we don't have to shift everything by [boundedRadius, boundedRadius]
   * all the time.
   */
  const bounds = wrapper.append("g")
      .style(
        "transform",
        `translate(${
          dimensions.margin.left + dimensions.boundedRadius
        }px, ${
          dimensions.margin.top + dimensions.boundedRadius
        }px)`,
      );

  // Creating gradients.
  const defs = wrapper.append("defs");

  const gradientId = "temperature-gradient";
  const gradient = defs.append("radialGradient")
      .attr("id", gradientId);
  const numberOfStops = 10;
  const gradientColorScale = d3.interpolateYlOrRd;
  d3.range(numberOfStops).forEach(i => {
    gradient.append("stop")
        .attr("offset", `${i * 100 / (numberOfStops - 1)}%`)
        .attr("stop-color", gradientColorScale(i / (numberOfStops - 1)));
  });

  // 4. Create scales

  const angleScale = d3.scaleTime()
    .domain(d3.extent(dataset, dateAccessor))
    .range([0, Math.PI * 2]); // In radians.

  const radiusScale = d3.scaleLinear()
    .domain(d3.extent([ // Min and Max temps - for a full range.
      ...dataset.map(temperatureMaxAccessor),
      ...dataset.map(temperatureMinAccessor),
    ]))
    .range([0, dimensions.boundedRadius])
    .nice();

  // Using the square root scale to correctly size a two dimensional chart.
  const cloudRadiusScale = d3.scaleSqrt()
    .domain(d3.extent(dataset, cloudAccessor))
    .range([1, 10]);

  // 5. Draw peripherals
  const peripherals = bounds.append("g");

  // How to get a range of months from the domain we're using.
  // const months = d3.timeMonth.range(...angleScale.domain()); // Long version.
  const months = d3.timeMonths(...angleScale.domain()); // Shortcut version.

  /**
   * Draw the month spokes.
   * Not sure how to fix it but the chart's spokes are not exactly straight.
   * There is a tiny rotation in all spokes, even the ones facing in a cardinal
   * direction. I tried using utcParse in my date accessor but it doesn't seem
   * to work.
   */
  months.forEach(month => {
    const angle = angleScale(month);
    const [x, y] = getCoordinatesForAngle(angle);

    peripherals.append("line") // x1 and y1 default to 0. Which we need.
        .attr("x2", x)
        .attr("y2", y)
        .attr("class", "grid-line");

    const [labelX, labelY] = getCoordinatesForAngle(angle, 1.38);
    peripherals.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("class", "tick-label")
        .text(d3.timeFormat("%b")(month))
        .style("text-anchor",
          Math.abs(labelX) < 5 ? "middle" : // Within 5 pixels of vertical.
            labelX > 0 ? "start" :  // To the right.
              "end",                // Else (to the left).
        );
  });

  const temperatureTicks = radiusScale.ticks(TEMPERATURE_TICKS);
  const gridCircles = temperatureTicks.map(d => (
    peripherals.append("circle")
        .attr("r", radiusScale(d))
        .attr("class", "grid-line")
  ));

  const tickLabelBackgrounds = temperatureTicks.map(d => {
    if (!d) return;
    return peripherals.append("rect")
        .attr("y", -radiusScale(d) - 10)
        .attr("width", 40)
        .attr("height", 20)
        .attr("class", "tick-label-background");
  });

  const tickLabels = temperatureTicks.map(d => {
    if (!d) return;
    return peripherals.append("text")
        .attr("x", 4)
        .attr("y", -radiusScale(d) + 2)
        .attr("class", "tick-label-temperature")
        .html(`${d3.format(".0f")(d)}°F`);
  });

  const containsFreezing = radiusScale.domain()[0] < 32;
  if (containsFreezing) {
    const freezingCircle = bounds.append("circle")
        .attr("r", radiusScale(32))
        .attr("class", "freezing-circle");
  }


  // 6. Draw data
  /**
   * Adding the temperature area around the center of the chart is surprisingly
   * simple. The gradient color, though, is a bit involved. Look above to see
   * how it's defined.
   */
  const areaGenerator = d3.areaRadial()
      .angle(d => angleScale(dateAccessor(d)))
      .innerRadius(d => radiusScale(temperatureMinAccessor(d)))
      .outerRadius(d => radiusScale(temperatureMaxAccessor(d)));

  const area = bounds.append("path")
      .attr("class", "area")
      .attr("d", areaGenerator(dataset))
      .style("fill", `url(#${gradientId})`);

  /**
   * This is also pleasantly easy to accomplish. With some foresight into
   * writing good utility functions and leveraging our scales and accessors
   * things really come together quite easily.
   */
  const uvGroup = bounds.append("g");
  const uvOffset = 0.95;
  const highUvDays = uvGroup.selectAll("line")
    .data(dataset.filter(d => uvAccessor(d) > UV_INDEX_THRESHOLD))
    .join("line")
      .attr("class", "uv-line")
      .attr("x1", d => getXFromDataPoint(d, uvOffset))
      .attr("x2", d => getXFromDataPoint(d, uvOffset + 0.1))
      .attr("y1", d => getYFromDataPoint(d, uvOffset))
      .attr("y2", d => getYFromDataPoint(d, uvOffset + 0.1));

  // Cloud cover
  const cloudGroup = bounds.append("g");
  const cloudOffset = 1.27;
  const cloudDots = cloudGroup.selectAll("circle")
    .data(dataset)
    .join("circle")
      .attr("class", "cloud-dot")
      .attr("cx", d => getXFromDataPoint(d, cloudOffset))
      .attr("cy", d => getYFromDataPoint(d, cloudOffset))
      .attr("r", d => cloudRadiusScale(cloudAccessor(d)));

  // 7. Set up interactions



  // Helper functions

  /**
   * Get the x, y coordinates of any angle you place in here, rotated to the
   * left 90° (in the 12 o'clock position). You can provide an offset to extend
   * or shorten any desired coordinate.
   * @param {number} angle radians
   * @param {number} offset multiplier of the distance from the center
   * @returns
   */
  function getCoordinatesForAngle(angle, offset = 1) {
    return [
      Math.cos(angle - Math.PI / 2) * dimensions.boundedRadius * offset,
      Math.sin(angle - Math.PI / 2) * dimensions.boundedRadius * offset,
    ];
  }

  function getCoordinatesFromDataPoint(d, offset) {
    return getCoordinatesForAngle(
      angleScale(dateAccessor(d)),
      offset,
    );
  }
  function getXFromDataPoint(d, offset = 1.4) {
    return getCoordinatesFromDataPoint(d, offset)[0];
  }
  function getYFromDataPoint (d, offset = 1.4) {
    return getCoordinatesFromDataPoint(d, offset)[1];
  }
}
drawChart();
