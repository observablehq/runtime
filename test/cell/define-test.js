import {Notebook} from "../../";
import tape from "../tape";

tape("Basic cells can be defined with values", {html: "<div id=cell />"}, async test => {
  const notebook = new Notebook();
  const cell = notebook.cell("#cell").define({
    inputs: [],
    body: `"use strict";(function(){return 101;})`
  });
  await new Promise(setImmediate);
  test.deepEqual(await cell._variable._promise, 101);
});

tape("Cells that don’t reference a DOM node aren’t evaluated.", {html: "<div id=cell />"}, async test => {
  const notebook = new Notebook();
  const cell = notebook.cell().define({
    inputs: [],
    body: `(function(){return 101;})`
  });
  await new Promise(setImmediate);
  test.deepEqual(await cell._variable._promise, undefined);
});

tape("Cells can depend on the values of other cells, defined out of order.", {html: "<div id=cell />"}, async test => {
  const notebook = new Notebook();
  const cell = notebook.cell("#cell").define({
    inputs: ["inputCell"],
    body: `(function(inputCell){return inputCell;})`
  });
  notebook.cell().define({
    name: "inputCell",
    inputs: [],
    body: `(function(){return "value";})`
  });
  await new Promise(setImmediate);
  test.deepEqual(await cell._variable._promise, "value");
});

tape("Cells can be defined as views.", {html: "<div id=cell />"}, async test => {
  const notebook = new Notebook();
  const cell = notebook.cell("#cell").define({
    name: "cell",
    inputs: ["html"],
    body: `"use strict";(function(html){return(
html\`<input type=range min=0 max=100 step=1>\`
)})`,
    view: true
  });
  await new Promise(setImmediate);
  const view = await cell._variable._promise;
  test.deepEqual(view.tagName, "INPUT");
  test.deepEqual(view, document.getElementById("cell").childNodes[0]);
});

tape("Cells can be defined as basic mutables.", {html: "<div id=mut /><div id=mutator />"}, async test => {
  const notebook = new Notebook();
  const mut = notebook.cell("#mut").define({
    name: "mut",
    body: `() => 101`,
    mutable: true
  });
  await new Promise(setImmediate);
  test.equals(await mut._variable._promise, 101);
});

tape("Mutable cells have values that may be set by other cells", {html: "<div id=mut /><div id=mutator />"}, async test => {
  const notebook = new Notebook();
  const mut = notebook.cell("#mut").define({
    name: "mut",
    body: `() => 101`,
    mutable: true
  });
  const mutator = notebook.cell("#mutator").define({
    inputs: ["mutable mut"],
    body: `($0) => {$0.value = 201;}`
  });
  await new Promise(setImmediate);
  test.equals(await mut._variable._promise, 201);
  test.equals(await mutator._variable._promise, undefined);
});
