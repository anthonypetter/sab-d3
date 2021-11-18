const scales = d3.select("#scales");

d3ColorScales.map(type => {
  const container = scales.append("div")
      .attr("class", "scale-type");

  container.append("h3")
      .text(type.title);

  type.scales.map(scaleName => {
    container.append("div")
        .text(scaleName);

    const colorScale = d3[scaleName];
    drawColorRange(container, colorScale, scaleName);
  });
});

// create custom scales group
const customScalesContainer = scales.append("div")
    .attr("class", "scale-type");

customScalesContainer.append("h3")
    .text("Custom");

const addCustomScale = (name, scale) => {
  customScalesContainer.append("div")
      .text(name);

  drawColorRange(customScalesContainer, scale, name);
};

const interpolateWithSteps = numberOfSteps => new Array(numberOfSteps).fill(null).map((d, i) => i / (numberOfSteps - 1));

// add more custom scales here
addCustomScale(
  "interpolate-rgb",
  d3.interpolateRgb("cyan", "tomato"),
);

addCustomScale(
  "interpolate-hsl",
  d3.interpolateHsl("cyan", "tomato"),
);

addCustomScale(
  "interpolate-hcl",
  d3.interpolateHcl("cyan", "tomato"),
);

addCustomScale(
  "interpolate-hcl-steps",
  interpolateWithSteps(6).map(
    d3.interpolateHcl("cyan", "tomato")
  )
);

addCustomScale(
  "interpolate-rainbow-steps",
  interpolateWithSteps(10).map(
    d3.interpolateRainbow
  )
);
