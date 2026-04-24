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

function traverse(value, seen = new Set()) {
  // 如果value是原始值，或者读取过了，什么都不做
  if (typeof value !== "object" || value === null || seen.has(value)) return;

  // 添加到 seen，标识已经读取过
  seen.add(value);

  // 暂时不管数组和其它结构了
  // 假设value是一个对象，遍历对象每一个值，递归调用traverse处理
  for (const k in value) {
    traverse(value[k], seen);
  }
  return value;
}

function watch(source, cb, options = {}) {
  // 第一个参数可以是一个 getter 函数
  let getter;

  // 如果 source是函数，说明传进来的直接就是一个 getter，直接赋值就行
  if (typeof source === "function") {
    getter = source;
  } else {
    // 如果不是函数，还是走老逻辑
    // 递归的读取，不用硬编码
    getter = () => traverse(source);
  }

  let oldValue, newValue;

  // 存储注册的过期回调
  let cleanup;

  function onInvalidate(fn) {
    cleanup = fn;
  }

  // 提取 scheduler 函数
  const job = () => {
    newValue = effectFn();

    // 调用回调之前，先调过期回调
    if (cleanup) {
      cleanup();
    }
    cb(newValue, oldValue, onInvalidate);
    oldValue = newValue;
  };

  // 注册副作用函数时，开启lazy，把返回值保存到 effectFn 中 方便后续手动执行
  const effectFn = effect(
    // 触发读取操作，从而建立联系
    () => getter(),
    {
      lazy: true,
      scheduler: () => {
        // 在微任务中执行
        if (options.flush === "post") {
          const p = Promise.resolve();
          p.then(job);
        } else {
          job();
        }
      },
    },
  );

  // 如果 immediate 是 true，直接执行一下 scheduler 触发回调
  if (options.immediate) {
    job();
  } else {
    // 手动执行副作用函数，得到旧值
    oldValue = effectFn();
  }
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

watch(
  () => obj.foo,
  async (newValue, oldValue, onInvalidate) => {
    let expired = false;

    onInvalidate(() => {
      expired = true;
      console.log("expired:", expired, Date.now());
    });

    setTimeout(() => {
      if (!expired) {
        console.log(expired, newValue, oldValue, Date.now());
      }
    }, 1000);
  },
  {
    immediate: true,
  },
);

obj.foo++;

setTimeout(() => {
  obj.foo++;
}, 200);
