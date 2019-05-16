import {Runtime} from "../../src/";
import tape from "../tape";

tape("module.value(name) returns a promise to the variable’s next value", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.variable(true).define("foo", [], () => 42);
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) implicitly makes the variable reachable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => 42);
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) supports errors", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => { throw new Error(42); });
  try {
    await module.value("foo");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "42");
  }
});

tape("module.value(name) supports generators", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], function*() { yield 1; yield 2; yield 3; });
  test.deepEqual(await module.value("foo"), 1);
  test.deepEqual(await module.value("foo"), 2);
  test.deepEqual(await module.value("foo"), 3);
  test.deepEqual(await module.value("foo"), 3);
});

tape("module.value(name) supports promises", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], async () => { return await 42; });
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) supports constants", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], 42);
  test.deepEqual(await module.value("foo"), 42);
});

tape("module.value(name) supports missing variables", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  try {
    await module.value("bar");
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "bar is not defined");
  }
});

tape("module.value(name) returns a promise on error", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const promise = module.value("bar");
  try {
    await promise;
    test.fail();
  } catch (error) {
    test.deepEqual(error.message, "bar is not defined");
  }
});

tape("module.value(name) does not force recomputation", async test => {
  let foo = 0;
  const runtime = new Runtime();
  const module = runtime.module();
  module.define("foo", [], () => ++foo);
  test.deepEqual(await module.value("foo"), 1);
  test.deepEqual(await module.value("foo"), 1);
  test.deepEqual(await module.value("foo"), 1);
});
