async function drawChart() {

  // 1. Access data

  let dataset = await d3.json("../../resources/nyc_weather_data.json");

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

  const bounds = wrapper.append("g")
      .style(
        "transform",
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`,
      );

  // 4. Create scales


  // 5. Draw data


  // 6. Draw peripherals


  // 7. Set up interactions


}
drawChart();
