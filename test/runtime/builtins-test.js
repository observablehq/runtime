import {runtime as createRuntime} from "../../";
import tape from "../tape";
import valueof from "../variable/valueof";

tape("runtime(builtins) allows builtins to be defined as promises", {html: "<div id=foo />"}, async test => {
  const runtime = createRuntime({color: Promise.resolve("red")});
  const main = runtime.module();
  const foo = main.variable("#foo").define(null, ["color"], color => color);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("runtime(builtins) allows builtins to be defined as functions", {html: "<div id=foo />"}, async test => {
  const runtime = createRuntime({color: () => "red"});
  const main = runtime.module();
  const foo = main.variable("#foo").define(null, ["color"], color => color);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("runtime(builtins) allows builtins to be defined as async functions", {html: "<div id=foo />"}, async test => {
  const runtime = createRuntime({color: async () => "red"});
  const main = runtime.module();
  const foo = main.variable("#foo").define(null, ["color"], color => color);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("runtime(builtins) allows builtins to be defined as generators", {html: "<div id=foo />"}, async test => {
  let i = 0;
  const runtime = createRuntime({i: function*() { while (true) yield ++i; }});
  const main = runtime.module();
  const foo = main.variable("#foo").define(null, ["i"], i => i);
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 1});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 2});
  await new Promise(setImmediate);
  test.deepEqual(await valueof(foo), {value: 3});
  runtime._builtin._scope.get("i")._interrupt();
});
