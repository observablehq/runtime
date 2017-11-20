import node from "rollup-plugin-node-resolve";

export default {
  input: "src/index.js",
  plugins: [
    node()
  ],
  output: {
    banner: `// @observablehq/notebook-runtime Copyright ${(new Date).getFullYear()} Observable, Inc.`,
    file: "build/notebook-runtime.js",
    format: "umd",
    name: "O"
  }
};
