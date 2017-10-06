const O = require("../");
const inspect = require("../src/inspect").default;

test('inspect', () => {
    const consistentError = new Error('hi');
    consistentError.stack = '';
    expect(inspect(true)).toMatchSnapshot();
    expect(inspect([1])).toMatchSnapshot();
    expect(inspect([1, 2, 3], false, true)).toMatchSnapshot();
    expect(inspect('string')).toMatchSnapshot();
    expect(inspect(() => {})).toMatchSnapshot();
    expect(inspect(function a() {})).toMatchSnapshot();
    expect(inspect(function* a() {})).toMatchSnapshot();
    expect(inspect(async function a() {})).toMatchSnapshot();
    expect(inspect(async () => {})).toMatchSnapshot();
    expect(inspect(new Date('2000/1/1'))).toMatchSnapshot();
    expect(inspect(new Date('2:42:2 2000/1/1'))).toMatchSnapshot();
    expect(inspect(/a/g)).toMatchSnapshot();
    expect(inspect({[Symbol('hi')]:true})).toMatchSnapshot();
    expect(inspect({a:1,b:2}, true)).toMatchSnapshot();
    expect(inspect({a:1,b:2}, false, true)).toMatchSnapshot();
    expect(inspect(Symbol('hi'))).toMatchSnapshot();
    expect(inspect(consistentError)).toMatchSnapshot();
    expect(inspect(null)).toMatchSnapshot();
});
