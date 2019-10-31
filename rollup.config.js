import node from "rollup-plugin-node-resolve";
import {terser} from "rollup-plugin-terser";
import * as meta from "./package.json";

const copyright = `// @observablehq/runtime v${meta.version} Copyright ${(new Date).getFullYear()} Observable, Inc.`;

function config(output) {
  return {
    input: "src/index.js",
    plugins: [
      node(),
      terser({
        toplevel: output.format === "es",
        output: {preamble: copyright},
        mangle: {reserved: ["FileAttachment", "RequireError"]}
      })
    ],
    output
  };
}

export default [
  config({
    format: "es",
    file: "dist/runtime.js"
  }),
  config({
    format: "umd",
    extend: true,
    name: "observablehq",
    file: "dist/runtime.umd.js"
  })
];
