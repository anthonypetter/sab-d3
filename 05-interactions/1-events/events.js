async function createEvent() {
  const rectColors = [
    "yellowgreen",
    "cornflowerblue",
    "seagreen",
    "slateblue",
  ];

  // create and bind data to our rects
  const rects = d3.select("#svg")
    .selectAll(".rect") // Grabbing elements with class "rect".
    .data(rectColors) // Each rect will have this data associated with it.
    .enter().append("rect") // For each data item added, append a rect element.
      .attr("height", 100)
      .attr("width", 100)
      .attr("x", (d,i) => i * 110)  // Shift over 110px per rect.
      .attr("fill", "lightgrey");

  // We want to adopt the given color when hovered-over.

  /**
   * on()'s second argument is a function. The second argument is the d3 element's
   * datum (we usually write as "d"). In this case, the string representing a
   * color of ours.
   * Also, do keep in mind that there are similiar but specificly different
   * events: "mouseenter" and "mouseover"; "mouseout" and "mouseleave".
   * "over" and "leave" trigger additional times when entering nested elements.
   * This demonstration page does a great job of showing what it means:
   * https://www.w3schools.com/jquery/tryit.asp?filename=tryjquery_event_mouseenter_mouseover
   * It is also worth mentioning that the .on() functions provide a `this`
   * to its callback function (that you can't use with fat arrow functions)
   * that can be an alternative to e.target. Not sure why you'd want to use that
   * style instead, but keep that in your back pocket in case it proves useful
   * in the future.
   */
  rects.on("mouseenter", (e, datum) => {
    console.log({e, datum});
    d3.select(e.target).style("fill", datum);
  });
  rects.on("mouseout", (e) => {
    d3.select(e.target).style("fill", "lightgrey");
  });

}
createEvent();
