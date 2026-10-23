import {Runtime} from "@observablehq/runtime";
import assert from "assert";
import {valueof} from "../variable/valueof.js";

it("module.builtin(name, value) defines a module-specific builtin variable", async () => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.builtin("foo", 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  assert.deepStrictEqual(await valueof(bar), {value: 43});
});

it("module.builtin(name, value) treats a function as a constant", async () => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.builtin("foo", () => 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo() + 1);
  await new Promise(setImmediate);
  assert.deepStrictEqual(await valueof(bar), {value: 43});
});

it("module.builtin(name, inputs, definition) allows dynamic builtins", async () => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.builtin("foo", ["baz"], (baz) => baz + 1);
  const baz = module.define("baz", 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  assert.deepStrictEqual(await valueof(bar), {value: 44});
  baz.define("baz", 100);
  await new Promise(setImmediate);
  assert.deepStrictEqual(await valueof(bar), {value: 102});
});

it("module.builtin(name, value) can be overridden by a normal variable", async () => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.builtin("foo", 0);
  const foo = module.variable(true).define("foo", [], () => 42);
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  await new Promise(setImmediate);
  assert.deepStrictEqual(await valueof(foo), {value: 42});
  assert.deepStrictEqual(await valueof(bar), {value: 43});
});
