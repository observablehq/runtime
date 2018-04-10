# @observablehq/notebook-runtime

[![CircleCI](https://circleci.com/gh/observablehq/notebook-runtime/tree/master.svg?style=svg&circle-token=765ad8079db8d24462864a9ed0ec5eab25404918)](https://circleci.com/gh/observablehq/notebook-runtime/tree/master)

This library implements the reactive runtime for Observable notebooks. It lets you publish your interactive notebooks wherever you want: on your website, integrated into your web application or interactive dashboard, *etc.* You can also use this library to author reactive programs by hand, to build new reactive editors, or simply to better understand how the Observable runtime works.

## API Reference

### Runtimes

A runtime is responsible for evaluating [variables](#variables) in topological order whenever their input values change. A runtime typically has one or more [modules](#modules) to scope variables. Collectively, these variables represent a reactive program managed by the runtime.

<a href="#runtime" name="runtime">#</a> O.<b>runtime</b>(<i>builtins</i>)

Returns a new [runtime](#runtimes). Each property on the *builtins* object defines a builtin for the runtime; these builtins are available as named inputs to any [defined variables](#variable_define) on any [module](#modules) associated with this runtime.

For example, to create a runtime whose only builtin is `color`:

```js
var runtime = O.runtime({color: "red"});
```

To refer to the `color` builtin from a variable:

```js
var module = runtime.module();

module.variable("#hello").define(["color"], color => `Hello, ${color}.`);
```

This would produce the following output:

> Hello, red.

Builtins must have constant values; unlike [variables](#variables), they cannot be defined as functions. However, a builtin *may* be defined as a promise, in which case any referencing variables will be evaluated only after the promise is resolved. Variables may not override builtins.

<a href="#standardRuntime" name="standardRuntime">#</a> O.<b>standardRuntime</b>()

Observable comes with a [standard library](https://github.com/observablehq/notebook-stdlib), which provides the built-in functions and objects for the notebook interface. To create a new runtime with the standard library as built-ins:

```js
var runtime = O.standardRuntime();
```

<a href="#runtime_module" name="runtime_module">#</a> <i>runtime</i>.<b>module</b>()

Returns a new [module](#modules) for this [runtime](#runtimes).

<a href="#runtime-define" name="runtime-define">#</a> <i>runtime</i>.<b>define</b>(cell, definition)

As a high level API, the [runtime](#runtimes) also

### Modules

A module is a namespace for [variables](#variables); within a module, variables should typically have unique names. [Imports](#variable_import) allow variables to be referenced across modules.

<a href="#module_variable" name="module_variable">#</a> <i>module</i>.<b>variable</b>([<i>element</i>])

Returns a new [variable](#variables) for this [module](#modules). The variable is initially undefined.

If *element* is specified, the value of this variable will be displayed in the specified DOM *element*. If *element* is specified as a string, the *element* is selected from the current document using [*document*.querySelector](https://developer.mozilla.org/docs/Web/API/Document/querySelector). If the variable’s value is a DOM node, this node replaces the content of the specified *element*; if the variable’s current value is not a DOM node, the object inspector will automatically generate a suitable display for the current value.

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
var runtime = O.runtime(builtins);

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

Note that the JavaScript symbols in the above example code (*a* and *b*) have no relation to the variable names (`foo` and null); variable names can change when a variable is redefined or deleted. Each variable corresponds to a cell in an Observable notebook, but the cell can be redefined to have a different name or definition.

If more than one variable has the same *name* at the same time in the same module, these variables’ definitions are temporarily overridden to throw a ReferenceError. When and if the duplicate variables are [deleted](#variable_delete), or are redefined to have unique names, the original definition of the remaining variable (if any) is restored. For example, here variables *a* and *b* will throw a ReferenceError:

```js
var module = O.runtime(builtins).module();
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
var runtime = O.runtime(builtins);

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
