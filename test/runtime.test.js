const O = require("../");

test('duplicate declarations', (done) => {
    const runtime = O.runtime(),
        module = runtime.module();
    const elements = [
        document.createElement('div'),
        document.createElement('two'),
        document.createElement('three')
    ];
    module.variable(elements[0]).define("foo", 1);
    module.variable(elements[1]).define("foo", 2);
    module.variable(elements[2]).define(["foo"], foo => foo);
    requestAnimationFrame(() => {
        expect(elements).toMatchSnapshot();
        done();
    });
});

test('derived values', (done) => {
    const element = document.createElement('div');
    const runtime = O.runtime();
    const module0 = runtime.module();
    module0.variable().define("a", 1);
    module0.variable().define("b", 2);
    module0.variable().define("c", ["a", "b"], (a, b) => a + b);
    const module1 = runtime.module(),
        module1_0 = module0.derive([{name: "d", alias: "b"}], module1);
    module1.variable().define("d", 42);
    module1.variable(element).import("c", module1_0);
    requestAnimationFrame(() => {
        expect(element).toMatchSnapshot();
        done();
    });
});

test('builtins', (done) => {
    const elements = [
        document.createElement('div'),
        document.createElement('div')
    ];
    const runtime = O.runtime({color: "red"});
    const module = runtime.module();
    module.variable(elements[0]).define("color", () => { throw new Error("this shouldn’t happen"); });
    module.variable(elements[1]).define(["color"], color => `color = ${color}`);
    requestAnimationFrame(() => {
        expect(elements).toMatchSnapshot();
        done();
    });
});
