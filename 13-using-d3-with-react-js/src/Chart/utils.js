import PropTypes from "prop-types";
import { useEffect, useState, useRef } from "react";
import ResizeObserver from "resize-observer-polyfill";

export const accessorPropsType = (
  PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.number,
  ])
);

export const callAccessor = (accessor, d, i) => (
  typeof accessor === "function" ? accessor(d, i) : accessor
);

export const dimensionsPropsType = (
  PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number,
    marginTop: PropTypes.number,
    marginRight: PropTypes.number,
    marginBottom: PropTypes.number,
    marginLeft: PropTypes.number,
  })
);

export const combineChartDimensions = dimensions => {
  let parsedDimensions = {
    marginTop: 40,
    marginRight: 30,
    marginBottom: 40,
    marginLeft: 75,
    ...dimensions,
  };

  return {
    ...parsedDimensions,
    boundedHeight: Math.max(parsedDimensions.height - parsedDimensions.marginTop - parsedDimensions.marginBottom, 0),
    boundedWidth: Math.max(parsedDimensions.width - parsedDimensions.marginLeft - parsedDimensions.marginRight, 0),
  };
};

/**
 * Accepts an object of dimension overrides and returns an array with ref and
 * dimensions object. Give it an object with the width and height values
 * (and optionally top/right/bottom/left margins) and it'll return what you gave
 * plus boundHeight and boundWidth values.
 * If you don't give BOTH width and height it'll automatically give you the
 * actual element dimension values from the DOM. So, this will allow us to draw
 * SVG wrapper dimensions dynamically - the bounds updated as well.
 * So, say we have a chart that we must have be 500px wide but the height can
 * change according to the on-screen element's height. Well. This is how we can
 * do that. Lock in 500px wide with useChartDimensions({ width: 500 }) and the
 * width will always be 500px
 * @param {*} passedSettings
 * @returns [React ref, dimensions object]
 */
export const useChartDimensions = passedSettings => {
  const ref = useRef();
  const dimensions = combineChartDimensions(passedSettings);

  const [width, changeWidth] = useState(0);
  const [height, changeHeight] = useState(0);

  useEffect(() => {
    // Provide non-zero values for width and height and get the stuff immediately.
    if (dimensions.width && dimensions.height) return [ref, dimensions];

    const element = ref.current;

    /**
     * Looking at the docs it appears that what's going on is that the function
     * we're defining here is run, like an effectHook, whenever the element
     * (the current ref, which is provided as a ref prop to any element near
     * where this hook is defined) is resized.
     *
     * -> https://github.com/que-etc/resize-observer-polyfill
     */
    const resizeObserver = new ResizeObserver(entries => {
      /**
       * ResizeObserver allows for multiple elements to be watched for resize
       * events. But since we're just going with the current ref element we
       * only need entries[0].
       * -> https://que-etc.github.io/resize-observer-polyfill/
       */
      if (!Array.isArray(entries)) return;
      if (!entries.length) return;

      const entry = entries[0];

      if (width !== entry.contentRect.width) changeWidth(entry.contentRect.width);
      if (height !== entry.contentRect.height) changeHeight(entry.contentRect.height);
    });

    resizeObserver.observe(element);

    // Remember to return the destructor for this useEffect hook!
    return () => resizeObserver.unobserve(element);
  }, [passedSettings, height, width, dimensions]);

  const newSettings = combineChartDimensions({
    ...dimensions,
    width: dimensions.width || width,
    height: dimensions.height || height,
  });

  return [ref, newSettings];
};

let lastId = 0;
export const useUniqueId = (prefix="") => {
  lastId++;
  return [prefix, lastId].join("-");
};
