import {Runtime} from "../../src";
import tape from "../tape";
import valueof from "../variable/valueof";
import noop from "../../src/noop";

tape("runtime.module(..., special) defines a module special variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module(noop, undefined, {foo: () => 42});
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: 43});
});

tape("runtime.module(..., special) can be a constant", async test => {
  const runtime = new Runtime();
  const module = runtime.module(noop, undefined, {foo: 42});
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(bar), {value: 43});
});

tape("runtime.module(..., special) can be overridden by a normal variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module(noop, undefined, {foo: 0});
  const foo = module.variable(true).define("foo", [], () => 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
  test.deepEqual(await valueof(bar), {value: 43});
});
