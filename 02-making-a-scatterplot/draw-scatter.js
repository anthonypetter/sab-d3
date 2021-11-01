async function drawScatter() {
  let dataset = await d3.json("../nyc_weather_data.json");
  // console.table(dataset[0]);

  /** dewPoint  */
  const xAccessor = d => d.dewPoint;
  /** humidity  */
  const yAccessor = d => d.humidity;

  /**
   * There is a native browser method (Math.min) that will also find the lowest
   * number — why wouldn't we use that? Math.min is great, but there are a few
   * benefits to d3.min:
   * - Math.min will count any nulls or undefineds in the array as 0, whereas
   *    d3.min will ignore them
   * - Math.min will return NaN if there is a value in the array that can't be
   *    converted into a number, whereas d3.min will ignore it
   * - d3.min will prevent the need to create another array of values if we need
   *    to use an accessor function
   * - Math.min will return Infinity if the dataset is empty, whereas d3.min will
   *    return undefined
   * - Math.min uses numeric order, whereas d3.min uses natural order, which
   *    allows it to handle strings
   *
   * You can see how d3.min would be preferable when creating charts, especially
   * when using dynamic data.
   */
  const width = d3.min([
    window.innerWidth * 0.9,
    window.innerHeight * 0.9,
  ]);

  /**
   * We were introduced to the concept of wrapper and bounds in Chapter 1.
   * As a reminder:
   * - The wrapper is your entire SVG element, containing your axes, data
   *    elements, and legends
   * - The bounds live inside of the wrapper, containing just the data elements
   */
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 50,
    },
    boundedWidth: 0,
    boundedHeight: 0,
  };
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left  // Pushes right
    }px, ${
      dimensions.margin.top   // Pushes down
    })`);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();  // This makes a domain of [11.8, 77.26] become [10, 80]. Better.

  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();  // This makes a domain of [0.31, 0.97] become [0.3, 1]. Better.

  // console.log(d3.extent(dataset, yAccessor)); // [0.31, 0.97]
  // console.log(yScale.domain());               // [0.3, 1]

  /**
   * While this method of drawing the dots works for now, there are a few issues
   * we should address.
   * We're adding a level of nesting, which makes our code harder to follow.
   * If we run this function twice, we'll end up drawing two sets of dots. When
   * we start updating our charts, we will want to draw and update our data with
   * the same code to prevent repeating ourselves.
   */
  // dataset.forEach(d => {
  //   bounds.append("circle")
  //     .attr("cx", xScale(xAccessor(d)))
  //     .attr("cy", yScale(yAccessor(d)))
  //     .attr("r", 5);
  // });

  /**
   * Let's do this instead...
   * When we call .data() on our selection, we're joining our selected elements
   * with our array of data points. The returned selection will have a list of
   * existing elements, new elements that need to be added, and old elements
   * that need to be removed.
   * Need to be added are listed under _enter. To be removed are under _exit.
   * To grab those values, use .enter() or .exit().
   */
  const dots = bounds.selectAll("circle")
    .data(dataset)
    .enter().append("circle")
    .attr("cx", d => xScale(xAccessor(d)))
    .attr("cy", d => yScale(yAccessor(d)))
    .attr("r", 5)
    .attr("fill", "cornflowerblue");

}

drawScatter();
