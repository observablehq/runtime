import {Notebook} from "../../";
import tape from "../tape";

tape("new Notebook() can define basic cells with values", {html: "<div id=hi />"}, async test => {
  const notebook = new Notebook();
  const hi = notebook.cell("#hi").define({
    inputs: [],
    value: () => "hi"
  });
  await new Promise(setImmediate);
  test.deepEqual(await hi._variable._promise, "hi");
});

tape("new Notebook() uses the Observable standard library as built-ins", {html: "<div id=hi />"}, async test => {
  const notebook = new Notebook();
  const hi = notebook.cell("#hi").define({
    inputs: ["html"],
    value: html => html`<h1>hi</h1>`
  });
  await new Promise(setImmediate);
  const value = await hi._variable._promise;
  test.deepEqual(value.toString(), "[object HTMLHeadingElement]");
  test.deepEqual(value.innerHTML, "hi");
});
