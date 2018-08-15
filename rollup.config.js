import node from "rollup-plugin-node-resolve";
import {terser} from "rollup-plugin-terser";

const copyright = `// @observablehq/notebook-runtime Copyright ${(new Date).getFullYear()} Observable, Inc.`;

function config(output) {
  return {
    input: "src/index.js",
    plugins: [
      node(),
      terser({
        toplevel: output.format === "es",
        output: {preamble: copyright}
      })
    ],
    output
  };
}

export default [
  config({
    format: "es",
    file: "dist/notebook-runtime.js"
  }),
  config({
    format: "umd",
    extend: true,
    name: "observablehq",
    file: "dist/notebook-runtime.umd.js"
  })
];
