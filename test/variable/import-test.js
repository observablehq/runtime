import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "./valueof";

tape("variable.import(name, module) imports a variable from another module", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  main.import("foo", module);
  const bar = main.variable(true).define("bar", ["foo"], foo => `bar-${foo}`);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, alias, module) imports a variable from another module under an alias", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  main.import("foo", "baz", module);
  const bar = main.variable(true).define("bar", ["baz"], baz => `bar-${baz}`);
  test.deepEqual(await valueof(bar), {value: "bar-42"});
});

tape("variable.import(name, module) does not compute the imported variable unless referenced", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  const foo = module.define("foo", [], () => test.fail());
  main.import("foo", module);
  await runtime._computing;
  test.equal(foo._reachable, false);
});

tape("variable.import(name, module) can import a variable that depends on a mutable from another module", async test => {
  const runtime = new Runtime();
  const main = runtime.module();
  const module = runtime.module();
  module.define("mutable foo", [], () => 13);
  module.define("bar", ["mutable foo"], (foo) => foo);
  main.import("bar", module);
  const baz = main.variable(true).define("baz", ["bar"], bar => `baz-${bar}`);
  test.deepEqual(await valueof(baz), {value: "baz-13"});
});
