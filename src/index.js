import {runtimeLibrary} from "@observablehq/notebook-stdlib";
import Mutable from "./mutable";
import {default as runtime} from "./runtime";
export {RuntimeError} from "./errors";
export {runtime, runtimeLibrary, Mutable};

const library = runtimeLibrary();

export function standardRuntime() {
  return runtime(library);
}
