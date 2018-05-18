import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "./valueof";

tape("variable.import(name, module) imports a variable from another module", {html: "<div id=bar />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  main.import("foo", module);
  const bar = main.variable("#bar").define("bar", ["foo"], foo => `bar-${foo}`);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, alias, module) imports a variable from another module under an alias", {html: "<div id=bar />"}, async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  main.import("foo", "baz", module);
  const bar = main.variable("#bar").define("bar", ["baz"], baz => `bar-${baz}`);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, module) does not compute the imported variable unless referenced", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const foo = module.define("foo", [], () => test.fail());
  main.import("foo", module);
  await new Promise(setImmediate);
  test.equal(foo._reachable, false);
});
