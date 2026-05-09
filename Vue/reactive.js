import { effect, track, trigger } from "./index.js";

function reactive(obj) {
  return new Proxy(obj, {
    set(target, key, newVal, receiver) {
      // 先取旧值
      const oldVal = target[key];
      // 如果属性不存在，说明是添加新属性，否则是设置已有属性
      const type = Object.prototype.hasOwnProperty.call(target, key)
        ? "SET"
        : "ADD";

      // 设置属性值
      const res = Reflect.set(target, key, newVal, receiver);

      // receiver 是 target 的代理对象时，才更新
      if (target === receiver.raw) {
        // 对比新值和旧值，只有不一样得时候才触发响应（针对得场景是：重新赋值得时候，设置了与之前一样得值）
        // 并且需要排查 NaN 的情况
        if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
          // 把 type 当作参数，传递给 trigger 函数
          trigger(target, key, type);
        }
      }

      return res;
    },

    get(target, key, receiver) {
      // 代理对象可以通过 raw 属性访问原始数据
      if (key === "raw") {
        return target;
      }
      track(target, key);

      return Reflect.get(target, key, receiver);
    },

    // 可以拦截 'key' in obj
    has(target, key) {
      track(target, key);
      return Reflect.get(target, key);
    },

    deleteProperty(target, key) {
      // 检查被操作得属性是否是对象自己得属性
      const hasKey = Object.prototype.hasOwnProperty.call(target, key);

      // 删除属性
      const res = Reflect.deleteProperty(target, key);

      if (res && hadKey) {
        // 只有当被删除得属性是对象自己得属性并且删除成功得时候，才触发更新
        trigger(target, key, "DELETE");
        // delete操作会让属性减少，for...in 循环次数会受到影响，所以需要触发与 ITERATE_KEY 相关得副作用函数重新执行
      }
      return res;
    },
  });
}

function ref(val) {
  const wrapper = {
    value: val,
  };
  // 定义一个不可枚举的属性，值为true，标识这个对象是ref，不是普通对象
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
  });
  return reactive(wrapper);
}

function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[value];
    },
    set value(val) {
      obj[key] = val;
    },
  };
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
  });
  return wrapper;
}
function toRefs(obj) {
  const ret = {};

  for (const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret;
}

// 实例，当子对象上不存在属性的时候，会到父类中寻找，会调用原型上的 set 方法，这时候会触发两次副作用函数
const obj = {};
const proto = { bar: 1 };
const child = reactive(obj);
const parent = reactive(proto);

Object.setPrototypeOf(child, parent);
effect(() => {
  console.log("effect:", child.bar);
});

child.bar = 2;

export { reactive, ref };
