import observe from "./generators/observe";

export default function() {
  return observe(function(change) {
    var width = change(window.innerWidth - 14);
    function resized() { if (window.innerWidth !== width) change(width = window.innerWidth - 14); }
    window.addEventListener("resize", resized);
    return function() { window.removeEventListener("resize", resized); };
  });
}
