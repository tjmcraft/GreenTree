var NoopUpdateQueue = {

  isMounted: function (publicInstance) {
    return false;
  },

  enqueueForceUpdate: function (publicInstance, callback, callerName) {
    console.debug(publicInstance, 'forceUpdate');
  },

  enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
    console.debug(publicInstance, 'replaceState');
  },

  enqueueSetState: function (publicInstance, partialState, callback, callerName) {
    console.debug(publicInstance, 'setState');
  }
};

var emptyObject = {};

{
  Object.freeze(emptyObject);
}

function AbstractElement(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || NoopUpdateQueue;
  this.state = {};
}

AbstractElement.prototype.isGreenComponent = {};

AbstractElement.prototype.setState = function (partialState, callback) {
  if (!(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null)) {
    {
      throw Error( "setState(...): takes an object of state variables to update or a function which returns an object of state variables." );
    }
  }
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

AbstractElement.prototype.componentDidMount = function () { };
AbstractElement.prototype.componentDidUpdate = function () { };
AbstractElement.prototype.componentWillUnmount = function () { };

function shouldConstruct$1(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isGreenComponent);
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}

const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

var classComponentUpdater = {
  isMounted: false,
  enqueueSetState: function (inst, payload, callback) {
    const fiber = inst._gtrInternal;
    //console.warn(">> set state", payload);
    //console.debug(">> fiber class", fiber);
    wipRoot = {
      type: fiber.type,
      stateNode: fiber.stateNode,
      parent: fiber.parent,
      //dom: fiber.dom,
      props: fiber.props,
      alternate: fiber,
      pendingState: payload,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  },
  enqueueReplaceState: function (inst, payload, callback) {

  },
  enqueueForceUpdate: function (inst, callback) {

  }
};

function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  //console.log("[commitWork]", fiber);

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  switch (fiber.effectTag) {
    case "PLACEMENT":
      {
        const instance = fiber.dom;
        if (instance) {
          domParent.appendChild(fiber.dom)
        }
        if (fiber.stateNode) {
          if (typeof fiber.stateNode.componentDidMount === "function") {
            fiber.stateNode.componentDidMount();
          }
        }
      }; break;
    case "UPDATE":
      {
        const instance = fiber.dom;
        const oldProps = fiber.alternate.props;
        const newProps = fiber.props;
        if (instance) {
          updateDom(instance, oldProps, newProps);
        }
        if (fiber.parent && fiber.parent.stateNode) {
          if (typeof fiber.parent.stateNode.componentDidUpdate === "function") {
            fiber.parent.stateNode.componentDidUpdate(oldProps);
          }
        }
      }; break;
    case "DELETION":
      {
        commitDeletion(fiber, domParent);
        if (fiber.stateNode) {
          if (typeof fiber.stateNode.componentWillUnmount === "function") {
            fiber.stateNode.componentWillUnmount();
          }
        }
      }; break;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
  deletions = []
  nextUnitOfWork = wipRoot;
  window._gtrInternal = wipRoot;
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  //console.debug(">>>", "{1}", "[performUnitOfWork]", fiber)
  const isFunctionComponent =
    fiber.type instanceof Function
  if (isFunctionComponent) {
    if (shouldConstruct$1(fiber.type)) {
      updateClassComponent(fiber);
    } else {
      updateFunctionComponent(fiber);
    }
  } else {
    updateHostComponent(fiber)
  }
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

let wipFiber = null
let hookIndex = null

function updateClassComponent(fiber) {
  //console.debug(">>", "{2}", "[updateClassComponent]", fiber);
  fiber.tag = 1;
  wipFiber = fiber
  if (!fiber.stateNode) {
    fiber.stateNode = new fiber.type(fiber.props);
    fiber.stateNode.updater = classComponentUpdater;
    fiber.pendingState = fiber.stateNode.state;
  }
  fiber.stateNode.state = fiber.pendingState;
  const children = fiber.stateNode.render();
  reconcileChildren(fiber, [children]);
}

function updateFunctionComponent(fiber) {
  //console.debug(">>", "{2}", "[updateFunctionComponent]", fiber);
  fiber.tag = 0;
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = fiber.type(fiber.props)
  reconcileChildren(fiber, [children])
}

function updateHostComponent(fiber) {
  //console.debug(">>", "{2}", "[updateHostComponent]", fiber);
  fiber.tag = 5;
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

function reconcileChildren(wipFiber, elements) {

  //console.debug(">", "{3}", "[reconcileChildren]", wipFiber, elements);

  let index = 0;
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null

    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    //console.debug('[reconcile]', wipFiber.tag, wipFiber);

    if (wipFiber.stateNode) {
      wipFiber.stateNode._gtrInternal = wipFiber;
    }

    prevSibling = newFiber
    index++
  }
}

const Didact = {
  AbstractElement,
  createElement,
  render,
  useState,
}