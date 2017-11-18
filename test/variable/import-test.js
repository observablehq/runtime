import {runtime as createRuntime} from "../../";
import tape from "../tape";
import valueof from "./valueof";

tape("variable.import(name, module) imports a variable from another module", async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const weak = runtime.weakModule();
  weak.define("foo", [], () => 42);
  main.import("foo", weak);
  const bar = main.define("bar", ["foo"], foo => `bar-${foo}`);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, alias, module) imports a variable from another module under an alias", async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const weak = runtime.weakModule();
  weak.define("foo", [], () => 42);
  main.import("foo", "baz", weak);
  const bar = main.define("bar", ["baz"], baz => `bar-${baz}`);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, module) does not compute the imported variable unless referenced", async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const weak = runtime.weakModule();
  const foo = weak.define("foo", [], () => test.fail());
  main.import("foo", weak);
  await new Promise(setImmediate);
  test.equal(foo._reachable, false);
});
