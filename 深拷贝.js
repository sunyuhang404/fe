

const deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target;

  if (target instanceOf Date) return new Date(target);
  if (target instanceOf RegExp) return new RegExp(target);

  // 循环引用
  if (map.has(target)) return map.get(target);

  const cloneTarget = Array.isArray(target) ? [] : {};
  map.set(target, cloneTarget);

  // 递归拷贝子属性
  for (const key in target) {
    if (target.hasOwnProperty(key)) {
      cloneTarget[key] = deepClone(target[key], map);
  }
  return cloneTarget;
}