async function drawTable() {
  // load data
  const dateParser = d3.timeParse("%Y-%m-%d");
  const dateAccessor = d => dateParser(d.date);
  let dataset = await d3.json("../../resources/nyc_weather_data.json");
  dataset = dataset.sort((a,b) => dateAccessor(a) - dateAccessor(b));

  const table = d3.select("#table");

  const dateFormat = d => d3.timeFormat("%-m/%d")(dateParser(d));
  const hourFormat = d => d3.timeFormat("%-I %p")(new Date(d * 1000));
  const format24HourTime = d => +d3.timeFormat("%H")(new Date(d * 1000));

  const numberOfRows= 60;
  const colorScale = d3.interpolateHcl("#a6c3e8", "#efa8a1");
  const grayColorScale = d3.interpolateHcl("#fff", "#bdc4ca");

  const tempScale = d3.scaleLinear()
    .domain(d3.extent(dataset.slice(0, numberOfRows), d => d.temperatureMax))
    .range([0, 1]); // See? This makes our scale go from 0 to 1. Easy!
  const timeScale = d3.scaleLinear()
    .domain([0, 24])
    .range([0, 80]);  // Magic number. Max at 80%. Any higher and padding (?) pushes it off the edge.
  const windScale = d3.scaleLinear()
    .domain(d3.extent(dataset.slice(0, numberOfRows), d => d.windSpeed))
    .range([0, 1]); // 0, 1 range makes us able to plug it into any color scale!

  const columns = [
    {
      label: "Day",
      type: "text",
      format: d => dateFormat(d.date),
    },
    {
      label: "Summary",
      type: "text",
      format: d => d.summary,
    },
    {
      label: "Max Temp",
      type: "number",
      format: d => d3.format(".1f")(d.temperatureMax),
      background: d => colorScale(tempScale(d.temperatureMax)),
    },
    {
      label: "Max Temp Time",
      type: "marker",
      format: d => "|",
      transform: d => `translateX(${timeScale(format24HourTime(d.apparentTemperatureMaxTime))}%)`,
    },
    {
      label: "Wind Speed",
      type: "number",
      format: d => d.windSpeed,
      background: d => grayColorScale(windScale(d.windSpeed)),
    },
    {
      label: "Precipitation",
      type: "text",
      format: d => d.precipType,
    },
    {
      label: "UV Index",
      type: "number",
      format: d => d.uvIndex,
    },
  ];

  table.append("thead").append("tr")
    .selectAll("thead")
    .data(columns)
    .enter().append("th")
      .text(d => d.label)
      .attr("class", d => d.type);

  const body = table.append("tbody");

  dataset.slice(0, numberOfRows).forEach(d => {
    body.append("tr")
      .selectAll("td")
      .data(columns)
      .enter().append("td")
        .text(column => column.format(d))
        .attr("class", column => column.type)
        .style("background", column => column.background && column.background(d))
        .style("transform", column => column.transform && column.transform(d));
  });
}
drawTable();
