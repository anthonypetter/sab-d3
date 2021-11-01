async function drawLineChart() {
  const dataset = await d3.json("./../my_weather_data.json");
  console.table(dataset[0]);

  /**
   * Accessor functions!
   * These may seem like extra work, but in truth they're useful. Putting them
   * near the top of your d3 files is good practice so that changes to data
   * structures or whatever can be handled in one place. They're also good for
   * basic documentation: you can see what a file is all about just by looking
   * at the accessors.
   */
  const dateParser = d3.timeParse("%Y-%m-%d");
  const yAccessor = d => d.temperatureMax;
  const xAccessor = d => dateParser(d.date);

  console.log(xAccessor(dataset[0]));

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
}

drawLineChart();
