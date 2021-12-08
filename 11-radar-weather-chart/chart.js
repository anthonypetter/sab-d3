async function drawChart() {

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

  // 4. Create scales

  const angleScale = d3.scaleTime()
      .domain(d3.extent(dataset, dateAccessor))
      .range([0, Math.PI * 2]); // In radians.


  // 5. Draw data


  // 6. Draw peripherals
  const peripherals = bounds.append("g");

  // How to get a range of months from the domain we're using.
  // const months = d3.timeMonth.range(...angleScale.domain()); // Long version.
  const months = d3.timeMonths(...angleScale.domain()); // Shortcut version.

  /**
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
  });


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
}
drawChart();
