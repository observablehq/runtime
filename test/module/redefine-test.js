import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "../variable/valueof";

tape("module.redefine(name, inputs, definition) can redefine a normal variable", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define("foo", [], () => 42);
  test.equal(module.redefine("foo", [], () => 43), foo);
  test.deepEqual(await valueof(foo), {value: 43});
});

tape("module.redefine(name, inputs, definition) can redefine an implicit variable", async test => {
  const runtime = new Runtime({foo: 42});
  const module = runtime.module();
  const bar = module.variable(true).define("bar", ["foo"], foo => foo + 1);
  module.redefine("foo", [], () => 43);
  test.deepEqual(await valueof(bar), {value: 44});
});

tape("module.redefine(name, inputs, definition) can’t redefine a duplicate definition", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo1 = module.variable(true).define("foo", [], () => 1);
  const foo2 = module.variable(true).define("foo", [], () => 2);
  try {
    module.redefine("foo", [], () => 3);
    test.fail();
  } catch (error) {
    test.deepEqual(error, {message: "foo is defined more than once", input: undefined});
  }
  test.deepEqual(await valueof(foo1), {error: "RuntimeError: foo is defined more than once"});
  test.deepEqual(await valueof(foo2), {error: "RuntimeError: foo is defined more than once"});
});

tape("module.redefine(name, inputs, definition) throws an error if the specified variable doesn’t exist", async test => {
  const runtime = new Runtime();
  const module = runtime.module();
  const foo = module.variable(true).define("foo", [], () => 42);
  try {
    module.redefine("bar", [], () => 43, foo);
    test.fail();
  } catch (error) {
    test.deepEqual(error, {message: "bar is not defined", input: undefined});
  }
});
