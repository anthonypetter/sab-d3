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

  console.log(metricDataByCountry);

}
drawMap();
