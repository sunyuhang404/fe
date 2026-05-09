const { ref, effect } = VueReactivity;

function createRenderer(options) {
  const { createElement, insert, setElementText } = options;

  function mountElement(vnode, container) {
    vnode.el = createElement(vnode.type);
    const el = vnode.el;

    if (typeof vnode.children === "string") {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child, el);
      });
    }
    if (vnode.props) {
      for (const key in vnode.props) {
        if (key in el) {
          // 获取 DOM Properties 的类型
          const type = typeof el[key];
          const value = vnode.props[key];

          if (type === "boolean" && value === "") {
            el[key] = true;
          } else {
            el[key] = value;
          }
        } else {
          el.setAttribute(key, vnode.props[key]);
        }
      }
    }
    insert(el, container);
  }

  function unmount(vnode) {
    const parent = vnode.el.parentNode;

    if (parent) {
      parent.removeChild(vnode.el);
    }
  }

  function patch(n1, n2, container) {
    if (n1 && n1.type !== n2.type) {
      // 旧的节点存在，但是新旧节点的type不一致，需要整体替换了
      // type 都不一致，没有必要继续对比里面改了什么内容了
      unmount(n1);
      // 重置为 null，保证后续挂载操作正确执行
      n1 = null;
    }

    // 到这里，说明 n1 和 n2 描述的内容相同
    const { type } = n2;

    if (typeof type === "string") {
      if (!n1) {
        mountElement(n2, container);
      } else {
        // 更新
        patchElement(n1, n2);
      }
    } else if (typeof type === "object") {
      // 如果 n2 类型是对象了，说明它是个组件
    } else if (type === "xxx") {
      // 处理其它类型
    }
  }

  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else {
      if (container._vnode) {
        // 卸载 vnode
        unmount(container._vnode);
      }
    }
    container._vnode = vnode;
  }

  function bydrate(vnode, container) {}

  return {
    render,
    bydrate,
  };
}
const renderer = createRenderer({
  createElement(tag) {
    return document.createElement(tag);
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },
});

const count = ref("a");

const node = {
  type: "div",
  props: {
    id: "foo",
  },
  children: [
    {
      type: "p",
      children: "hello",
    },
  ],
};

effect(() => {
  renderer.render(node, document.getElementById("app"));
});

count.value = "b";
