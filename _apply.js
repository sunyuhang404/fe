Function.prototype._apply = function (context, args) {
  if (context === null || context === undefined) {
    context = window;
  } else {
    context = Object(context);
  }

  const fnKey = Symbol("fnKey");
  context[fnKey] = this;

  let result;

  if (!args) {
    result = context[fnKey]();
  } else {
    if (!Array.isArray(args)) {
      throw new TypeError("");
    }
    result = context[fnKey](...args);
  }
  delete context[fnKey];

  return result;
};
