import { Runtime } from "../../src";
import tape from "../tape";
import valueof from "../variable/valueof";

tape("module._special is defines an module local variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module._special.set("foo", () => 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: 43});
});

tape("module._special does not override a normal variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define("foo", [], () => 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  module._special.set("foo", () => 0);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
  test.deepEqual(await valueof(bar), {value: 43});
});
