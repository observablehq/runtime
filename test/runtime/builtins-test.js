import {Runtime} from "../../src/";
import tape from "../tape";
import valueof from "../variable/valueof";

tape("new Runtime(builtins) allows builtins to be defined as promises", async test => {
  const runtime = new Runtime({color: Promise.resolve("red")});
  const main = runtime.module();
  const foo = main.variable(true).define(null, ["color"], color => color);
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("new Runtime(builtins) allows builtins to be defined as functions", async test => {
  const runtime = new Runtime({color: () => "red"});
  const main = runtime.module();
  const foo = main.variable(true).define(null, ["color"], color => color);
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("new Runtime(builtins) allows builtins to be defined as async functions", async test => {
  const runtime = new Runtime({color: async () => "red"});
  const main = runtime.module();
  const foo = main.variable(true).define(null, ["color"], color => color);
  test.deepEqual(await valueof(foo), {value: "red"});
});

tape("new Runtime(builtins) allows builtins to be defined as generators", async test => {
  let i = 0;
  const runtime = new Runtime({i: function*() { while (i < 3) yield ++i; }});
  const main = runtime.module();
  const foo = main.variable(true).define(null, ["i"], i => i);
  test.deepEqual(await valueof(foo), {value: 1});
  test.deepEqual(await valueof(foo), {value: 2});
  test.deepEqual(await valueof(foo), {value: 3});
});
