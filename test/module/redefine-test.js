import {Runtime} from "../../src/";
import {RuntimeError} from "../../src/errors";
import tape from "../tape";
import valueof from "../variable/valueof";

tape("module.redefine(name, inputs, definition) can redefine an existing variable", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable("#foo").define("foo", [], () => 42);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 42});
  module.redefine("foo", [], () => 43);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 43});
  module.redefine("foo", () => 44);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 44});
});

tape("module.redefine(name, inputs, function) throws an error when attempting to redefine a nonexistent variable", {html: "<div id=foo />"}, async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  await new Promise(setImmediate);
  try {
    module.redefine("foo", [], () => 1);
  } catch (e) {
    test.equals(e.constructor, RuntimeError);
    test.equals(e.message, "foo is not defined");
  }
});
