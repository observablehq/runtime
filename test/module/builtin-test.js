import {Runtime} from "../../src";
import tape from "../tape";
import valueof from "../variable/valueof";

tape("module.builtin(name, value) defines a module-specific builtin variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.builtin("foo", 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: 43});
});

tape("module.builtin(name, value) can be overridden by a normal variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.builtin("foo", 0);
  const foo = module.variable(true).define("foo", [], () => 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
  test.deepEqual(await valueof(bar), {value: 43});
});
