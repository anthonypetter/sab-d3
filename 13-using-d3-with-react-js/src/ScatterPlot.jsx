import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

import Chart from "./Chart/Chart";
import Circles from "./Chart/Circles";
import Axis from "./Chart/Axis";
import { useChartDimensions, accessorPropsType } from "./Chart/utils";

const ScatterPlot = ({ data, xAccessor, yAccessor, xLabel, yLabel }) => {
  const [ref, dimensions] = useChartDimensions({ marginBottom: 77 });

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  const xAccessorScaled = d => xScale(xAccessor(d));
  const yAccessorScaled = d => yScale(yAccessor(d));
  const keyAccessor = (_d, i) => i;

  const xScaleOne = d3.scaleLinear()
    .domain(d3.extent(data, xAccessor))
    .range([0, 1]);
  const yScaleOne = d3.scaleLinear()
    .domain(d3.extent(data, yAccessor))
    .range([0, 1]);

  // Custom fill color... Not useful. Just a proof-of-concept thing.
  const xColorGradient = d3.interpolateHcl("#d6dadb", "#21d1fd");
  const yColorGradient = d3.interpolateHcl("#7816f8", "#f86516");

  const colorFill = (d) => {
    const xColor = xColorGradient(xScaleOne(xAccessor(d)));
    const yColor = yColorGradient(yScaleOne(yAccessor(d)));
    const splitColor = d3.interpolateHcl(xColor, yColor)(0.5);
    return { fill: splitColor };
  };

  // Basic radius function. Uses median to cap the range of sizes from 2 to 10.
  const radius = (d) => 10 * (d3.median([
    0.2,
    (xScaleOne(xAccessor(d)) + yScaleOne(yAccessor(d))) / 2,
    1,
  ]));

  return (
    <div className="ScatterPlot" ref={ref}>
      <Chart dimensions={dimensions}>
        <Axis
          dimensions={dimensions}
          dimension="x"
          scale={xScale}
          label={xLabel}
        />
        <Axis
          dimensions={dimensions}
          dimension="y"
          scale={yScale}
          label={yLabel}
        />
        <Circles
          data={data}
          keyAccessor={keyAccessor}
          xAccessor={xAccessorScaled}
          yAccessor={yAccessorScaled}
          radius={radius}
          style={colorFill}
        />
      </Chart>
    </div>
  );
};

ScatterPlot.propTypes = {
  xAccessor: accessorPropsType,
  yAccessor: accessorPropsType,
  xLabel: PropTypes.string,
  yLabel: PropTypes.string,
};

ScatterPlot.defaultProps = {
  xAccessor: d => d.x,
  yAccessor: d => d.y,
};
export default ScatterPlot;
