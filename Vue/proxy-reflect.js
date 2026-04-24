import { track, trigger, watch } from "./index.js";
const data = {
  foo: 1,
  get bar() {
    return this.foo;
  },
};

const obj = new Proxy(data, {
  get(target, key, receiver) {
    track(target, key);
    // 用Reflect.get 返回读取到的属性值
    return Reflect.get(target, key, receiver);
  },
  set(target, key, newVal) {
    target[key] = newVal;
    trigger(target, key);
    return true;
  },
});

// const fn = (name) => {
//   console.log("我是：", name);
// };

// const p2 = new Proxy(fn, {
//   // 使用 apply 拦截函数调用
//   apply(target, thisArg, argArray) {
//     target.call(thisArg, ...argArray);
//   },
// });

obj.foo++;
watch(
  () => obj.bar,
  (v1, v2) => {
    console.log(v1, v2);
  },
  {
    immediate: true,
  },
);
