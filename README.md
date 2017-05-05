# d3-express

…

## Installing

If you use NPM, `npm install d3-express`. Otherwise, download the [latest release](https://github.com/d3/d3-express/releases/latest). You can also load directly from [unpkg.com](https://unpkg.com/d3-express/). AMD, CommonJS, and vanilla environments are supported. In vanilla, a `d3` global is exported:

```html
<script src="https://unpkg.com/d3-express@0"></script>
<script>

var runtime = d3.runtime();

</script>
```

## API Reference

### Runtimes

A runtime is responsible for evaluating [variables](#variables) in topological order whenever their input values change.

<a href="#runtime" name="runtime">#</a> d3.<b>runtime</b>([<i>builtins</i>])

Returns a new [runtime](#runtimes). If a *builtins* object is specified, each property on the *builtins* object defines a builtin variable for the runtime; these builtin variables are available as named inputs to any [defined variables](#variable_define) on any [module](#modules) associated with this runtime. For example, to define the builtin `color`:

```js
var module = d3.runtime({color: "red"}).module();

module.variable().define(null, ["color"], color => {
  console.log(`Hello, ${color}.`); // "Hello, red."
});
```

Builtins must be constant values; unlike [normal variables](#variable_define), they cannot be defined as functions. However, a builtin may be defined as a promise, in which case any referencing variables will only be evaluated when the promise is resolved. Defined variables may not override builtins. If *builtins* is not specified, the d3.express [standard library](#standard-library) is used.

<a href="#runtime_module" name="runtime_module">#</a> <i>runtime</i>.<b>module</b>()

Returns a new [module](#modules) for this [runtime](#runtimes).

### Modules

A module is a namespace for [variables](#variables); within a module, variables should typically have unique names.

<a href="#module_variable" name="module_variable">#</a> <i>module</i>.<b>variable</b>([<i>element</i>])

Returns a new [variable](#variables) for this [module](#modules).

If *element* is specified, the value of this variable will be displayed in the specified DOM *element*. If the variable’s value is a DOM node, this node replaces the content of the specified *element*; if the variable’s current value is not a DOM node, the object inspector will automatically generate a suitable display for the current value.

A variable with no associated *element* is only computed if any transitive output of the variable has an *element*. In other words, variables are computed on an as-needed basis to be displayed. This is particularly useful when the runtime has multiple modules (as with [imports](#variable_import)): only the needed variables from imported modules are computed.

### Variables

A variable defines a piece of state in a reactive program, akin to a cell in a spreadsheet. Variables may be named to allow the definition of derived variables: variables whose value is computed from other variables’ values.

<a href="#variable_define" name="variable_define">#</a> <i>variable</i>.<b>define</b>(<i>name</i>, <i>inputs</i>, <i>definition</i>)

Redefines this variable to have the specified *name*, taking the variables with the names specified in *inputs* as arguments to the specified *definition* function. If *name* is null, this variable is anonymous and may not be referred to by other variables. The named *inputs* refer to other variables (possibly [imported variables](#variable_import)) in this variable’s module. The *definition* function may return a promise; derived variables will only be computed when the promise resolves. The *definition* function may likewise return a generator; the runtime will pull values from the generator on every animation frame, or if the generator yielded a promise, when the promise is resolved.

For example, consider the following module that starts with a single undefined variable, *a*:

```js
var runtime = d3.runtime();

var module = runtime.module();

var a = module.variable();
```

To define *a* with the name `foo` and the constant value 42:

```js
a.define("foo", [], () => 42);
```

To define an anonymous variable *b* that takes `foo` as input:

```js
var b = module.variable().define(null, ["foo"], foo => foo * 2);
```

Note that the JavaScript symbols in the above example code (*a* and *b*) have no relation to the variable names (`foo` and null); variable names can change when a variable is redefined or deleted.

If more than one variable has the same *name* at the same time in the same module, these variables’ definitions are temporarily overridden to throw a ReferenceError. When and if the duplicate variables are [deleted](#variable_delete), or are redefined to have unique names, the original definition of the remaining variable (if any) is restored. For example, here variables *a* and *b* will throw a ReferenceError:

```js
var module = d3.runtime().module();
var a = module.variable().define("foo", [], () => 1);
var b = module.variable().define("foo", [], () => 2);
```

If *a* or *b* is redefined to have a different name, both *a* and *b* will subsequently resolve to their desired values:

```js
b.define("bar", [], () => 2);
```

Likewise deleting *a* or *b* would allow the other variable to resolve to its desired value.

<a href="#variable_delete" name="variable_delete">#</a> <i>variable</i>.<b>delete</b>()

…

<a href="#variable_import" name="variable_import">#</a> <i>variable</i>.<b>import</b>(<i>module</i>, <i>imports</i>)

…

## Standard Library

By default, [d3.runtime](#runtime) provides the following standard builtins:

* [DOM](#dom) - create HTML and SVG elements.
* [Files](#files) - read local files into memory.
* [Generators](#generators) - utilities for generators and iterators.
* [Promises](#promises) - utilities for promises.
* [require](#require) - load third-party libraries.

### DOM

<a href="#DOM_canvas" name="DOM_canvas">#</a> DOM.<b>canvas</b>(<i>width</i>, <i>height</i>)

Returns a new canvas element with the specified *width* and *height*. For example, this:

```js
var canvas = DOM.canvas(960, 500);
```

Is equivalent to:

```js
var canvas = document.createElement("canvas");
canvas.width = 960;
canvas.height = 500;
```

<a href="#DOM_element" name="DOM_element">#</a> DOM.<b>element</b>([<i>uri</i>, ]<i>name</i>[, <i>options</i>])

Returns a new element with the specified *name*. For example, this:

```js
var h1 = DOM.element("h1");
```

Equivalent to:

```js
var h1 = document.createElement("h1");
```

If a *uri* is specified, uses [*document*.createElementNS](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElementNS) instead of [*document*.createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement). For example, this:

```js
var svg = DOM.element("http://www.w3.org/2000/svg", "svg");
```

Is equivalent to this:

```js
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
```

See also [DOM.svg](#DOM_svg). If *options* is specified, they will be passed along to *document*.createElement or *document*.createElementNS to define a custom element.

<a href="#DOM_html" name="DOM_html">#</a> DOM.<b>html</b>(<i>strings</i>, <i>values…</i>)

Returns the HTML element or node represented by the specified *strings* and *values*. This function is intended to be used as a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals_and_escape_sequences). For example, to create an H1 element whose text content is “Hello, world!”:

```js
DOM.html`<h1>Hello, world!</h1>`
```

If the resulting HTML fragment is not a single HTML element or node, is it wrapped in a DIV element. For example, this expression:

```js
DOM.html`Hello, <b>world</b>!`
```

Is equivalent to this expression:

```js
DOM.html`<div>Hello, <b>world</b>!</div>`
```

<a href="#DOM_input" name="DOM_input">#</a> DOM.<b>input</b>([<i>type</i>])

Returns a new input element with the specified *type*. For example, this:

```js
var input = DOM.input("file");
```

Is equivalent to:

```js
var input = document.createElement("input");
input.type = "file";
```

If *type* is not specified or null, the `text` input type is used.

<a href="#DOM_pre" name="DOM_pre">#</a> DOM.<b>pre</b>(<i>strings</i>, <i>values…</i>)

Returns a pre element for the text represented by the specified *strings* and *values*. This function is intended to be used as a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals_and_escape_sequences). For example, to create a pre element whose text content is “Hello, world!”:

```js
var pre = DOM.pre`Hello, world!`;
```

This is equivalent to:

```js
var pre = document.createElement("pre");
pre.textContent = "Hello, world!";
```

<a href="#DOM_range" name="DOM_range">#</a> DOM.<b>range</b>(\[<i>min</i>, \]\[<i>max</i>\]\[, <i>step</i>\])

Returns a new input element of type `range`. If *max* is specified, sets the maximum value of the range to the specified number; if *max* is not specified or null, sets the maximum value of the range to 1. If *min* is specified, sets the minimum value of the range to the specified number; if *min* is not specified or null, sets the minimum value of the range to 0. If *step* is specified, sets the step value of the range to the specified number; if *step* is not specified or null, sets the step value of the range to `any`. For example, this:

```js
var input = DOM.range(-180, 180, 1);
```

Is equivalent to this:

```js
var input = document.createElement("input");
input.min = -180;
input.max = 180;
input.step = 1;
input.type = "range";
```

<a href="#DOM_select" name="DOM_select">#</a> DOM.<b>select</b>(<i>values</i>)

Returns a new select element with an option for each of the strings in the specified *values* array. For example, this:

```js
var select = DOM.select(["red", "green", "blue"]);
```

Is equivalent to:

```js
var select = document.createElement("select");
var optionRed = select.appendChild(document.createElement("option"));
optionRed.value = optionRed.textContent = "red";
var optionGreen = select.appendChild(document.createElement("option"));
optionGreen.value = optionGreen.textContent = "green";
var optionBlue = select.appendChild(document.createElement("option"));
optionBlue.value = optionBlue.textContent = "blue";
```

<a href="#DOM_svg" name="DOM_svg">#</a> DOM.<b>svg</b>(<i>width</i>, <i>height</i>)

Returns a new SVG element with the specified *width* and *height*. For example, this:

```js
var svg = DOM.svg(960, 500);
```

Is equivalent to this:

```js
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");;
svg.setAttribute("width", 960);
svg.setAttribute("height", 500);
```

<a href="#DOM_text" name="DOM_text">#</a> DOM.<b>text</b>(<i>string</i>)

Returns a new text content with the specified *string* value. For example, this:

```js
var text = DOM.text("Hello, world!");
```

Is equivalent to this:

```js
var text = document.createTextNode("Hello, world!");
```

### Files

<a href="#Files_buffer" name="Files_buffer">#</a> Files.<b>buffer</b>(<i>file</i>)

…

<a href="#Files_text" name="Files_text">#</a> Files.<b>text</b>(<i>file</i>)

…

<a href="#Files_url" name="Files_url">#</a> Files.<b>url</b>(<i>file</i>)

…

### Generators

<a href="#Generators_filter" name="Generators_filter">#</a> Generators.<b>filter</b>(<i>iterator</i>, <i>test</i>)

…

<a href="#Generators_input" name="Generators_input">#</a> Generators.<b>input</b>(<i>input</i>)

…

<a href="#Generators_map" name="Generators_map">#</a> Generators.<b>map</b>(<i>iterator</i>, <i>transform</i>)

…

<a href="#Generators_range" name="Generators_range">#</a> Generators.<b>range</b>([<i>start</i>, ]<i>stop</i>[, <i>step</i>])

…

<a href="#Generators_valueAt" name="Generators_valueAt">#</a> Generators.<b>valueAt</b>(<i>iterator</i>, <i>index</i>)

…

### Promises

<a href="#Promises_delay" name="Promises_delay">#</a> Promises.<b>delay</b>(<i>duration</i>[, <i>value</i>])

…

<a href="#Promises_when" name="Promises_when">#</a> Promises.<b>when</b>(<i>date</i>[, <i>value</i>])

…

### require

<a href="#require" name="require">#</a> <b>require</b>(<i>name</i>)

…
