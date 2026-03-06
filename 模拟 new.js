
function new(constructor, ...args) {

  // 创建一个空对象，并把原型链接到 constructor.prototype 上
  const obj = Object.create(constructor.prototype);

  const result = constructor.apply(obj, args);

  // 判断 如果构造函数返回的是一个对象（不是null）或者是函数，就直接返回
  const isObject = typeof result === 'object' && result !== null;

  const isFunction = typeof result === 'function';

  // 如果是引用类型，就返回构造函数的返回值，否则返回创建的对象
  return (isObject || isFunction) ? result : obj;
}