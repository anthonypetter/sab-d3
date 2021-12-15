import React, { useRef } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { useDimensionsContext } from "./Chart";

const Axis = ({ dimension, scale, ...props }) => {
  const dimensions = useDimensionsContext();
  const axisGeneratorsByDimension = {
    x: "axisBottom",  // Helps abstract away special names like this.
    y: "axisLeft",    // So we get to use "x" and "y" instead.
  };

  const axisGenerator = d3[axisGeneratorsByDimension[dimension]]()
    .scale(scale);

  /**
   * In the past, we've used our axisGenerator on the d3 selection of a newly
   * created <g> element. React gives us a way to access DOM nodes created in
   * the render method: Refs. To create a React Ref, we create a new variable
   * with useRef() and add it as a ref attrivute to the element we want to
   * target.
   */
  const ref = useRef();

  if (ref.current) {
    d3.select(ref.current)  // d3 selects the element...
      .transition()         // Add a basic transition...
      .call(axisGenerator); // And calls this every time.
  }

  return (
    <g {...props}
      className="Axis"
      ref={ref}
      transform={
        dimension === "x"
          ? `translate(0, ${dimensions.boundedHeight})` // Move the axis to bottom.
          : null
      }
    />
  );
};

Axis.propTypes = {
  dimension: PropTypes.oneOf(["x", "y"]),
  scale: PropTypes.func,
};

const formatNumber = d3.format(",");
Axis.defaultProps = {
  dimension: "x",
};

export default Axis;
