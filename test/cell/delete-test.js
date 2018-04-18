import {Notebook, RuntimeError} from "../../";
import tape from "../tape";

tape("Cells can be deleted, removing them from the runtime graph.", {html: "<div id=cell />"}, async test => {
  const notebook = new Notebook();
  const cell = notebook.cell("#cell").define({
    inputs: ["inputCell"],
    value: inputCell => inputCell
  });
  const input = notebook.cell().define({
    name: "inputCell",
    inputs: [],
    value: () => "value"
  });
  await new Promise(setImmediate);
  test.deepEqual(await cell._variable._promise, "value");
  input.delete();
  await new Promise(setImmediate);
  try {
    await cell._variable._promise;
  } catch (error) {
    test.equals(error.constructor, RuntimeError);
    test.deepEqual(error, {
      message: 'inputCell is not defined',
      input: 'inputCell'
    });
  }
});
