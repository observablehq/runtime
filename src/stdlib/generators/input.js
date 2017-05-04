export default function*(input) {
  var value0, value1 = valueof(input), event = eventof(input), resolve;

  input.addEventListener(event, inputted);

  function inputted() {
    value1 = valueof(input);
    if (resolve == null) return;
    resolve(value0 = value1);
    resolve = null;
  }

  try {
    while (true) {
      yield value1 === value0
          ? new Promise(_ => resolve = _)
          : Promise.resolve(value0 = value1);
    }
  } finally {
    input.removeEventListener(event, inputted);
  }
}

function valueof(input) {
  switch (input.type) {
    case "range":
    case "number": return input.valueAsNumber;
    case "date": return input.valueAsDate;
    case "checkbox": return input.checked;
    case "file": return input.multiple ? input.files : input.files[0];
    default: return input.value;
  }
}

function eventof(input) {
  switch (input.type) {
    case "button":
    case "submit":
    case "checkbox": return "click";
    case "file": return "change";
    default: return "input";
  }
}
