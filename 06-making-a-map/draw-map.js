async function drawMap() {
  const countryShapes = await d3.json("../resources/world-geojson.json");
  const dataset = await d3.csv("../resources/data_bank_data.csv");

  const countryNameAccessor = d => d.properties["NAME"];
  const countryIdAccessor = d => d.properties["ADM0_A3_IS"];
  const metric = "Population growth (annual %)";

  let metricDataByCountry = {};
  dataset.forEach(d => {
    if (d["Series Name"] != metric) {
      return;
    }
    // Prepending + to a value is a shorthand way to cast a string into a number.
    metricDataByCountry[d["Country Code"]] = +d["2020 [YR2020]"] || 0;
  });

  // Create chart dimensions
  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 0,  // Will calculate after getting map dimensions...
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    },
    boundedWidth: 0,
    boundedHeight: 0,
  };
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left - dimensions.margin.right;

  /*
   * Some map projections to consider...
   * d3.geoMercator() The classic and wonky.
   * d3.geoTransverseMercator() Good for zoomed-in areas.
   * d3.geoRobinson() Visually pleasing.
   * d3.geoEqualEarth() Like Robinson, but equal areas. Author uses this.
   * d3.geoWinkel3() Poles are weird, but the sizes and shapes are good.
   * d3.geoOrthographic() It's a picture of a globe.
   */
  const sphere = ({ type: "Sphere" });
  const projection = d3.geoEqualEarth()
    .fitWidth(dimensions.boundedWidth, sphere);
  const pathGenerator = d3.geoPath(projection); // Like d3.line() in Ch1.
  const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere);  // Gives us our bounds.

  // Now we can get the boundedHeight, finally!
  dimensions.boundedHeight = y1;
  dimensions.height = dimensions.boundedHeight
    + dimensions.margin.top + dimensions.margin.bottom;

  // Draw Canvas
  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.top
    }px)`);

  // Create scales
  const metricValues = Object.values(metricDataByCountry);
  const metricValueExtent = d3.extent(metricValues);  // [-1.72056466408314, 4.12416960622934]

  /**
   * Using color to indicate positive and negative values is a "diverging color
   * scale". More detail on this is covered in the next chapter.
   * Do note that we have a chance to ignore this "maxChange" aspect, where, say,
   * the max increase is 5% and the max decrease is -2% and make our color range
   * fully -2, 0, 5. But we decided that it'd make some more consistent sense
   * to make our range -5, 0, 5 (using example percentages) so that different
   * rates of color change don't cause confusion.
   */
  const maxChange = d3.max([-metricValueExtent[0], metricValueExtent[1]]);
  const colorScale = d3.scaleLinear()
    .domain([-maxChange, 0, maxChange])
    .range(["indigo", "white", "darkgreen"]); // Color blind considerations!

  const earth = bounds.append("path")
    .attr("class", "earth")
    .attr("d", pathGenerator(sphere));

  /**
   * A graticule is the thin grid we use for latitude and longitude.
   * d3.geoGraticule10() is for a line every 10 deg.
   * I think this is a nice little demonstration of how the projection works.
   * We're feeding it data that is just a bunch of straight lines (36 latitude,
   * 18 longitude) in a grid pattern. The projector then morphs it through a
   * transform algorithm.
   */
  const graticuleJson = d3.geoGraticule10();
  const graticule = bounds.append("path")
    .attr("class", "graticule")
    .attr("d", pathGenerator(graticuleJson));

  /**
   * Remember, it may just appear that we're selecting all elements with the
   * class ".country" when none yet exist, it's just a selector object that
   * we're priming to bind similar elements.
   * .join() works like it does for strings. We're putting a new "path" element
   * for all the things we select.
   */
  const countries = bounds.selectAll(".country")
    .data(countryShapes.features)
    .join("path")
      .attr("class", "country")
      .attr("d", pathGenerator) // Same as `.attr("d", d => pathGenerator(d))`
      .attr("fill", d => {
        const metricValue = metricDataByCountry[countryIdAccessor(d)];
        if (typeof metricValue == "undefined") {
          return "#e2e6e9";
        }
        return colorScale(metricValue);
      });
}
drawMap();
