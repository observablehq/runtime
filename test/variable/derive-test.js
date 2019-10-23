import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "./valueof";

tape("module.derive(overrides, module) injects variables into a copied module", async test => {
  const runtime = new Runtime();
  const module0 = runtime.module();
  const a0 = module0.variable(true).define("a", [], () => 1);
  const b0 = module0.variable(true).define("b", [], () => 2);
  const c0 = module0.variable(true).define("c", ["a", "b"], (a, b) => a + b);
  const module1 = runtime.module();
  const module1_0 = module0.derive([{name: "d", alias: "b"}], module1);
  const c1 = module1_0.variable(true).define(null, ["c"], c => c);
  const d1 = module1.define("d", [], () => 42);
  test.deepEqual(await valueof(a0), {value: 1});
  test.deepEqual(await valueof(b0), {value: 2});
  test.deepEqual(await valueof(c0), {value: 3});
  test.deepEqual(await valueof(c1), {value: 43});
  test.deepEqual(await valueof(d1), {value: 42});
});

tape("module.derive(…) copies module-specific builtins", async test => {
  const runtime = new Runtime();
  const module0 = runtime.module();
  module0.builtin("a", 1);
  const b0 = module0.variable(true).define("b", ["a"], a => a + 1);
  const module1_0 = module0.derive([], module0);
  const c1 = module1_0.variable(true).define("c", ["a"], a => a + 2);
  test.deepEqual(await valueof(b0), {value: 2});
  test.deepEqual(await valueof(c1), {value: 3});
});

tape("module.derive(…) can inject into modules that inject into modules", async test => {
  const runtime = new Runtime();
  const A = runtime.module();
  A.define("a", 1);
  A.define("b", 2);
  A.define("c", ["a", "b"], (a, b) => a + b);
  const B = runtime.module();
  B.define("d", 3);
  const BA = A.derive([{name: "d", alias: "b"}], B);
  B.import("c", "e", BA);
  const C = runtime.module();
  C.define("f", 4);
  const CB = B.derive([{name: "f", alias: "d"}], C);
  const g = C.variable(true).import("e", "g", CB);
  test.deepEqual(await valueof(g), {value: 5});
  test.strictEqual(g._module, C);
  test.strictEqual(g._inputs[0]._module, CB);
  test.strictEqual(g._inputs[0]._inputs[0]._module._source, BA);
  test.strictEqual(C._source, null);
  test.strictEqual(CB._source, B);
  test.strictEqual(BA._source, A);
});

tape("module.derive(…) does not copy non-injected modules", async test => {
  const runtime = new Runtime();
  const A = runtime.module();
  A.define("a", 1);
  A.define("b", 2);
  A.define("c", ["a", "b"], (a, b) => a + b);
  const B = runtime.module();
  B.import("c", "e", A);
  const C = runtime.module();
  C.define("f", 4);
  const CB = B.derive([{name: "f", alias: "d"}], C);
  const g = C.variable(true).import("e", "g", CB);
  test.deepEqual(await valueof(g), {value: 3});
  test.strictEqual(g._module, C);
  test.strictEqual(g._inputs[0]._module, CB);
  test.strictEqual(g._inputs[0]._inputs[0]._module, A);
});

tape("module.derive(…) does not copy non-injected modules, again", async test => {
  const runtime = new Runtime();
  const A = runtime.module();
  A.define("a", () => ({}));
  const B = runtime.module();
  B.import("a", A);
  const C = runtime.module();
  const CB = B.derive([], C);
  const a1 = C.variable(true).import("a", "a1", CB);
  const a2 = C.variable(true).import("a", "a2", A);
  const {value: v1} = await valueof(a1);
  const {value: v2} = await valueof(a2);
  test.deepEqual(v1, {});
  test.strictEqual(v1, v2);
});
