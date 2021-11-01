async function drawScatter() {
  let dataset = await d3.json("../nyc_weather_data.json");
  // console.table(dataset[0]);

  /** dewPoint  */
  const xAccessor = d => d.dewPoint;
  /** humidity  */
  const yAccessor = d => d.humidity;
  /** cloudCover color */
  const colorAccessor = d => d.cloudCover;

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
    }px)`); // God, don't forget to add px and parens in the right spots!

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

  const colorScale = d3.scaleLinear()
    .domain(d3.extent(dataset, colorAccessor))
    .range(["skyblue", "darkslategrey"]);

  /**
   * BAD STYLE
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
   * GOOD STYLE
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
    .attr("fill", d => colorScale(colorAccessor(d)));

  /**
   * EXERCISE IN DATA JOIN:
   * This function and the calls to it show the utility of the data join. Even
   * though we attempt to load [0, 200] and [0, 364] D3 maintains efficiency by
   * only loading the dots that still need to be "entered", which is found
   * through .enter().
   */
  function drawDots(dataset, color) {
    const dots = bounds.selectAll("circle").data(dataset);

    // Efficient (normal) version using enter().
    dots.enter().append("circle")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 5)
      .attr("fill", color);

    // Alternatively, this version would change all colors on new calls:
    /*
    dots.enter().append("circle");
    bounds.selectAll("circle")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 5)
      .attr("fill", color);
    */

    // This version would merge all dots into entered dots, again, updating everything.
    /*
    dots.enter().append("circle")
      .merge(dots)  // All the dots.
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 5)
      .attr("fill", color);
    */

    // This version, using .join(), is the modern short-cut version of the previous two.
    /*
    dots.join("circle")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 5)
      .attr("fill", color);
    */
  }

  function twoDrawsExercise() { // eslint-disable-line no-unused-vars
    drawDots(dataset.slice(0, 200), "darkgrey");
    setTimeout(() => {
      drawDots(dataset, "cornflowerblue");
    }, 1000);
  }
  // twoDrawsExercise();

  // (EXERCISE END)

  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const xAxisLabel = xAxis.append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")  // Necessary because <g> passes down "none".
    .style("font-size", "1.4em")
    .html("Dew point (&deg;F)");

  /**
   * ticks() is a suggestion. tickValues() lets you define them exactly. d3
   * attempts to follow your desire but will use nicer values if it thinks it'll
   * work better.
   * Docs -> https://github.com/d3/d3-axis#axis_ticks
   * Source -> https://github.com/d3/d3-array/blob/main/src/ticks.js#L43
   */
  const yAxisGenerator = d3.axisLeft().scale(yScale).ticks(4);
  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yAxisLabel = yAxis.append("text")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text("Relative humidity")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");
}

drawScatter();
