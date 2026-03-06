class Promise {
  static STATUS = {
    PENDING: "pending",
    FULFILLED: "fulfilled",
    REJECTED: "rejected",
  };
  constructor(executor) {
    this.value = undefined;
    this.reason = undefined;
    this.status = STATUS.PENDING;

    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.status === STATUS.PENDING) {
        this.status = STATUS.FULFILLED;
        this.value = value;
        this.onResolvedCallbacks.forEach((fn) => fn());
      }
    };

    const reject = (reason) => {
      if (this.status === STATUS.PENDING) {
        this.reason = reason;
        this.status = STATUS.REJECTED;
        this.onRejectedCallbacks.forEach((fn) => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== "function") {
      onFulfilled = (value) => value;
    }
    if (typeof onRejected !== "function") {
      onRejected = (reason) => throw reason;
    }
    return new Promise((resolve, reject) => {
      const handler = (callback, value, nextResolve, nextReject) => {
        queueMicrotask(() => {
          try {
            const result = callback(value);
            if (result instanceof Promise) {
              result.then(nextResolve, nextReject);
            } else {
              nextResolve(value);
            }
          } catch (error) {
            nextReject(error);
          }
        });
      };

      if (this.status === STATUS.FULFILLED) {
        handler(onFulfilled, this.value, resolve, reject);
      } else if (this.status === STATUS.REJECTED) {
        handler(onRejected, this.reason, resolve, reject);
      } else {
        this.onResolvedCallbacks.push(() =>
          handler(onFulfilled, this.value, resolve, reject),
        );
        this.onRejectedCallbacks.push(() =>
          handler(onRejected, this.reason, resolve, reject),
        );
      }
    });
  }

  static resolve(value) {
    if (value instanceof Promise) return value;
    return new Promise((resolve) => resolve(value));
  }

  static all(list) {
    if (list === null) {
      return;
    }
    if (!Array.isArray(list)) {
      return;
    }
    return new Promise((resolve, reject) => {
      if (list.length === 0) {
        resolve([]);
        return;
      }

      const result = new Array(list.length).fill(null);
      let resultCount = 0;

      for (let i = 0; i < list.length; i++) {
        Promise.resolve(list[i]).then(
          (res) => {
            result[i] = res;
            resultCount++;

            if (resultCount === list.length) {
              resolve(result);
            }
          },
          (err) => {
            reject(err);
          },
        );
      }
    });
  }
}
