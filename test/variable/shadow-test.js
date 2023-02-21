import {Runtime, RuntimeError} from "@observablehq/runtime";
import {valueof} from "./valueof.js";
import assert from "assert";

it("module.variable(…, {shadow}) can define a shadow input", async () => {
  const runtime = new Runtime();
  const module = runtime.module();

  module.define("val", [], 1000);
  const a = module.variable(true, {shadow: {val: 100}}).define("a", ["val"], (val) => val);

  assert.deepStrictEqual(await valueof(a), {value: 100});
});

it("module.variable(…, {shadow}) can define a shadow inputs that differ between variables", async () => {
  const runtime = new Runtime();
  const module = runtime.module();

  module.define("val", [], 1000);
  const a = module.variable(true, {shadow: {val: 100}}).define("a", ["val"], (val) => val);
  const b = module.variable(true, {shadow: {val: 200}}).define("b", ["val"], (val) => val);


  assert.deepStrictEqual(await valueof(a), {value: 100});
  assert.deepStrictEqual(await valueof(b), {value: 200});
});

it("variable.shadow(…) variables that are downstream will also use the shadow input", async () => {
  const runtime = new Runtime();
  const main = runtime.module();

  main.define("val", [], 1000);
  const a = main.define("a", ["val"], (val) => val);
  const b = main.define("b", ["val"], (val) => val);
  const c = main.variable(true).define("c", ["a", "b"], (a, b) => `${a}, ${b}`);

  assert.deepStrictEqual(await valueof(a), {value: 1000});
  assert.deepStrictEqual(await valueof(b), {value: 1000});
  assert.deepStrictEqual(await valueof(c), {value: "1000, 1000"});

  // Shadow val with different values for variables a and b.
  a.shadow("val", 100);
  b.shadow("val", 200);

  assert.deepStrictEqual(await valueof(a), {value: 100});
  assert.deepStrictEqual(await valueof(b), {value: 200});
  assert.deepStrictEqual(await valueof(c), { value: "100, 200" });

  // Remove the shadow for val.
  a.unshadow("val");
  b.unshadow("val");

  assert.deepStrictEqual(await valueof(a), {value: 1000});
  assert.deepStrictEqual(await valueof(b), {value: 1000});
  assert.deepStrictEqual(await valueof(c), {value: "1000, 1000"});
});

it("variable.shadow(…) variables a->b->c that shadow the same inputs will each use their own shadows", async () => {
  const runtime = new Runtime();
  const main = runtime.module();

  const a = main
    .define("a", ["val"], (val) => val)
    .shadow("val", 100);
  const b = main
    .define("b", ["val", "a"], (val, a) => `${val}, ${a}`)
    .shadow("val", 200);
  const c = main.variable(true)
    .define("c", ["val", "b", "a"], (val, b, a) => `${val}, (${b}), ${a}`)
    .shadow("val", 300);

  assert.deepStrictEqual(await valueof(a), {value: 100});
  assert.deepStrictEqual(await valueof(b), {value: "200, 100"});
  assert.deepStrictEqual(await valueof(c), {value: "300, (200, 100), 100"});
});

it("variable.shadow(…) can shadow a non-existent input", async () => {
  const runtime = new Runtime();
  const main = runtime.module();

  const a = main.variable(true).define("a", ["val"], (val) => val);

  a.shadow("val", 100);

  assert.deepStrictEqual(await valueof(a), {value: 100});
});

it("variable.shadow(…) allows passing inputs to the shadow", async () => {
  const runtime = new Runtime();
  const main = runtime.module();

  main.define("foo", [], 1000);
  const a = main.variable(true).define("a", ["val"], (val) => val);

  a.shadow("val", ["foo"], (foo) => foo / 2);

  assert.deepStrictEqual(await valueof(a), {value: 500});
});

it("variable.shadow(…) can depend on the module-scoped variable of the same name", async () => {
  const runtime = new Runtime();
  const main = runtime.module();

  main.define("val", [], 1000);
  const a = main.variable(true).define("a", ["val"], (val) => val);

  a.shadow("val", ["val"], (val) => val / 2);

  assert.deepStrictEqual(await valueof(a), {value: 500});
});

it("variable.shadow(…) can be chained", async () => {
  const runtime = new Runtime();
  const main = runtime.module();

  const a = main.variable(true).define("a", ["x", "y"], (x, y) => `${x}, ${y}`);

  a.shadow("x", 10).shadow("y", 20);

  assert.deepStrictEqual(await valueof(a), {value: "10, 20"});
});

it("variable.unshadow(…) unshadowing a non-existent shadow throws an error", async () => {
  const runtime = new Runtime();
  const main = runtime.module();

  const a = main.define("a", ["val"], (val) => val);
  await assert.throws(() => a.unshadow("val"), RuntimeError, "no shadow found for input val");
});
