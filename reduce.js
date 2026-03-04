[].reduce((accumulator, currentValue, currentIndex, array) => {}, 1);

Array.prototype.reduce = function (callback, initialValue) {
  if (callback === null) throw new TypeError("callback is null");
  if (typeof callback !== "function")
    throw new TypeError("callback is not a function");

  let hasInitialValue = initialValue !== null && initialValue !== undefined;
  let res = hasInitialValue ? initialValue : this[0];
  let startIndex = 0;

  // 如果没传递初始默认值，需要找到第一个元素，当作初始值
  if (!hasInitialValue) {
    res = this[0];
    hasInitialValue = true;
  }

  for (let i = 0; i < this.length; i++) {
    res = callback(res, this[i], i, this);
  }
  return res;
};
