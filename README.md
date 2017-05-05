# d3-express

The reactive runtime for [d3.express](https://d3.express) documents.

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

A runtime is responsible for evaluating [variables](#variables) in topological order whenever their input values change. A runtime typically has one or more [modules](#modules) to scope variables. Collectively, these variables represent a reactive program managed by the runtime.

<a href="#runtime" name="runtime">#</a> d3.<b>runtime</b>([<i>builtins</i>])

Returns a new [runtime](#runtimes). If a *builtins* object is specified, each property on the *builtins* object defines a builtin for the runtime; these builtins are available as named inputs to any [defined variables](#variable_define) on any [module](#modules) associated with this runtime. If *builtins* is not specified, the d3.express [standard library](#standard-library) is used.

For example, to define the builtin `color`:

```js
var module = d3.runtime({color: "red"}).module();

module.variable().define(null, ["color"], color => {
  console.log(`Hello, ${color}.`); // "Hello, red."
});
```

Builtins must have constant values; unlike [variables](#variables), they cannot be defined as functions. However, a builtin *may* be defined as a promise, in which case any referencing variables will be evaluated only after the promise is resolved. Variables may not override builtins.

<a href="#runtime_module" name="runtime_module">#</a> <i>runtime</i>.<b>module</b>()

Returns a new [module](#modules) for this [runtime](#runtimes).

### Modules

A module is a namespace for [variables](#variables); within a module, variables should typically have unique names. [Imports](#variable_import) allow variables to be referenced across modules.

<a href="#module_variable" name="module_variable">#</a> <i>module</i>.<b>variable</b>([<i>element</i>])

Returns a new [variable](#variables) for this [module](#modules). The variable is initially undefined.

If *element* is specified, the value of this variable will be displayed in the specified DOM *element*. If the variable’s value is a DOM node, this node replaces the content of the specified *element*; if the variable’s current value is not a DOM node, the object inspector will automatically generate a suitable display for the current value.

A variable without an associated *element* is only computed if any transitive output of the variable has an *element*; variables are computed on an as-needed basis for display. This is particularly useful when the runtime has multiple modules (as with [imports](#variable_import)): only the needed variables from imported modules are computed.

### Variables

A variable defines a piece of state in a reactive program, akin to a cell in a spreadsheet. Variables may be named to allow the definition of derived variables: variables whose value is computed from other variables’ values. Variables are scoped by a [module](#modules) and evaluated by a [runtime](#runtimes).

<a href="#variable_define" name="variable_define">#</a> <i>variable</i>.<b>define</b>(<i>name</i>, <i>inputs</i>, <i>definition</i>)

Redefines this variable to have the specified *name*, taking the variables with the names specified in *inputs* as arguments to the specified *definition* function. If *name* is null, this variable is anonymous and may not be referred to by other variables. The named *inputs* refer to other variables (possibly [imported](#variable_import)) in this variable’s module. Circular inputs are not allowed; the variable will throw a ReferenceError upon evaluation.

The *definition* function may return a promise; derived variables will be computed after the promise resolves. The *definition* function may likewise return a generator; the runtime will pull values from the generator on every animation frame, or if the generator yielded a promise, after the promise is resolved. When the *definition* is invoked, the value of `this` is the variable’s previous value, or undefined if this is the first time the variable is being computed under its current definition. Thus, the previous value is preserved only when input values change; it is *not* preserved if the variable is explicitly redefined.

For example, consider the following module that starts with a single undefined variable, *a*:

```js
var runtime = d3.runtime();

var module = runtime.module();

var a = module.variable();
```

To define variable *a* with the name `foo` and the constant value 42:

```js
a.define("foo", [], () => 42);
```

To define an anonymous variable *b* that takes `foo` as input:

```js
var b = module.variable().define(null, ["foo"], foo => foo * 2);
```

Note that the JavaScript symbols in the above example code (*a* and *b*) have no relation to the variable names (`foo` and null); variable names can change when a variable is redefined or deleted. Each variable corresponds to a cell in a [d3.express](https://d3.express) notebook, but the cell can be redefined to have a different name or definition.

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

<a href="#variable_defineView" name="variable_defineView">#</a> <i>variable</i>.<b>defineView</b>(<i>name</i>, <i>inputs</i>, <i>definition</i>)

…

<a href="#variable_delete" name="variable_delete">#</a> <i>variable</i>.<b>delete</b>()

Deletes this variable’s current definition and name, if any. Any variable in this module that references this variable as an input will subsequently throw a ReferenceError. If exactly one other variable defined this variable’s previous name, such that that variable throws a ReferenceError due to its duplicate definition, that variable’s original definition is restored.

<a href="#variable_import" name="variable_import">#</a> <i>variable</i>.<b>import</b>(<i>module</i>, <i>specifiers</i>)

Redefines this variable to import variables from the specified *module* into this variable’s module according to the *specifiers* array. For example, consider the module *a* which defines a variable named `foo`:

```js
var runtime = d3.runtime();

var a = runtime.module();

a.variable().define("foo", [], () => 42);
```

To import `foo` into module *b* and define a derived variable named `bar`:

```js
var b = runtime.module();

b.variable().import(a, ["foo"]);

b.variable().define("bar", ["foo"], foo => foo * 2);
```

Each element in the *specifiers* array may be either a string or an object with the following properties:

* `member` - the name of the variable to import from the remote module
* `alias` the name of the variable to define in the local module

If a string is specified, or if the *specifier*.alias property is null or undefined, the alias name and member name are the same. For example, to import `foo` into module *c* under the alias `baz`:

```js
var c = runtime.module();

c.variable().import(a, [{member: "foo", alias: "baz"}]);
```

## Standard Library

By default, [d3.runtime](#runtime) provides the following standard builtins:

* [DOM](#dom) - create HTML and SVG elements.
* [Files](#files) - read local files into memory.
* [Generators](#generators) - utilities for generators and iterators.
* [Promises](#promises) - utilities for promises.
* [require](#require) - load third-party libraries.

### DOM

<a href="#DOM_canvas" name="DOM_canvas">#</a> DOM.<b>canvas</b>(<i>width</i>, <i>height</i>)

Returns a new canvas element with the specified *width* and *height*. For example, to create a 960×500 canvas:

```js
var canvas = DOM.canvas(960, 500);
```

This is equivalent to:

```js
var canvas = document.createElement("canvas");
canvas.width = 960;
canvas.height = 500;
```

<a href="#DOM_element" name="DOM_element">#</a> DOM.<b>element</b>([<i>uri</i>, ]<i>name</i>[, <i>options</i>])

Returns a new element with the specified *name*. For example, to create an empty H1 element:

```js
var h1 = DOM.element("h1");
```

This is equivalent to:

```js
var h1 = document.createElement("h1");
```

If a *uri* is specified, uses [*document*.createElementNS](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElementNS) instead of [*document*.createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement). For example, to create an empty SVG element (see also [DOM.svg](#DOM_svg)):

```js
var svg = DOM.element("http://www.w3.org/2000/svg", "svg");
```

This is equivalent to:

```js
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
```

If *options* is specified, they will be passed along to *document*.createElement or *document*.createElementNS to define a custom element.

<a href="#DOM_html" name="DOM_html">#</a> DOM.<b>html</b>(<i>strings</i>, <i>values…</i>)

Returns the HTML element or node represented by the specified *strings* and *values*. This function is intended to be used as a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals_and_escape_sequences). For example, to create an H1 element whose content is “Hello, world!”:

```js
var hello = DOM.html`<h1>Hello, world!</h1>`;
```

If the resulting HTML fragment is not a single HTML element or node, is it wrapped in a DIV element. For example, this expression:

```js
var hello = DOM.html`Hello, <b>world</b>!`;
```

Is equivalent to this expression:

```js
var hello = DOM.html`<div>Hello, <b>world</b>!</div>`;
```

<a href="#DOM_input" name="DOM_input">#</a> DOM.<b>input</b>([<i>type</i>])

Returns a new input element with the specified *type*. If *type* is not specified or null, a text input is created. For example, to create a new file input:

```js
var input = DOM.input("file");
```

This is equivalent to:

```js
var input = document.createElement("input");
input.type = "file";
```

<a href="#DOM_pre" name="DOM_pre">#</a> DOM.<b>pre</b>(<i>strings</i>, <i>values…</i>)

Returns a pre element for the text represented by the specified *strings* and *values*. This function is intended to be used as a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals_and_escape_sequences). For example, to create a pre element whose content is “Hello, world!”:

```js
var hello = DOM.pre`Hello, world!`;
```

This is equivalent to:

```js
var hello = document.createElement("pre");
hello.textContent = "Hello, world!";
```

<a href="#DOM_range" name="DOM_range">#</a> DOM.<b>range</b>(\[<i>min</i>, \]\[<i>max</i>\]\[, <i>step</i>\])

Returns a new range input element. (See also [DOM.input](#input).) If *max* is specified, sets the maximum value of the range to the specified number; if *max* is not specified or null, sets the maximum value of the range to 1. If *min* is specified, sets the minimum value of the range to the specified number; if *min* is not specified or null, sets the minimum value of the range to 0. If *step* is specified, sets the step value of the range to the specified number; if *step* is not specified or null, sets the step value of the range to `any`. For example, to create a slider that ranges the integers from -180 to +180, inclusive:

```js
var input = DOM.range(-180, 180, 1);
```

This is equivalent to:

```js
var input = document.createElement("input");
input.min = -180;
input.max = 180;
input.step = 1;
input.type = "range";
```

<a href="#DOM_select" name="DOM_select">#</a> DOM.<b>select</b>(<i>values</i>)

Returns a new select element with an option for each string in the specified *values* array. For example, to create a drop-down menu of three colors:

```js
var select = DOM.select(["red", "green", "blue"]);
```

This is equivalent to:

```js
var select = document.createElement("select");
var optionRed = select.appendChild(document.createElement("option"));
optionRed.value = optionRed.textContent = "red";
var optionGreen = select.appendChild(document.createElement("option"));
optionGreen.value = optionGreen.textContent = "green";
var optionBlue = select.appendChild(document.createElement("option"));
optionBlue.value = optionBlue.textContent = "blue";
```

For greater control, consider using [DOM.html](#DOM_html) instead. For example, here is an equivalent way to define the above drop-down menu:

```js
var select = DOM.html`<select>
  <option value="red">red</option>
  <option value="green">green</option>
  <option value="blue">blue</option>
</select>`
```

<a href="#DOM_svg" name="DOM_svg">#</a> DOM.<b>svg</b>(<i>width</i>, <i>height</i>)

Returns a new SVG element with the specified *width* and *height*. For example, to create a 960×500 blank SVG:

```js
var svg = DOM.svg(960, 500);
```

This is equivalent to:

```js
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", 960);
svg.setAttribute("height", 500);
```

<a href="#DOM_text" name="DOM_text">#</a> DOM.<b>text</b>(<i>string</i>)

Returns a new text node with the specified *string* value. For example, to say hello:

```js
var hello = DOM.text("Hello, world!");
```

This is equivalent to:

```js
var hello = document.createTextNode("Hello, world!");
```

### Files

<a href="#Files_buffer" name="Files_buffer">#</a> Files.<b>buffer</b>(<i>file</i>)

Reads the specified *file*, returning a promise of the ArrayBuffer yielded by [*fileReader*.readAsArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsArrayBuffer). This is useful for reading binary files, such as shapefiles and ZIP archives.

<a href="#Files_text" name="Files_text">#</a> Files.<b>text</b>(<i>file</i>)

Reads the specified *file*, returning a promise of the string yielded by [*fileReader*.readAsText](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText). This is useful for reading text files, such as plain text, CSV, Markdown and HTML.

<a href="#Files_url" name="Files_url">#</a> Files.<b>url</b>(<i>file</i>)

Reads the specified *file*, returning a promise of the data URL yielded by [*fileReader*.readAsDataURL](https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL). This is useful for reading a file into memory, represented as a data URL. For example, to display a local file as an image:

```js
Files.url(file).then(url => {
  var image = new Image;
  image.src = url;
  return image;
})
```

However, note that it may be more efficient to use the synchronous [URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) method instead, such as:

```js
var image = new Image;
image.src = URL.createObjectURL(file);
return image;
```

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

<a href="#require" name="require">#</a> <b>require</b>(<i>names…</i>)

Returns a promise of the [asynchronous module definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) (AMD) with the specified *names*, loaded from [unpkg](https://unpkg.com/). Each module *name* can be a package (or scoped package) name optionally followed by the at sign (`@`) and a semver range. For example, to load [d3-array](https://github.com/d3/d3-array):

```js
require("d3-array").then(d3 => {
  console.log(d3.range(100));
});
```

Or, to load [d3-array](https://github.com/d3/d3-array) and [d3-color](https://github.com/d3/d3-color) and merge them into a single object:

```js
require("d3-array", "d3-color").then(d3 => {
  console.log(d3.range(360).map(h => d3.hsl(h, 1, 0.5)));
});
```

Or, to load [d3-array](https://github.com/d3/d3-array) 1.1.x:

```js
require("d3-array@1.1").then(d3 => {
  console.log(d3.range(100));
});
```

See [d3-require](https://github.com/d3/d3-require) for more information.
