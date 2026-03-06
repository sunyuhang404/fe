function run(gen) {
  const it = gen();

  function step(val) {
    const res = it.next(val);

    if (res.done) {
      return res.data;
    }
    Promise.resolve(res.value).then((v) => step(v));
  }

  step();
}

function* task() {
  yield new Promise((resolve) => setTimeout(() => resolve(1), 1000));
  yield new Promise((resolve) => setTimeout(() => resolve(2), 1000));
  yield new Promise((resolve) => setTimeout(() => resolve(3), 1000));
}

run(task);
