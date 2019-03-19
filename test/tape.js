import {JSDOM} from "jsdom";
import _ from "tape-await";

export default function tape(description, options, run) {
  if (arguments.length === 2) run = options, options = undefined;
  return _(description, wrap(options, run));
}

tape.skip = function(description, options, run) {
  if (arguments.length === 2) run = options, options = undefined;
  return _.skip(description, wrap(options, run));
};

tape.only = function(description, options, run) {
  if (arguments.length === 2) run = options, options = undefined;
  return _.only(description, wrap(options, run));
};

function wrap(options, run) {
  return async test => {
    const window = new JSDOM().window;
    const document = window.document;
    global.window = window;
    global.document = document;
    global.Element = window.Element;
    global.Text = window.Text;
    global.Node = window.Node;
    try {
      await run(test);
      await new Promise(resolve => setTimeout(resolve, 20));
    } finally {
      delete global.window;
      delete global.document;
      delete global.Element;
      delete global.Text;
      delete global.Node;
    }
  };
}
