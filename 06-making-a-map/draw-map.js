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

  // Draw Canvas
  const container = d3.select("#wrapper");
  const wrapper = container.append("svg")
      .attr("width", dimensions.width);

  const bounds = wrapper.append("g");

  const sphere = ({ type: "Sphere" });

  const defs = bounds.append("defs");
  defs.append("clipPath")
      .attr("id", "bounds-clip-path")
    .append("path")
      .attr("class", "earth-clip-path");

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


  /**
   * A normal way to define a linearGradient involves defining new <stop>
   * elements inside a <linearGradient> element. We set the stop color to be
   * something like <stop stop-color="#12CBC4" offset="0%"></stop>.
   * For each stop we change the color and increase the offset. Such as 50% and
   * 100%. This elegent solution below uses a colorScale's range to become the
   * data we iterate through. We have three colors in the range (which are:
   * ["indigo", "white", "darkgreen"]) and provide a percentage offset that is
   * 0 * 100 / 2 (0%); 1 * 100 / 2 (50%), and 2 * 100 / 2 (100%).
   */
  const gradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .selectAll("stop")
    .data(colorScale.range())
    .join("stop")
    .attr("stop-color", d => d)
    .attr("offset", (d, i) => `${i * 100 / 2}%`); // 2 is one less than our array's length

  // Map projection selection section.
  const builtInProjections = [
    "geoAzimuthalEqualArea",
    "geoAzimuthalEquidistant",
    "geoGnomonic",
    "geoOrthographic",
    "geoStereographic",
    "geoEqualEarth",
    "geoAlbersUsa",
    "geoAlbers",
    "geoConicConformal",
    "geoConicEqualArea",
    "geoConicEquidistant",
    "geoEquirectangular",
    "geoMercator",
    "geoTransverseMercator",
    "geoNaturalEarth1",
  ];
  const geoProjectionProjections = [
    "geoAiry",
    "geoAitoff",
    "geoAlbers",
    "geoArmadillo",
    "geoAugust",
    "geoAzimuthalEqualArea",
    "geoAzimuthalEquidistant",
    "geoBaker",
    "geoBerghaus",
    "geoBertin1953",
    "geoBoggs",
    "geoBonne",
    "geoBottomley",
    "geoBromley",
    "geoChamberlin",
    "geoChamberlinAfrica",
    "geoCollignon",
    "geoConicConformal",
    "geoConicEqualArea",
    "geoConicEquidistant",
    "geoCraig",
    "geoCraster",
    "geoCylindricalEqualArea",
    "geoCylindricalStereographic",
    "geoEckert1",
    "geoEckert2",
    "geoEckert3",
    "geoEckert4",
    "geoEckert5",
    "geoEckert6",
    "geoEisenlohr",
    "geoEquirectangular",
    "geoFahey",
    "geoFoucaut",
    "geoFoucautSinusoidal",
    "geoGilbert",
    "geoGingery",
    "geoGinzburg4",
    "geoGinzburg5",
    "geoGinzburg6",
    "geoGinzburg8",
    "geoGinzburg9",
    "geoGnomonic",
    "geoGringorten",
    "geoGuyou",
    "geoHammer",
    "geoHammerRetroazimuthal",
    "geoHealpix",
    "geoHill",
    "geoHomolosine",
    "geoHufnagel",
    "geoHyperelliptical",
    "geoKavrayskiy7",
    "geoLagrange",
    "geoLarrivee",
    "geoLaskowski",
    "geoLittrow",
    "geoLoximuthal",
    "geoMercator",
    "geoMiller",
    "geoModifiedStereographic",
    "geoModifiedStereographicAlaska",
    "geoModifiedStereographicGs48",
    "geoModifiedStereographicGs50",
    "geoModifiedStereographicMiller",
    "geoModifiedStereographicLee",
    "geoMollweide",
    "geoMtFlatPolarParabolic",
    "geoMtFlatPolarQuartic",
    "geoMtFlatPolarSinusoidal",
    "geoNaturalEarth1",
    "geoNaturalEarth2",
    "geoNellHammer",
    "geoNicolosi",
    "geoOrthographic",
    "geoPatterson",
    "geoPolyconic",
    "geoRectangularPolyconic",
    "geoRobinson",
    "geoSatellite",
    "geoSinusoidal",
    "geoSinuMollweide",
    "geoStereographic",
    "geoTimes",
    "geoTransverseMercator",
    "geoTwoPointAzimuthal",
    "geoTwoPointAzimuthalUsa",
    "geoTwoPointEquidistant",
    "geoTwoPointEquidistantUsa",
    "geoVanDerGrinten",
    "geoVanDerGrinten2",
    "geoVanDerGrinten3",
    "geoVanDerGrinten4",
    "geoWagner",
    "geoWagner4",
    "geoWagner6",
    "geoWagner7",
    "geoWiechel",
    "geoWinkel3",
    "geoInterrupt",
    "geoInterruptedHomolosine",
    "geoInterruptedSinusoidal",
    "geoInterruptedBoggs",
    "geoInterruptedSinuMollweide",
    "geoInterruptedMollweide",
    "geoInterruptedMollweideHemispheres",
    "geoPolyhedral",
    "geoPolyhedralButterfly",
    "geoPolyhedralCollignon",
    "geoPolyhedralWaterman",
    "geoQuincuncial",
    "geoGringortenQuincuncial",
    "geoPeirceQuincuncial",
  ];
  const projections = [
    ...builtInProjections,
    // ...geoProjectionProjections,
  ];

  const selectedProjection = projections[0];
  const projectionLabel = d3.select("#name");
  projectionLabel.text(selectedProjection);

  const select = d3.select("#select");
  select.selectAll("option")
    .data(projections)
    .join("option")
    .text(d => d)
    .attr("value", d => d);

  select.on("change", function (d) {
    projectionLabel.text(this.value);
    drawMap(this.value);
  });

  bounds.append("path")
    .attr("class", "earth");

  bounds.append("path")
    .attr("class", "graticule");

  /**
   * Known issues:
   * - The legend re-draws itself repeatedly when you change the projection.
   * - myLocation dot, when it works, doesn't disappear between changes.
   * - geoProjections options do not work. Neither did they in the author's code.
   * - countries.exit() never happens as it is not a function. Weird.
   */
  const drawMap = (projectionName) => {
    const projection = d3[projectionName]()
      .fitWidth(dimensions.boundedWidth,
        sphere);

    const pathGenerator = d3.geoPath(projection);
    const [[_x0, _y0], [_x1, y1]] = pathGenerator.bounds(sphere);

    dimensions.boundedHeight = y1;
    dimensions.height = dimensions.boundedHeight
      + dimensions.margin.top + dimensions.margin.bottom;
    wrapper.attr("height", dimensions.height);

    bounds.style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`,
    );

    bounds.select(".earth")
        .attr("d", pathGenerator(sphere));
    bounds.select(".earth-clip-path")
        .attr("d", pathGenerator(sphere));

    const graticule = d3.geoGraticule10();
    bounds.select(".graticule")
        .attr("clip-path", "url(#bounds-clip-path")
        .attr("d", pathGenerator(graticule));

    const countries = bounds.selectAll(".country")
      .data(countryShapes.features)
        .join("path")
        .attr("class", "country")
        .attr("fill", d => {
          const metricValue = metricDataByCountry[countryIdAccessor(d)];
          if (typeof metricValue == "undefined") return "#e2e6e9";
          return colorScale(metricValue);
        })
        .attr("title", d => countryNameAccessor(d))
        .attr("clip-path", "url(#bounds-clip-path)")
      .transition().duration(500)
        .attr("d", d => pathGenerator(d));

    if (countries.exit != null) {
      countries.exit().remove();
      console.log("countries.exit().remove()!");
    }

    // Adding voronoi selection map
    const delaunay = d3.Delaunay.from(
      countryShapes.features,
      d => pathGenerator.centroid(d)[0],
      d => pathGenerator.centroid(d)[1],
    );
    const voronoiPolygons = delaunay.voronoi();
    voronoiPolygons.xmax = dimensions.boundedWidth;
    voronoiPolygons.ymax = dimensions.boundedHeight;

    const voronoi = bounds.selectAll(".voronoi")
      .data(countryShapes.features)
      .join("path")
      .attr("class", "voronoi")
      .attr("stroke", "salmon")
      .attr("d", (d, i) => voronoiPolygons.renderCell(i));

    const legendGroup = wrapper.append("g")
      .attr("transform", `translate(${120
      }, ${dimensions.width < 800
        ? dimensions.boundedHeight - 30
        : dimensions.boundedHeight * 0.5
      })`);
    const legendTitle = legendGroup.append("text")
      .attr("y", -23)
      .attr("class", "legend-title")
      .text("Population Growth");
    const legendByLine = legendGroup.append("text")
      .attr("y", -9)
      .attr("class", "legend-byline")
      .text("Percent change in 2020");

    const legendWidth = 120;
    const legendHeight = 16;
    const legendGradient = legendGroup.append("rect")
        .attr("x", -legendWidth / 2)
        .attr("height", legendHeight)
        .attr("width", legendWidth)
      .style("fill", "url(#legend-gradient)");

    const legendValueRight = legendGroup.append("text")
        .attr("class", "legend-value")
        .attr("x", legendWidth / 2 + 10)
        .attr("y", legendHeight / 2)
      .text(`${d3.format(".1f")(maxChange)}%`);
    const legendValueLeft = legendGroup.append("text")
        .attr("class", "legend-value")
        .attr("x", -legendWidth / 2 - 10)
        .attr("y", legendHeight / 2)
      .text(`${d3.format(".1f")(-maxChange)}%`)
      .style("text-anchor", "end"); // Make the text to the left of the start.

    // Get geolocation and show it.
    navigator.geolocation.getCurrentPosition(myPosition => {
      const [x, y] = projection([
        myPosition.coords.longitude,
        myPosition.coords.latitude,
      ]);
      const myLocation = bounds.append("circle")
          .attr("class", "my-location")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 0)
        .transition().duration(500)
          .attr("r", 10);
    });

    // Set up interactions.
    voronoi.on("mouseenter", onMouseEnter)
      .on("mouseLeave", onMouseLeave);

    const tooltip = d3.select("#tooltip");

    function onMouseEnter(_, datum) {
      tooltip.style("opacity", 1);
      const metricValue = metricDataByCountry[countryIdAccessor(datum)];
      tooltip.select("#country")
        .text(countryNameAccessor(datum));

      tooltip.select("#value")
        .text(`${d3.format(",.2f")(metricValue || 0)}%`);

      // Get the center of the country...
      const [centerX, centerY] = pathGenerator.centroid(datum);

      const x = centerX + dimensions.margin.left;
      const y = centerY + dimensions.margin.top;

      tooltip.style("transform", "translate("
        + `calc( -50% + ${x}px),`
        + `calc(-100% + ${y}px))`
      );
    }

    function onMouseLeave() {
      tooltip.style("opacity", 0);
    }
  };

  drawMap(selectedProjection);

}
drawMap();

