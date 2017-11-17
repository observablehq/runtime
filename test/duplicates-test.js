import {runtime as createRuntime} from "../";
import "./requestAnimationFrame";
import tape from "./tape";
import valueof from "./valueof";

tape("variable.define detects duplicate declarations", {html: "<div id=v1></div><div id=v2></div><div id=v3></div>"}, async test => {
  const runtime = createRuntime();
  const module = runtime.module();
  const v1 = module.variable("#v1").define("foo", 1);
  const v2 = module.variable("#v2").define("foo", 2);
  const v3 = module.variable("#v3").define(["foo"], foo => foo);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(v1), {error: "foo is defined more than once"});
  test.deepEqual(await valueof(v2), {error: "foo is defined more than once"});
  test.deepEqual(await valueof(v3), {error: "foo is defined more than once"});
});
