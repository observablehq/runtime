import {JSDOM} from "jsdom";
import tape from "tape-await";
import {runtime as createRuntime} from "../";
import "./requestAnimationFrame";

tape("variable.define does not allow a variable to mask a builtin", async test => {
  let result;
  const document = new JSDOM(`<div id=v1></div><div id=v2></div>`).window.document;
  const runtime = createRuntime({color: "red"});
  const module = runtime.module();
  module.variable(document.querySelector("#v1")).define("color", () => test.fail());
  module.variable(document.querySelector("#v2")).define(["color"], color => result = color);
  await new Promise(setImmediate);
  test.equal(result, "red");
});
