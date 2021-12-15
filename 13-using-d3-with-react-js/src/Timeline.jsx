import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

import Chart from "./Chart/Chart";
import Line from "./Chart/Line";
import Axis from "./Chart/Axis-naive";
import { useChartDimensions, accessorPropsType } from "./Chart/utils";

const formatDate = d3.timeFormat("%-b %-d");

const Timeline = ({ data, xAccessor, yAccessor, label }) => {
  const [ref, dimensions] = useChartDimensions();
  // console.table(dimensions);


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

  return (
    <div className="Timeline" ref={ref}>
      <Chart dimensions={dimensions}>
        <Axis
          dimension="x"
          scale={xScale}
        />
        <Axis
          dimension="y"
          scale={yScale}
        />
        <Line
          data={data}
          xAccessor={xAccessorScaled}
          yAccessor={yAccessorScaled}
          // type="area"
          // y0Accessor={dimensions.boundedHeight}
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
