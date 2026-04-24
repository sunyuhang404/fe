let activeEffect;

const effectStack = [];

// 每次收集之前，先把之前收集得依赖清空，因为每次变更之后有些依赖可能不再需要关注了
// 如果不清理，会产生遗留导致多次重复执行副作用函数
function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

function effect(fn, options = {}) {
  console.log("effect");
  const effectFn = () => {
    cleanup(effectFn);

    activeEffect = effectFn;
    // 入栈
    effectStack.push(effectFn);

    // 把执行结果存储起来
    const res = fn();

    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.options = options;
  effectFn.deps = [];

  // 非 lazy 的时候才执行
  if (!options.lazy) {
    effectFn();
  }
  // 把副作用函数当作返回值
  return effectFn;
}

const bucket = new WeakMap();

// 收集依赖的（只要触发了get，就执行）
function track(target, key) {
  if (!activeEffect) return;
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  const depsMap = bucket.get(target);

  if (!depsMap) return;
  const effects = depsMap.get(key);

  const effectsToRun = new Set();

  effects &&
    effects.forEach((effectFn) => {
      // 如果 trigger 触发执行得副作用函数与当前正在执行得副作用函数相同，就不要触发执行了
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });
  effectsToRun.forEach((effectFn) => {
    // 如果一个副作用函数存在调度器，就调用这个调度器，并且把副作用函数传过去
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}

const jobQueue = new Set();
const p = Promise.resolve();

// 标识是否正在刷新队列
let isFlushing = false;
function flushJob() {
  // 如果正在刷新队列，什么也不做
  if (isFlushing) return;

  isFlushing = true;

  // 在微任务队列中刷新 jobQueue 队列
  p.then(() => {
    jobQueue.forEach((job) => job());
  }).finally(() => {
    // 结束后重置刷新状态
    isFlushing = false;
  });
}

function computed(getter) {
  // 缓存计算属性上次的值
  let value;

  // 用来标识是否需要重新计算，如果是true，说明需要重新计算了
  let dirty = true;
  // 把 getter 当作副作用函数，创建一个 lazy 的 effect
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        // 调度器中重置 dirty 状态
        dirty = true;

        // 当计算属性依赖的响应式数据改变时，手动执行 trigger 函数触发响应
        trigger(obj, "value");
      }
    },
  });
  const obj = {
    // 读取 value 的时候才执行 effectFn
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      // 当读取 value 的时候，手动执行 track 函数进行追踪
      track(obj, "value");
      return value;
    },
  };

  return obj;
}

const data = {
  foo: 1,
  bar: 2,
};

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key);
    return target[key];
  },
  set(target, key, newVal) {
    target[key] = newVal;
    trigger(target, key);
    return true;
  },
});

const sumRes = computed(() => obj.foo + obj.bar);
// console.log(sumRes.value);
// console.log(sumRes.value);
// obj.foo++;
// console.log(sumRes.value);
// console.log(sumRes.value);

effect(() => {
  console.log("111", sumRes.value);
});
obj.foo++;
