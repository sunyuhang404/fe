[1, 2, 3].forEach((item, index, array) => {});

Array.prototype.forEach = function (callback) {
  for (let i = 0; i < this.length; i++) {
    callback(this[i], i, this);
  }
};
