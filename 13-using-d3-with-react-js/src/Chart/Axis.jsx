import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { dimensionsPropsType } from "./utils";
import { useDimensionsContext } from "./Chart";

/**
 * Now that we've shown how easy it is to plug basic d3 code into React, let's
 * talk about why it's not a good idea.
 * React uses a fancy reconciliation algorithm to decide which DOM elements to
 * update. It does this by creating a virtual DOM and diffing against the real
 * DOM. When we mutate the DOM outside of React render methods, we're removing
 * the performance benefits we get and will unnecessarily re-render elements.
 *
 * We'll be generating the elements through React instead of through D3. That
 * means, basically, NO GENERATORS.
 *
 * First example is that we won't use d3 to generate our ticks. Instead we'll
 * make them ourselves in React.
 */

const axisComponentsByDimension = {
  x: AxisHorizontal,
  y: AxisVertical,
};
const Axis = ({ dimension, ...props }) => {
  const dimensions = useDimensionsContext();
  const Component = axisComponentsByDimension[dimension];
  if (!Component) return null;

  return (
    <Component {...props}
      dimensions={dimensions}
    />
  );
};

const AxisProps = {
  dimensions: dimensionsPropsType,
  scale: PropTypes.func,
  label: PropTypes.string,
  formatTick: PropTypes.func,
};

Axis.propTypes = {
  dimension: PropTypes.oneOf(["x", "y"]),
  ...AxisProps,
};

const formatNumber = d3.format(",");
Axis.defaultProps = {
  dimension: "x",
  scale: null,
  formatTick: formatNumber,
};

export default Axis;


function AxisHorizontal ({ dimensions, label, formatTick, scale, ...props }) {
  const numberOfTicks = dimensions.boundedWidth < 600
    ? dimensions.boundedWidth / 100
    : dimensions.boundedWidth / 250;
  const ticks = scale.ticks(numberOfTicks);

  return (
    <g
      className="Axis AxisHorizontal"
      transform={`translate(0, ${dimensions.boundedHeight})`}
      {...props}
    >
      <line
        className="Axis__line"
        x2={dimensions.boundedWidth} // [0,0] to [width, 0]. So only need x2 defined.
      />

      {ticks.map(tick => (
        <text
          key={tick}
          className="Axis__tick"
          transform={`translate(${scale(tick)}, 25)`}
        >
          {formatTick(tick)}
        </text>
      ))}

      {label && (
        <text
          className="Axis__label"
          transform={`translate(${dimensions.boundedWidth / 2}, 45)`}
        >
          {label}
        </text>
      )}
    </g>
  );
}
AxisHorizontal.propTypes = {
  ...AxisProps,
};

function AxisVertical({ dimensions, label, formatTick, scale, ...props }) {
  const numberOfTicks = dimensions.boundedHeight / 40;
  const ticks = scale.ticks(numberOfTicks);

  return (
    <g className="Axis AxisVertical" {...props}>
      <line
        className="Axis__line"
        y2={dimensions.boundedHeight}
      />

      {ticks.map(tick => (
        <text
          key={tick}
          className="Axis__tick"
          transform={`translate(-16, ${scale(tick)})`}
        >
          {formatTick(tick)}
        </text>
      ))}

      {label && (
        <text
          className="Axis__label"
          style={{
            transform: `translate(-56px, ${dimensions.boundedHeight / 2}px) rotate(-90deg)`,
          }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
AxisVertical.propTypes = {
  ...AxisProps,
};

