import {Runtime} from "@observablehq/runtime";
import assert from "assert";
import {valueof} from "./valueof.js";

it("variable.delete allows a variable to be deleted", async () => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", [], () => 1);
  const bar = main.variable(true).define("bar", ["foo"], foo => new Promise(resolve => setImmediate(() => resolve(foo))));
  assert.deepStrictEqual(await valueof(foo), {value: 1});
  assert.deepStrictEqual(await valueof(bar), {value: 1});
  foo.delete();
  assert.deepStrictEqual(await valueof(foo), {value: undefined});
  assert.deepStrictEqual(await valueof(bar), {error: "RuntimeError: foo is not defined"});
});

it("variable.delete removes an implicit variable that is no longer referenced", async () => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  const baz = main.variable(true).define("baz", ["bar"], bar => bar);
  const bar = main._scope.get("bar");
  assert.deepStrictEqual(await valueof(foo), {error: "RuntimeError: bar is not defined"});
  foo.delete();
  await runtime._compute();
  assert.strictEqual(main._scope.get("bar"), bar);
  baz.delete();
  await runtime._compute();
  assert.strictEqual(main._scope.has("bar"), false);
  assert.strictEqual(runtime._variables.has(bar), false);
});

it("variable.delete removes implicit variables that are transitively no longer referenced", async () => {
  const runtime = new Runtime();
  const main = runtime.module();
  main.builtin("bar", ["baz"], baz => baz);
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  const bar = main._scope.get("bar");
  const baz = main._scope.get("baz");
  assert.deepStrictEqual(await valueof(foo), {error: "RuntimeError: baz is not defined"});
  foo.delete();
  await runtime._compute();
  assert.strictEqual(main._scope.has("bar"), false);
  assert.strictEqual(main._scope.has("baz"), false);
  assert.strictEqual(runtime._variables.has(bar), false);
  assert.strictEqual(runtime._variables.has(baz), false);
});

it("variable.define does not remove an implicit variable that is still referenced", async () => {
  const runtime = new Runtime();
  const main = runtime.module();
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  const bar = main._scope.get("bar");
  foo.define("foo", ["bar"], bar => bar + 1);
  await runtime._compute();
  assert.strictEqual(main._scope.get("bar"), bar);
  main.variable(true).define("bar", [], () => 1);
  assert.deepStrictEqual(await valueof(foo), {value: 2});
});

it("variable.delete does not remove an unreferenced runtime builtin", async () => {
  const runtime = new Runtime({bar: 42});
  const main = runtime.module();
  const builtin = runtime._builtin._scope.get("bar");
  const foo = main.variable(true).define("foo", ["bar"], bar => bar);
  const bar = main._scope.get("bar");
  assert.deepStrictEqual(await valueof(foo), {value: 42});
  foo.delete();
  await runtime._compute();
  assert.strictEqual(main._scope.has("bar"), false);
  assert.strictEqual(builtin._outputs.has(bar), false);
  assert.strictEqual(runtime._builtin._scope.get("bar"), builtin);
  const baz = main.variable(true).define("baz", ["bar"], bar => bar + 1);
  assert.deepStrictEqual(await valueof(baz), {value: 43});
});
