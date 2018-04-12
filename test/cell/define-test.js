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
