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
  await new Promise(setImmediate);
  test.deepEqual(await valueof(a0), {value: 1});
  test.deepEqual(await valueof(b0), {value: 2});
  test.deepEqual(await valueof(c0), {value: 3});
  test.deepEqual(await valueof(c1), {value: 43});
  test.deepEqual(await valueof(d1), {value: 42});
});
