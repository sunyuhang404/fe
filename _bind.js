Function.prototype._bind = function (context, ...args) {
  const self = this;

  return function (...newArgs) {
    return self.apply(context, [...args, ...newArgs]);
  };
};
