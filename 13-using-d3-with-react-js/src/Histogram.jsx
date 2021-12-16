import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

import Chart from "./Chart/Chart";
import Bars from "./Chart/Bars";
import Axis from "./Chart/Axis";
import Gradient from "./Chart/Gradient";
import { useChartDimensions, accessorPropsType, useUniqueId } from "./Chart/utils";

// const gradientColors = ["#9980FA", "rgb(226, 222, 243)"];
const Histogram = ({ data, xAccessor, yAccessor, xLabel, yLabel }) => {
  const [ref, dimensions] = useChartDimensions({
    marginBottom: 77,
  });

  const numberOfThresholds = 9;

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice(numberOfThresholds);

  const binsGenerator = d3.bin()
    .domain(xScale.domain())
    .value(xAccessor)
    .thresholds(xScale.ticks(numberOfThresholds));

  const bins = binsGenerator(data);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();

  const barPadding = 2;

  const xAccessorScaled = d => xScale(d.x0) + barPadding;
  const yAccessorScaled = d => yScale(yAccessor(d));
  const widthAccessorScaled = d => xScale(d.x1) - xScale(d.x0) - barPadding;
  const heightAccessorScaled = d => dimensions.boundedHeight - yScale(yAccessor(d));
  const keyAccessor = (_d, i) => i;

  return (
    <div className="Histogram" ref={ref}>
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
        <Bars
          data={bins}
          keyAccessor={keyAccessor}
          xAccessor={xAccessorScaled}
          yAccessor={yAccessorScaled}
          widthAccessor={widthAccessorScaled}
          heightAccessor={heightAccessorScaled}
        />
      </Chart>
    </div>
  );
};

Histogram.propTypes = {
  data: PropTypes.array,
  xAccessor: accessorPropsType,
  yAccessor: accessorPropsType,
  xLabel: PropTypes.string,
  yLabel: PropTypes.string,
};

Histogram.defaultProps = {
  xAccessor: d => d.x,
  yAccessor: d => d.length,
};
export default Histogram;
