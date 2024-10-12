# @observablehq/runtime

The **Observable Runtime** implements reactivity in both [Observable Framework](https://observablehq.com/framework/) and [Observable notebooks](https://observablehq.com/documentation/notebooks/).

## API Reference

### Runtimes

#### new Runtime(*builtins*, *global*)

[Source](https://github.com/observablehq/runtime/blob/main/src/runtime.js) · Returns a new [runtime](#runtimes). If *builtins* is specified, each property on the *builtins* object defines a builtin variable for the runtime. These builtins are available as named inputs to any [defined variables](#variable_define) on any [module](#modules) associated with this runtime. If a *global* function is specified, it will be invoked with the name of any unresolved reference, and must return the corresponding value or undefined (to trigger a ReferenceError); if *global* is not specified, unresolved values will be resolved from the global window.

To specify a custom set of builtins:

```js
const runtime = new Runtime({color: "red"});
```

To refer to the `color` builtin from a variable:

```js
const module = runtime.module();
const inspector = new Inspector(document.querySelector("#hello"));
module.variable(inspector).define(["color"], color => `Hello, ${color}.`);
```

This would produce the following output:

> Hello, red.

Unlike [variables](#variables), builtins cannot depend on the value of other variables or builtins; they are defined with no inputs. If a builtin is defined as a function, it will be invoked lazily to determine the value of the builtin. If you wish for the value of a builtin to be a function, the builtin must be defined either as a promise that resolves to a function or as a function that returns a function. Builtins may also be defined as generators for dynamic values.

#### *runtime*.module(*define*, *observer*)

[Source](https://github.com/observablehq/runtime/blob/main/src/runtime.js) · Returns a new [module](#modules) for this [runtime](#runtimes).

If *define* is specified, it is a function which defines the new module’s [variables](#variables) by calling *runtime*.module (with no arguments) and then calling [*module*.variable](#module_variable) on the returned module as desired. If this runtime already has a module for the specified *define* function, the existing module is returned; otherwise, a new module is created, and the *define* function is called, being passed this runtime and the specified *observer* factory function. If *define* is not specified, a new module is created and returned.

If an *observer* factory function is specified, it is called for each named variable in the returned module, being passed the variable’s name.

#### *runtime*.dispose()

[Source](https://github.com/observablehq/runtime/blob/main/src/runtime.js) · Disposes this runtime, invalidating all active variables and disabling future computation.

### Modules

A module is a namespace for [variables](#variables); within a module, variables should typically have unique names. [Imports](#variable_import) allow variables to be referenced across modules.

#### *module*.variable(*observer*)

[Source](https://github.com/observablehq/runtime/blob/main/src/module.js) · Returns a new [variable](#variables) for this [module](#modules). The variable is initially undefined.

If *observer* is specified, the specified [observer](#observers) will be notified when the returned variable changes state, via the [observer.*pending*](#observer_pending), [observer.*fulfilled*](#observer_fulfilled) and [observer.*rejected*](#observer_rejected) methods. See the [standard inspector](https://github.com/observablehq/inspector/blob/master/README.md) for a convenient default observer implementation.

A variable without an associated *observer* is only computed if any transitive output of the variable has an *observer*; variables are computed on an as-needed basis for display. This is particularly useful when the runtime has multiple modules (as with [imports](#variable_import)): only the needed variables from imported modules are computed.

#### *module*.derive(*specifiers*, *source*)

[Source](https://github.com/observablehq/runtime/blob/main/src/module.js) · Returns a derived copy of this [module](#modules), where each variable in *specifiers* is replaced by an [import](#variable_import) from the specified *source* module. The *specifiers* are specified as an array of objects with the following properties:

* *specifier*.name - the name of the variable to import from *source*.
* *specifier*.alias - the name of the variable to redefine in this module.

If *specifier*.alias is not specified, it defaults to *specifier*.name. A *specifier* may also be specified as a string, in which case the string is treated as both the name and the alias. For example, consider the following module which defines two constants *a* and *b*, and a variable *c* that represents their sum:

```js
const module0 = runtime.module();
module0.variable().define("a", 1);
module0.variable().define("b", 2);
module0.variable().define("c", ["a", "b"], (a, b) => a + b);
```

To derive a new module that redefines *b*:

```js
const module1 = runtime.module();
const module1_0 = module0.derive(["b"], module1);
module1.variable().define("b", 3);
module1.variable().import("c", module1_0);
```

The value of *c* in the derived module is now 1 + 3 = 4, whereas the value of *c* in the original module remains 1 + 2 = 3.

#### *module*.define(*name*, *inputs*, *definition*)

[Source](https://github.com/observablehq/runtime/blob/main/src/module.js) · A convenience method for [*variable*.define](#variable_define); equivalent to:

```js
module.variable().define(name, inputs, definition)
```

#### *module*.import(*name*, *alias*, *from*)

[Source](https://github.com/observablehq/runtime/blob/main/src/module.js) · A convenience method for [*variable*.import](#variable_import); equivalent to:

```js
module.variable().import(name, alias, from)
```

#### *module*.builtin(*name*, *value*)

[Source](https://github.com/observablehq/runtime/blob/main/src/module.js) · Defines a built-in constant that is visible to all variables in this module. _Caution: any built-ins must be defined before variables are defined, and must not be redefined after._ For example, to define a `FileAttachment` function:

```js
module.builtin("FileAttachment", (name) => FileAttachment(name))
```

#### *module*.redefine(*name*, *inputs*, *definition*)

[Source](https://github.com/observablehq/runtime/blob/main/src/module.js) · Redefines the *variable* with the specified *name* on this module. If no such variable exists, or if more than one variable has the specified *name*, throws a runtime error.

#### *module*.value(*name*)

[Source](https://github.com/observablehq/runtime/blob/main/src/module.js) · Returns a promise to the next value of the *variable* with the specified *name* on this module. If no such variable exists, or if more than one variable has the specified *name*, throws a runtime error.

### Variables

A variable defines a piece of state in a reactive program, akin to a cell in a spreadsheet. Variables may be named to allow the definition of derived variables: variables whose value is computed from other variables’ values. Variables are scoped by a [module](#modules) and evaluated by a [runtime](#runtimes).

#### *variable*.define(*name*, *inputs*, *definition*)

[Source](https://github.com/observablehq/runtime/blob/main/src/variable.js) · Redefines this variable to have the specified *name*, taking the variables with the names specified in *inputs* as arguments to the specified *definition* function. If *name* is null or not specified, this variable is anonymous and may not be referred to by other variables. The named *inputs* refer to other variables (possibly [imported](#variable_import)) in this variable’s module. Circular inputs are not allowed; the variable will throw a ReferenceError upon evaluation. If *inputs* is not specified, it defaults to the empty array. If *definition* is not a function, the variable is defined to have the constant value of *definition*.

The *definition* function may return a promise; derived variables will be computed after the promise resolves. The *definition* function may likewise return a generator; the runtime will pull values from the generator on every animation frame, or if the generator yielded a promise, after the promise is resolved. When the *definition* is invoked, the value of `this` is the variable’s previous value, or undefined if this is the first time the variable is being computed under its current definition. Thus, the previous value is preserved only when input values change; it is *not* preserved if the variable is explicitly redefined.

For example, consider the following module that starts with a single undefined variable, *a*:

```js
const runtime = new Runtime(builtins);
const module = runtime.module();
const a = module.variable();
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
const b = module.variable();

b.define(["foo"], foo => foo * 2);
```

This is equivalent to:

```js
b.define(null, ["foo"], foo => foo * 2);
```

Note that the JavaScript symbols in the above example code (*a* and *b*) have no relation to the variable names (`foo` and null); variable names can change when a variable is redefined or deleted. Each variable corresponds to a cell in an Observable notebook, but the cell can be redefined to have a different name or definition.

If more than one variable has the same *name* at the same time in the same module, these variables’ definitions are temporarily overridden to throw a ReferenceError. When and if the duplicate variables are [deleted](#variable_delete), or are redefined to have unique names, the original definition of the remaining variable (if any) is restored. For example, here variables *a* and *b* will throw a ReferenceError:

```js
const module = new Runtime(builtins).module();
const a = module.variable().define("foo", 1);
const b = module.variable().define("foo", 2);
```

If *a* or *b* is redefined to have a different name, both *a* and *b* will subsequently resolve to their desired values:

```js
b.define("bar", 2);
```

Likewise deleting *a* or *b* would allow the other variable to resolve to its desired value.

#### *variable*.import(*name*, *alias*, *module*)

[Source](https://github.com/observablehq/runtime/blob/main/src/variable.js) · Redefines this variable as an alias of the variable with the specified *name* in the specified [*module*](#modules). The subsequent name of this variable is the specified *name*, or if specified, the given *alias*. The order of arguments corresponds to the standard import statement: `import {name as alias} from "module"`. For example, consider a module which defines a variable named `foo`:

```js
const runtime = new Runtime(builtins);
const module0 = runtime.module();
module0.variable().define("foo", 42);
```

To import `foo` into another module:

```js
const module1 = runtime.module();
module1.variable().import("foo", module0);
```

Now the variable `foo` is available to other variables in *module1*:

```js
module1.variable().define(["foo"], foo => `Hello, ${foo}.`);
```

This would produce the following output:

> Hello, 42.

To import `foo` into *module1* under the alias `bar`:

```js
module1.variable().import("foo", "bar", module0);
```

#### *variable*.delete()

[Source](https://github.com/observablehq/runtime/blob/main/src/variable.js) · Deletes this variable’s current definition and name, if any. Any variable in this module that references this variable as an input will subsequently throw a ReferenceError. If exactly one other variable defined this variable’s previous name, such that that variable throws a ReferenceError due to its duplicate definition, that variable’s original definition is restored.

### Observers

An observer watches a [variable](#variables), being notified via asynchronous callback whenever the variable changes state. See the [standard inspector](https://github.com/observablehq/inspector) for a reference implementation.

#### *observer*.pending()

Called shortly before the variable is computed. For a generator variable, this occurs before the generator is constructed, but not before each subsequent value is pulled from the generator.

#### *observer*.fulfilled(*value*)

Called shortly after the variable is fulfilled with a new *value*.

#### *observer*.rejected(*error*)

Called shortly after the variable is rejected with the given *error*.
