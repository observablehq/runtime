import {runtime as createRuntime} from "../../";
import tape from "../tape";
import valueof from "./valueof";

tape("variable.delete allows a variable to be deleted", {html: "<div id=foo /><div id=bar />"}, async test => {
  const runtime = createRuntime();
  const main = runtime.module();
  const foo = main.variable("#foo").define("foo", [], () => 1);
  const bar = main.variable("#bar").define("bar", ["foo"], foo => new Promise(resolve => setImmediate(() => resolve(foo))));
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(bar), {value: 1});
  foo.delete();
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: undefined});
  test.deepEqual(await valueof(bar), {error: "ResolutionError: foo is not defined"});
});
