import tape from "tape-await";
import {runtime as createRuntime} from "../";
import "./requestAnimationFrame";

tape("variable.define does not allow a variable to mask a builtin", async test => {
  let result;
  const runtime = createRuntime({color: "red"});
  const module = runtime.module();
  const v1 = module.variable().define("color", () => test.fail());
  const v2 = module.variable().define(["color"], color => result = color);
  v1._outdegree = v2._outdegree = 1; // TODO Cleaner way to force computation?
  await new Promise(setImmediate);
  test.equal(result, "red");
});
