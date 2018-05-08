import node from "rollup-plugin-node-resolve";

export default {
  input: "src/index.js",
  plugins: [
    node()
  ],
  output: {
    extend: true,
    banner: `// @observablehq/notebook-runtime Copyright ${(new Date).getFullYear()} Observable, Inc.`,
    file: "dist/notebook-runtime.js",
    format: "umd",
    name: "Observable"
  }
};
