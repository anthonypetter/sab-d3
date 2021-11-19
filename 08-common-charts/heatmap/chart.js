async function drawScatter() {

  // 1. Access data

  let dataset = await d3.json("../../resources/nyc_weather_data.json");

  const parseDate = d3.timeParse("%Y-%m-%d");
  const dateAccessor = d => parseDate(d.date);
  dataset = dataset.sort((a,b) => dateAccessor(a) - dateAccessor(b));

  const firstDate = dateAccessor(dataset[0]);
  const weekFormat = d3.timeFormat("%-e");
  const xAccessor = d => d3.timeWeeks(firstDate, dateAccessor(d)).length;
  const dayOfWeekFormat = d3.timeFormat("%-w");
  const yAccessor = d => +dayOfWeekFormat(dateAccessor(d));


  // 2. Create chart dimensions

  const numberOfWeeks = Math.ceil(dataset.length / 7) + 1;
  let dimensions = {
    margin: {
      top: 30,
      right: 0,
      bottom: 0,
      left: 80,
    },
  };
  dimensions.width = (
    window.innerWidth - dimensions.margin.left - dimensions.margin.right
  ) * 0.95;
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left - dimensions.margin.right;
  dimensions.height = dimensions.boundedWidth * 7 / numberOfWeeks
    + dimensions.margin.top + dimensions.margin.bottom;
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top - dimensions.margin.bottom;

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

  const barPadding = 1;
  const totalBarDimension = d3.min([
    dimensions.boundedWidth / numberOfWeeks,
    dimensions.boundedHeight / 7,
  ]);
  const barDimension = totalBarDimension - barPadding;

  // 5. Draw data

  const monthFormat = d3.timeFormat("%b");
  const months = bounds.selectAll(".month")
    .data(d3.timeMonths(dateAccessor(dataset[0]), dateAccessor(dataset[dataset.length - 1])))
    .join("text")
      .attr("class", "month")
      .attr("transform", d =>
        `translate(${totalBarDimension * d3.timeWeeks(firstDate, d).length}, -10)`,
      )
      .text(d => monthFormat(d));

  const dayOfWeekParse = d3.timeParse("%-e");
  const dayOfWeekTickFormat = d3.timeFormat("%-A");
  const labels = bounds.selectAll(".label")
    .data(new Array(7).fill(null).map((_,i) => i))
    .join("text")
      .attr("class", "label")
      .attr("transform", d => `translate(-10, ${totalBarDimension * (d + 0.5)})`)
      .text(d => dayOfWeekTickFormat(dayOfWeekParse(d)));

  const drawDays = (metric) => {
    d3.select("#metric")
      .text(metric);
    const colorAccessor = d => d[metric];
    const colorRangeDomain = d3.extent(dataset, colorAccessor);
    const colorRange = d3.scaleLinear()
      .domain(colorRangeDomain)
      .range([0, 1])
      .clamp(true);
    const colorGradient = d3.interpolateHcl("#ecf0f1", "#5758BB");
    const colorScale = d => colorGradient(colorRange(d) || 0);

    d3.select("#legend-min")
      .text(colorRangeDomain[0]);
    d3.select("#legend-max")
      .text(colorRangeDomain[1]);
    d3.select("#legend-gradient")
      .style("background", `linear-gradient(to right, ${
        new Array(10).fill(null).map((d, i) => (
          `${colorGradient(i / 9)} ${i * 100 / 9}%`
        )).join(", ")
      })`);

    const days = bounds.selectAll(".day")
      .data(dataset, d => d.date);

    const newDays = days.enter().append("rect");

    const allDays = newDays.merge(days)
        .attr("class", "day")
        .attr("x", d => totalBarDimension * xAccessor(d))
        .attr("width", barDimension)
        .attr("y", d => totalBarDimension * yAccessor(d))
        .attr("height", barDimension)
        .style("fill", d => colorScale(colorAccessor(d)))
      .on("mouseenter", onMouseEnter)
      .on("mouseleave", onMouseLeave);

    const oldDays = days.exit()
        .remove();
  };

  const metrics = [
    "moonPhase",
    "windSpeed",
    "dewPoint",
    "humidity",
    "uvIndex",
    "windBearing",
    "temperatureMin",
    "temperatureMax",
  ];

  let selectedMetricIndex = 0;
  drawDays(metrics[selectedMetricIndex]);

  const button = d3.select("#heading")
    .append("button")
      .text("Change metric");

  button.node().addEventListener("click", onClick);
  function onClick() {
    selectedMetricIndex = (selectedMetricIndex + 1) % metrics.length;
    drawDays(metrics[selectedMetricIndex]);
  }

  const tooltip = d3.select("#tooltip");
  const formatDate = d3.timeFormat("%b %-d");

  function onMouseEnter(_, datum) {
    tooltip.style("opacity", 1);
    const value = datum[metrics[selectedMetricIndex]];
    const dateString = formatDate(dateAccessor(datum));

    tooltip.select("#date")
      .text(dateString);
    tooltip.select("#value")
      .text(value);

    const x = dimensions.margin.left
      + (totalBarDimension * xAccessor(datum)) + totalBarDimension / 2;
    const y = dimensions.margin.top
      + (totalBarDimension * yAccessor(datum)) + totalBarDimension / 2;

    tooltip.style("transform", "translate("
      + `calc( -50% + ${x}px),`
      + `calc(-100% + ${y}px))`,
    );
  }
  function onMouseLeave() {
    console.log("Leave");
    tooltip.style("opacity", 0);
  }
}
drawScatter();
