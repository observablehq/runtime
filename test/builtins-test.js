import tape from "tape-await";
import {runtime as createRuntime} from "../";
import "./requestAnimationFrame";

tape("variable.define does not allow a variable to mask a builtin", async test => {
  let result;
  const runtime = createRuntime({color: "red"});
  const module = runtime.module();
  module.variable().define("color", [], () => test.fail());
  module.variable().define(null, ["color"], color => result = color);
  await new Promise(setImmediate);
  test.equal(result, "red");
});
