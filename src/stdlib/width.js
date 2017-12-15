import observe from "./generators/observe";

var inset = 28;

export default function() {
  return observe(function(change) {
    var width = change(window.innerWidth - inset);
    function resized() {
      var width1 = window.innerWidth - inset;
      if (width1 !== width) change(width = width1);
    }
    window.addEventListener("resize", resized);
    return function() {
      window.removeEventListener("resize", resized);
    };
  });
}
