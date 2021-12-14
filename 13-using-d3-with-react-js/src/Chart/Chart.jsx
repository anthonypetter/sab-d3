import React, { createContext, useContext } from "react";
import PropTypes from "prop-types";
import { dimensionsPropsType } from "./utils";

import "./Chart.css";

const ChartContext = createContext();

export const useDimensionsContext = () => useContext(ChartContext);

const Chart = ({ dimensions, children }) => (
  <ChartContext.Provider value={dimensions}>
    <svg
      className="Chart"
      width={dimensions.width}
      height={dimensions.height}
    >
      <g transform={`translate(${dimensions.marginLeft}, ${dimensions.marginTop})`}>
        { children }
      </g>
    </svg>
  </ChartContext.Provider>
);

Chart.propTypes = {
  dimensions: dimensionsPropsType,
  children: PropTypes.node,
};

Chart.defaultProps = {
  dimensions: {},
};

export default Chart;
