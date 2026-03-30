// 不适用let，每隔1000ms依次打印1 2 3
for (var i = 1; i <= 3; i++) {
  (function (index) {
    setTimeout(() => {
      console.log(index);
    }, 1000);
  })(i);
}
