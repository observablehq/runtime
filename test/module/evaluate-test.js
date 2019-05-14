import {Runtime} from "../../src/";
import tape from "../tape";

tape("module.evaluate(name) returns a promise to the variable’s next value", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.variable(true).define("foo", [], () => 42);
  test.deepEqual(await module.evaluate("foo"), 42);
});

tape("module.evaluate(name) implicitly makes the variable reachable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  test.deepEqual(await module.evaluate("foo"), 42);
});

tape("module.evaluate(name) supports errors", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => { throw new Error(42); });
  try {
    await module.evaluate("foo");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "42");
  }
});

tape("module.evaluate(name) supports generators", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], function*() { yield 42; });
  test.deepEqual(await module.evaluate("foo"), 42);
});

tape("module.evaluate(name) supports promises", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], async () => { return await 42; });
  test.deepEqual(await module.evaluate("foo"), 42);
});

tape("module.evaluate(name) supports constants", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], 42);
  test.deepEqual(await module.evaluate("foo"), 42);
});

tape("module.evaluate(name) supports missing variables", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  try {
    await module.evaluate("bar");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "bar is not defined");
  }
});
