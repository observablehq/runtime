# d3-express

This library implements the reactive runtime for [d3.express](https://d3.express). It lets you publish dynamic and interactive documents you author in d3.express wherever you want: on your website, integrated into your application or interactive dashboard, etc. You can also use this library to author reactive documents programmatically, to build alternative editors on top of d3.express’ reactive model, or simply to better understand the reactive model of d3.express.

This library also defines the [standard library](#standard-library) for d3.express:

* [DOM](#dom) - create HTML and SVG elements.
* [Files](#files) - read local files into memory.
* [Generators](#generators) - utilities for generators and iterators.
* [Promises](#promises) - utilities for promises.
* [require](#require) - load third-party libraries.

We welcome contributions and questions. Please get in touch!

## Installing

If you use NPM, `npm install d3-express`. Otherwise, download the [latest release](https://github.com/d3/d3-express/releases/latest). You can also load directly from [unpkg.com](https://unpkg.com/d3-express/). AMD, CommonJS, and vanilla environments are supported. In vanilla, a `d3` global is exported.

For example, here is a simple document to say hello:

```html
<!DOCTYPE html>
<style>@import url(https://unpkg.com/d3-express@0/style.css);</style>
<body class="d3--body">
<p>What is your name?
<div id="name"></div>
<div id="hello"></div>
<script src="https://unpkg.com/d3-express@0"></script>
<script>

var runtime = d3.runtime(),
    module = runtime.module();

// This defines a vanilla text input.
module.variable("#name").define("viewof name", ["DOM"], DOM => DOM.input());

// This exposes the current value of the input.
module.variable().define("name", ["Generators", "viewof name"], (Generators, view) => Generators.input(view));

// This uses the input value to say hello.
module.variable("#hello").define(["name"], name => `Hello, ${name || "anonymous"}!`);

</script>
```

The resulting document looks like this:

<img height="109" src="https://cloud.githubusercontent.com/assets/230541/25923377/12408d74-3592-11e7-9adc-eaa45e77e58a.gif">

## API Reference

### Runtimes

A runtime is responsible for evaluating [variables](#variables) in topological order whenever their input values change. A runtime typically has one or more [modules](#modules) to scope variables. Collectively, these variables represent a reactive program managed by the runtime.

<a href="#runtime" name="runtime">#</a> d3.<b>runtime</b>([<i>builtins</i>])

Returns a new [runtime](#runtimes). If a *builtins* object is specified, each property on the *builtins* object defines a builtin for the runtime; these builtins are available as named inputs to any [defined variables](#variable_define) on any [module](#modules) associated with this runtime. If *builtins* is not specified, the d3.express [standard library](#standard-library) is used.

For example, to create a runtime whose only builtin is `color`:

```js
var runtime = d3.runtime({color: "red"});
```

To refer to the `color` builtin from a variable:

```js
var module = runtime.module();

module.variable("#hello").define(["color"], color => `Hello, ${color}.`);
```

This would produce the following output:

> Hello, red.

Builtins must have constant values; unlike [variables](#variables), they cannot be defined as functions. However, a builtin *may* be defined as a promise, in which case any referencing variables will be evaluated only after the promise is resolved. Variables may not override builtins.

<a href="#runtime_module" name="runtime_module">#</a> <i>runtime</i>.<b>module</b>()

Returns a new [module](#modules) for this [runtime](#runtimes).

### Modules

A module is a namespace for [variables](#variables); within a module, variables should typically have unique names. [Imports](#variable_import) allow variables to be referenced across modules.

<a href="#module_variable" name="module_variable">#</a> <i>module</i>.<b>variable</b>([<i>element</i>])

Returns a new [variable](#variables) for this [module](#modules). The variable is initially undefined.

If *element* is specified, the value of this variable will be displayed in the specified DOM *element*. If *element* is specified as a string, the *element* is selected from the current document using [*document*.querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector). If the variable’s value is a DOM node, this node replaces the content of the specified *element*; if the variable’s current value is not a DOM node, the object inspector will automatically generate a suitable display for the current value.

A variable without an associated *element* is only computed if any transitive output of the variable has an *element*; variables are computed on an as-needed basis for display. This is particularly useful when the runtime has multiple modules (as with [imports](#variable_import)): only the needed variables from imported modules are computed.

<a href="#module_derive" name="module_derive">#</a> <i>module</i>.<b>derive</b>(<i>specifiers</i>, <i>source</i>)

Returns a derived copy of this [module](#modules), where each variable in *specifiers* is replaced by an [import](#variable_import) from the specified *source* module. The *specifiers* are specified as an array of objects with the following properties:

* *specifier*.name - the name of the variable to import from *source*.
* *specifier*.alias - the name of the variable to redefine in this module.

If *specifier*.alias is not specified, it defaults to *specifier*.name. A *specifier* may also be specified as a string, in which case the string is treated as both the name and the alias. For example, consider the following module which defines two constants *a* and *b*, and a variable *c* that represents their sum:

```js
var module0 = runtime.module();
module0.variable().define("a", 1);
module0.variable().define("b", 2);
module0.variable().define("c", ["a", "b"], (a, b) => a + b);
```

To derive a new module that redefines *b*:

```js
var module1 = runtime.module(),
    module1_0 = module0.derive(["b"], module1);
module1.variable().define("b", 3);
module1.variable().import("c", module1_0);
```

The value of *c* in the derived module is now 1 + 3 = 4, whereas the value of *c* in the original module remains 1 + 2 = 3.

### Variables

A variable defines a piece of state in a reactive program, akin to a cell in a spreadsheet. Variables may be named to allow the definition of derived variables: variables whose value is computed from other variables’ values. Variables are scoped by a [module](#modules) and evaluated by a [runtime](#runtimes).

<a href="#variable_define" name="variable_define">#</a> <i>variable</i>.<b>define</b>(\[<i>name</i>, \]\[<i>inputs</i>, \]<i>definition</i>)

Redefines this variable to have the specified *name*, taking the variables with the names specified in *inputs* as arguments to the specified *definition* function. If *name* is null or not specified, this variable is anonymous and may not be referred to by other variables. The named *inputs* refer to other variables (possibly [imported](#variable_import)) in this variable’s module. Circular inputs are not allowed; the variable will throw a ReferenceError upon evaluation. If *inputs* is not specified, it defaults to the empty array. If *definition* is not a function, the variable is defined to have the constant value of *definition*.

The *definition* function may return a promise; derived variables will be computed after the promise resolves. The *definition* function may likewise return a generator; the runtime will pull values from the generator on every animation frame, or if the generator yielded a promise, after the promise is resolved. When the *definition* is invoked, the value of `this` is the variable’s previous value, or undefined if this is the first time the variable is being computed under its current definition. Thus, the previous value is preserved only when input values change; it is *not* preserved if the variable is explicitly redefined.

For example, consider the following module that starts with a single undefined variable, *a*:

```js
var runtime = d3.runtime();

var module = runtime.module();

var a = module.variable("#a");
```

To define variable *a* with the name `foo` and the constant value 42:

```js
a.define("foo", 42);
```

This is equivalent to:

```js
a.define("foo", [], () => 42);
```

To define an anonymous variable *b* that takes `foo` as input:

```js
var b = module.variable("#b");

b.define(["foo"], foo => foo * 2);
```

This is equivalent to:

```js
b.define(null, ["foo"], foo => foo * 2);
```

Note that the JavaScript symbols in the above example code (*a* and *b*) have no relation to the variable names (`foo` and null); variable names can change when a variable is redefined or deleted. Each variable corresponds to a cell in a [d3.express](https://d3.express) notebook, but the cell can be redefined to have a different name or definition.

If more than one variable has the same *name* at the same time in the same module, these variables’ definitions are temporarily overridden to throw a ReferenceError. When and if the duplicate variables are [deleted](#variable_delete), or are redefined to have unique names, the original definition of the remaining variable (if any) is restored. For example, here variables *a* and *b* will throw a ReferenceError:

```js
var module = d3.runtime().module();
var a = module.variable("#a").define("foo", 1);
var b = module.variable("#b").define("foo", 2);
```

If *a* or *b* is redefined to have a different name, both *a* and *b* will subsequently resolve to their desired values:

```js
b.define("bar", 2);
```

Likewise deleting *a* or *b* would allow the other variable to resolve to its desired value.

<a href="#variable_import" name="variable_import">#</a> <i>variable</i>.<b>import</b>(<i>name</i>, [<i>alias</i>, ]<i>module</i>)

Redefines this variable as an alias of the variable with the specified *name* in the specified [*module*](#modules). The subsequent name of this variable is the specified *name*, or if specified, the given *alias*. The order of arguments corresponds to the standard import statement: `import {name as alias} from "module"`. For example, consider a module which defines a variable named `foo`:

```js
var runtime = d3.runtime();

var module0 = runtime.module();

module0.variable().define("foo", 42);
```

To import `foo` into another module:

```js
var module1 = runtime.module();

module1.variable().import("foo", module0);
```

Now the variable `foo` is available to other variables in module *b*:

```js
module1.variable("#hello").define(["foo"], foo => `Hello, ${foo}.`);
```

This would produce the following output:

> Hello, 42.

To import `foo` into under the alias `bar`:

```js
module1.variable().import("foo", "bar", module0);
```

<a href="#variable_delete" name="variable_delete">#</a> <i>variable</i>.<b>delete</b>()

Deletes this variable’s current definition and name, if any. Any variable in this module that references this variable as an input will subsequently throw a ReferenceError. If exactly one other variable defined this variable’s previous name, such that that variable throws a ReferenceError due to its duplicate definition, that variable’s original definition is restored.

## Standard Library

<a href="#runtimeLibrary" name="runtimeLibrary">#</a> d3.<b>runtimeLibrary</b>

The standard library object, defining the following properties:

* [DOM](#dom) - create HTML and SVG elements.
* [Files](#files) - read local files into memory.
* [Generators](#generators) - utilities for generators and iterators.
* [Promises](#promises) - utilities for promises.
* [require](#require) - load third-party libraries.

By default, [d3.runtime](#runtime) uses this standard library for builtins.

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
</select>`;
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
