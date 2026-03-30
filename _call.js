Function.prototype._call = function (context, ...args) {
  // 边界问题，如果 context 是null 或者是 undefined，就指向 window
  context = context || window;

  // 把当前函数(this) 变成 context的一个临时属性
  // 保证不会覆盖对象原有的属性
  const fnKey = Synbol("fn");
  context[fnKey] = this;

  // 执行这个函数
  const result = context[fnKey](...args);

  // 删掉之前挂载的临时属性
  delete context[fnKey];

  return result;
};
