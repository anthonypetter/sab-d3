import React, { createContext, useContext } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

import { dimensionsPropsType } from "./utils";

import "./Chart.css";
import ListenerRect from "../Tooltip/ListenerRect";

const ChartContext = createContext();

export const useDimensionsContext = () => useContext(ChartContext);

const Chart = ({ dimensions, children, listener }) => (
  <ChartContext.Provider value={dimensions}>
    <svg
      className="Chart"
      width={dimensions.width}
      height={dimensions.height}
    >
      <g transform={`translate(${dimensions.marginLeft}, ${dimensions.marginTop})`}>
        { children }
      </g>
      {listener &&
        <ListenerRect dimensions={dimensions} onMouseMove={tempOnMouseMove} />
      }
    </svg>
  </ChartContext.Provider>
);


const tempOnMouseMove = (e, { marginLeft, marginTop }) => {
  const [x, y] = d3.pointer(e);
  console.log("chart", x - marginLeft, y - marginTop);
};

Chart.propTypes = {
  dimensions: dimensionsPropsType,
  children: PropTypes.node,
  listener: PropTypes.bool,
};

Chart.defaultProps = {
  dimensions: {},
  listener: false,
};

export default Chart;
