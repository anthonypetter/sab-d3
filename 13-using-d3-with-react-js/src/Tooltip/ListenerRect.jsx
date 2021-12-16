import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

import { dimensionsPropsType } from "./../Chart/utils";

import "./Tooltip.css";

const ListenerRect = ({ dimensions, onMouseMove }) => (
  <rect
    className="ListenerRect"
    width={dimensions.boundedWidth}
    height={dimensions.boundedHeight}
    x={dimensions.marginLeft}
    y={dimensions.marginTop}
    // onMouseMove={(e) => tempOnMouseMove(e, dimensions)}
    onMouseMove={(e) => onMouseMove(e, dimensions)}
  />
);

const tempOnMouseMove = (e, { marginLeft, marginTop }) => {
  const [x, y] = d3.pointer(e);
  console.log("rect", x - marginLeft, y - marginTop);
};

ListenerRect.propTypes = {
  dimensions: dimensionsPropsType,
  onMouseMove: PropTypes.func,
};

ListenerRect.defaultProps = {
  dimensions: {},
  onMouseMove: tempOnMouseMove,
};

export default ListenerRect;
