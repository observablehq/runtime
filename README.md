# d3-express

## Installing

If you use NPM, `npm install d3-express`. Otherwise, download the [latest release](https://github.com/d3/d3-express/releases/latest). You can also load directly from [unpkg.com](https://unpkg.com/d3-express/). AMD, CommonJS, and vanilla environments are supported. In vanilla, a `d3` global is exported:

```html
<script src="https://unpkg.com/d3-express@0"></script>
<script>

var runtime = d3.runtime();

</script>
```

## API Reference

### Runtime

<a href="#runtime" name="runtime">#</a> d3.<b>runtime</b>([<i>builtins</i>])

…

<a href="#runtime_module" name="runtime_module">#</a> <i>runtime</i>.<b>module</b>()

…

### Module

<a href="#module_variable" name="module_variable">#</a> <i>module</i>.<b>variable</b>([<i>element</i>])

…

### Variable

<a href="#variable_define" name="variable_define">#</a> <i>variable</i>.<b>define</b>(<i>name</i>, <i>inputs</i>, <i>definition</i>)

…

<a href="#variable_delete" name="variable_delete">#</a> <i>variable</i>.<b>delete</b>()

…

<a href="#variable_import" name="variable_import">#</a> <i>variable</i>.<b>import</b>(<i>module</i>, <i>imports</i>)

…
