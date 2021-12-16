import React from "react";
import PropTypes from "prop-types";

import "./Tooltip.css";

const Tooltip = ({ children }) => (
  <div id="Tooltip" className="Tooltip">
    { children }
  </div>
);

Tooltip.propTypes = {
  children: PropTypes.node,
  show: PropTypes.bool,
  x: PropTypes.number,
  y: PropTypes.number,
};

Tooltip.defaultProps = {
  show: false,
  x: 0,
  y: 0,
};

export default Tooltip;
