import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

import Chart from "./Chart/Chart";
import Line from "./Chart/Line";
import Axis from "./Chart/Axis";
import { useChartDimensions, accessorPropsType, useUniqueId } from "./Chart/utils";
import Gradient from "./Chart/Gradient";

const formatDate = d3.timeFormat("%-b %-d");
const gradientColors = ["#e2def3", "#f8f9fa"];

const Timeline = ({ data, xAccessor, yAccessor, label }) => {
  const [ref, dimensions] = useChartDimensions({ marginBottom: 50 });
  // console.table(dimensions);

  // Each chart must reference its own <defs> with its gradients, else they'll be shared.
  const gradientId = useUniqueId("Timeline-gradient");


  /**
   * If you wanted to make creating scales easier, you could abstract the
   * concept of a "scale" and add ease-of-use methods to your chart library.
   * For example, you could make a method that takes a dimension (eg. x) and an
   * accessor function and create a scale. A more comprehensive chart library
   * can abstract redundant code and make it easier for collaborators who are
   * less familiar with data visualization.
   */
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, xAccessor))
    .range([0, dimensions.boundedWidth]);
  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();
  /**
   * Make scaled accessor functions for both axes.
   */
  const xAccessorScaled = d => xScale(xAccessor(d));
  const yAccessorScaled = d => yScale(yAccessor(d));
  const y0AccessorScaled = yScale(yScale.domain()[0]);

  return (
    <div className="Timeline" ref={ref}>
      <Chart dimensions={dimensions}>
        <defs>
          <Gradient
            id={gradientId}
            colors={gradientColors}
            x2="0"
            y2="100%"
          />
        </defs>
        <Axis
          dimension="x"
          scale={xScale}
          formatTick={formatDate}
          label="Date"
        />
        <Axis
          dimension="y"
          scale={yScale}
          label="Temperature"
        />
        <Line
          data={data}
          xAccessor={xAccessorScaled}
          yAccessor={yAccessorScaled}
          type="area"
          y0Accessor={y0AccessorScaled}
          style={{ fill: `url(#${gradientId})` }}
        />
        <Line
          data={data}
          xAccessor={xAccessorScaled}
          yAccessor={yAccessorScaled}
        />
      </Chart>
    </div>
  );
};

Timeline.propTypes = {
  data: PropTypes.array,
  xAccessor: accessorPropsType,
  yAccessor: accessorPropsType,
  label: PropTypes.string,
};

Timeline.defaultProps = {
  xAccessor: d => d.x,
  yAccessor: d => d.y,
};

export default Timeline;
