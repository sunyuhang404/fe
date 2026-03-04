[1, 2, 3].map((item, index, array) => {
  return item + 1;
});

Array.prototype.map = function (callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    res = callback(this[i], i, this);
    result.push(res);
  }
  return result;
};
