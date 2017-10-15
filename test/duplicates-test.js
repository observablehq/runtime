import {JSDOM} from "jsdom";
import tape from "tape-await";
import {runtime as createRuntime} from "../";
import "./requestAnimationFrame";

tape("duplicate declarations", async test => {
  let result;
  const document = new JSDOM(`<div id=v1></div><div id=v2></div><div id=v3></div>`).window.document;
  const runtime = createRuntime();
  const module = runtime.module();
  module.variable(document.querySelector("#v1")).define("foo", 1);
  module.variable(document.querySelector("#v2")).define("foo", 2);
  module.variable(document.querySelector("#v3")).define(["foo"], err => result = err);
  await new Promise(setImmediate);
  test.equal(result, "red");
});
