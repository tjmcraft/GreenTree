/**
 * GreenTree.js Library (SE Edition) | DEV Ready | No Debug
 *
 * Copyright (c) TJMC-Company, Inc. and its affiliates. All Rights Reserved.
 *
 * Created for TJMC-Company, Inc. by MakAndJo
 */

 'use strict';
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
      (global = global || self, factory(global.GreenTree = {}));
}(this, (function (exports) {

  var now = () => new Date().getTime();
  var initialTime = now();

  const GREEN_ELEMENT_TYPE = Symbol('green.leaf');
  const GREEN_TREE_TYPE = Symbol('green.tree');
  const RESERVED_PROPS = { children: true, ref: true, unsafeHTML: true, ns: true };

  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;
  const COMMENT_NODE = 8;
  const DOCUMENT_NODE = 9;

  const LegacyRoot = 1;

  const FunctionComponent = 0;
  const ClassComponent = 1;
  const HostRoot = 3;
  const HostComponent = 5;
  const HostText = 6;

  var NoFlags = 0;
  var PerformedWork = 1;
  var Placement = 2;
  var Update = 4;
  var PlacementAndUpdate = 6;
  var Deletion = 8;

  var nextUnitOfWork = null;
  var currentRoot = null;
  var deletions = null;

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

  // == GREEN ELEMENTS == //

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
        throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
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

  function hasValidRef(config) {
    {
      if (Object.hasOwnProperty.call(config, 'ref')) {
        var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;

        if (getter && getter.isGreenWarning) {
          return false;
        }
      }
    }

    return config.ref !== undefined;
  }

  var GreenElement = function (type, key, ref, self, props) {
    let element = Object.seal({
      $$typeof: GREEN_ELEMENT_TYPE,
      type: type,
      key: key,
      ref: ref,
      props: props,
    });
    return element;
  }

  function createElement(type, attributes, children) {
    var propName;

    var props = {};
    var key = null;
    var ref = null;
    var self = null;

    if (attributes != null) {
      if (hasValidRef(attributes)) {
        ref = attributes.ref;
      }
      for (propName in attributes) {
        if (attributes.hasOwnProperty(propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
          props[propName] = attributes[propName];
        }
      }
    }

    var childrenLength = arguments.length - 2;

    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      var childArray = Array(childrenLength);
      for (var i = 0; i < childArray.length; i++) {
        childArray[i] = arguments[i + 2];
      }
      {
        Object.freeze && Object.freeze(childArray);
      }
      props.children = childArray;
    }

    return GreenElement(type, key, ref, self, props);
  }

  // == DOM OPERATIONS == //

  /**
   * Create dom based on fiber tag and props
   * @param {LeafNode} fiber
   * @returns
   */
  function createDom(fiber) {
    let dom;
    if (fiber.tag == HostText) {
      dom = document.createTextNode(fiber.pendingProps);
    } else {
      dom = document.createElement(fiber.type);
      updateDom(dom, {}, fiber.pendingProps);
    }
    return dom;
  }

  const isProperty = key => key !== "children" && !RESERVED_PROPS.hasOwnProperty(key);
  const isNew = (prev, next) => key => prev[key] !== next[key];
  const isGone = (next) => key => !(key in next);

  /**
   * Update dom element properties
   * @param {Node} element - element node instance (dom)
   * @param {object} prevProps - previous props
   * @param {object} nextProps - current props
   */
  function updateDom(element, prevProps, nextProps) {
    if (!prevProps) {
      prevProps = {};
    }

    // Remove old properties
    Object.keys(prevProps)
      .filter(isProperty)
      .filter(isGone(nextProps))
      .forEach(name => {
        element[name] = null
      })

    // Set new or changed properties
    Object.keys(nextProps)
      .filter(isProperty)
      .filter(isNew(prevProps, nextProps))
      .forEach(prop => {
        let value = nextProps[prop];
        if (element instanceof Text) {
          element[prop] = value;
        } else if (element instanceof Node) {
          if (value instanceof Object) {
            if (value instanceof Array) // if array
              element.setAttribute(prop, value.filter(e => e).join(' '));
            else if (typeof value === 'function' && value != null) // if function
              element[prop] = value;
            else Object.assign(element[prop], value);
          } else {
            if (value === true) // if simple true
              element.setAttribute(prop, prop);
            else if (typeof value === 'string' && value != null) // if string
              element.setAttribute(prop, value);
            else if (value !== false && value != null) // something else
              element.setAttribute(prop, value.toString());
          }
        }
      })
  }

  // == COMMIT DOM == //

  function commitRoot(root) {
    if (root) {
      //console.group(">>", "commitRoot", "<<");
      //console.debug(">>", "commit", root)
      deletions.forEach(commitWork);
      commitWork(root.child);
      currentRoot = root;
      // console.warn(">> commit");
      //console.groupEnd();
    }
  }

  /**
   * Commit work on fiber leaf
   * @param {LeafNode} - fiber root node to commit on
   */
  function commitWork(fiber) {
    if (!fiber) return;
    //console.group(">> commit <<");

    // TODO: Commit recuresevly (upper)
    commitWork(fiber.child); // go down


    //console.log("[commitWork]", fiber);

    // find the stateNode under parent of parent of parent
    let domParentFiber = fiber.parent;
    while (!domParentFiber.stateNode || domParentFiber.tag == ClassComponent) {
      domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber.stateNode;

    // receive commit flags
    var primaryFlags = fiber.flags & (Placement | Update | Deletion);

    switch (primaryFlags) {
      case Placement:
        {
          commitPlacement(fiber, domParent);
        }; break;
      case Update:
        {
          commitUpdate(fiber);
        }; break;
      case Deletion:
        {
          if (fiber.tag == ClassComponent) {
            if (typeof fiber.stateNode.componentWillUnmount === "function") {
              fiber.stateNode.componentWillUnmount();
              if (typeof fiber._mountCallback === "function") {
                fiber._mountCallback();
              }
            }
          } else {
            commitDeletion(fiber, domParent);
          }
        }; break;
    }

    fiber.memoizedProps = fiber.pendingProps;

    commitWork(fiber.sibling); // go side

    //console.groupEnd();
    fiber.flags = NoFlags; // Reset leaf update flags
    return fiber;
  }

  /**
   * Commit dom updating mutations on leaf
   * @param {LeafNode} fiber - leaf node
   */
  function commitUpdate(fiber) {
    const instance = fiber.stateNode;
    const oldProps = fiber.memoizedProps;
    const newProps = fiber.pendingProps;
    // console.debug(">>", "commitUpdate", Object.freeze({ instance, oldProps, newProps, fiber: { ...fiber } }), fiber);
    if (fiber.tag != ClassComponent) {
      if (instance) {
        if (fiber.tag == HostText) {
          updateDom(instance, {
            nodeValue: oldProps
          }, {
            nodeValue: newProps
          });
        } else {
          updateDom(instance, oldProps, newProps);
        }
      }
    }
    // TODO: Implement componentDidUpdate on state Component
    if (fiber.parent && fiber.parent.tag == ClassComponent) {
      if (typeof fiber.parent.stateNode.componentDidUpdate === "function") {
        fiber.parent.stateNode.componentDidUpdate(oldProps);
      }
    }
  }

  /**
   * Commit dom placement mutations on leaf
   * @param {LeafNode} fiber - leaf node
   * @param {Node} domParent - dom parent
   */
  function commitPlacement(fiber, domParent) {
    if (fiber.tag != ClassComponent) {
      const instance = fiber.stateNode;
      if (instance) {
        domParent.appendChild(instance);
        if (fiber.ref) fiber.ref.current = instance;
      }
    } else {
      if (typeof fiber.stateNode.componentDidMount === "function") {
        fiber._mountCallback = fiber.stateNode.componentDidMount();
      }
    }
  }

  /**
   *
   * @param {LeafNode} fiber - leaf node
   * @param {Node} domParent - dom parent
   */
  function commitDeletion(fiber, domParent) {
    if (fiber.stateNode && fiber.tag != ClassComponent) {
      domParent.removeChild(fiber.stateNode);
    } else {
      commitDeletion(fiber.child, domParent)
    }
  }

  // == LEAF NODE == //

  /**
   * LeafNode instance
   * @param {number|null} tag
   * @param {object|string|null} pendingProps
   * @param {number|null} key
   */
  function LeafNode(tag, pendingProps, key) {
    this.$$typeof = GREEN_TREE_TYPE;
    // Instance
    this.tag = tag; // GTR Leaf tag
    this.key = key; // GTR Key
    this.flags = NoFlags;
    //this.elementType = null; // Element type (div, span, function, component)
    this.type = null; // Element type (div, span, function, component)
    this.stateNode = null; // HTML Element node or component class
    // Fiber
    this.child = null; // GTR Child node (down)
    this.sibling = null; // GTR Sibling node (side)
    this.parent = null; // GTR Parent node (up)
    this.index = 0; // Index of current node
    this.ref = null; // GTR Reference
    //this.props = pendingProps;
    this.pendingProps = pendingProps; // Pending props
    this.memoizedProps = null; // Current props
    this.memoizedState = null; // Current state
    //this.updateQueue = null; // GTR Update queue
    // Effects
    this.alternate = null; // GTR previous node
    if (tag == FunctionComponent) { // only for function component
      this.hooks = []; // GTR hooks
    }
  }

  const createLeaf = function(tag, pendingProps, key) {
    return new LeafNode(tag, pendingProps, key);
  };

  // == LEAF ROOT == //

  function getPublicRootInstance(container) {
      //console.debug("[getPublicRootInstance]", container);
      var containerFiber = container.current;

      if (!containerFiber.child) {
          return null;
      }

      return containerFiber.child.stateNode;
  }

  /**
   * LeafRootNode instance
   * @param {Node} container - root container node (domElement)
   * @param {number} tag - Leaf tag
   */
  function LeafRootNode(container, tag) {
    this.tag = tag;
    this.container = container;
    this.current = null;
  }

  function createLeafRoot(container, tag) {
    var root = new LeafRootNode(container, tag); // LeafRootNode
    var uninitializedLeaf = createHostRootLeaf(tag); // LeafNode
    uninitializedLeaf.alternate = uninitializedLeaf;
    uninitializedLeaf.stateNode = container;
    root.current = uninitializedLeaf;
    return root;
  }

  function createHostRootLeaf(tag) {
    return createLeaf(HostRoot, null, null);
  }

  function createRootNode(container, tag) {
    var root = createLeafRoot(container, tag);
    return root;
  }

  function DOMBlockingRoot(container, tag, options) {
      this._internalRoot = createRootNode(container, tag, options);
  }

  function createRoot(container, options) {
      return new DOMBlockingRoot(container, LegacyRoot, options);
  }

  function createRootContainer(container) {
      var rootSibling;
      var warned = false;
      while (rootSibling = container.lastChild) {
          if (!warned && rootSibling.nodeType === DOCUMENT_NODE) {
              console.warn('Root container is not empty!');
              warned = true;
          }
          container.removeChild(rootSibling);
      }
      return createRoot(container);
  }

  // == ROOT RENDER == //

  function updateContainer(element, container, parentComponent, callback) {
    const current = container.current;
    current.pendingProps = {
      children: element
    };
    deletions = [];
    workLoopSync(current);
  }

  function legacyRender(parent, children, container, callback) {
    var root = container._greentreeRootContainer;
    var fiberRoot;
    if (!root) { // First time initial mount
      root = container._greentreeRootContainer = createRootContainer(container);
    }
    fiberRoot = root._internalRoot;
    updateContainer(children, fiberRoot, parent, callback);
    return getPublicRootInstance(fiberRoot);
  }

  function isValidContainer(node) {
    return !!(node && (node.nodeType == ELEMENT_NODE || node.nodeType == DOCUMENT_NODE));
  }

  function render(element, container, callback) {
    if (!isValidContainer(container)) {
      throw Error("Target container is not a DOM element.");
    }
    return legacyRender(null, element, container, callback);
  }

  // == WORK LOOP == //

  function workLoopSync(unit) {
    nextUnitOfWork = unit;
    let firstRoot = nextUnitOfWork;
    while (nextUnitOfWork != null) {
      preformWorkOnUnit(nextUnitOfWork);
    }
    commitRoot(firstRoot);
  }

  function preformWorkOnUnit(fiber) {

    var next;
    // console.debug("{0}", "[performUnitOfWork]", { ...fiber });
    next = beginWork(fiber);

    if (next === null) {
      completeUnitOfWork(fiber);
    } else {
      nextUnitOfWork = next;
    }
  }

  function beginWork(fiber) {
    if (fiber.type instanceof Function) {
      if (shouldConstruct$1(fiber.type)) {
        return updateClassComponent(fiber);
      } else {
        return updateFunctionComponent(fiber);
      }
    } else if (typeof fiber === 'object') {
      return updateHostComponent(fiber);
    }
  }

  // complete fiber on parent sibling
  function completeUnitOfWork(fiber) {
    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return preformWorkOnUnit(nextFiber.sibling);
      }
      nextFiber = nextFiber.parent;
    }
    nextUnitOfWork = null;
  }

  // == UPDATER == //

  var classComponentUpdater = {
    isMounted: false,
    enqueueSetState: function (inst, payload, callback) {
      const fiber = inst._gtrInternal;
      //console.warn(">>C", "set state", payload);
      inst.state = payload;
      //const current = createWorkInProgress(fiber, inst.props);
      //current.alternate = fiber;
      const current = Object.assign(createLeaf(), fiber, { alternate: fiber, sibling: null });
      // console.debug(">>C current", current);
      deletions = [];
      workLoopSync(current);
    },
    enqueueReplaceState: function (inst, payload, callback) {

    },
    enqueueForceUpdate: function (inst, callback) {

    }
  };

  var wipFiber = null
  var hookIndex = null

  function useEffect(callback, deps) {

    if (wipFiber.tag != FunctionComponent) {
      console.error("Cannot use hooks outside of a function component!");
      return;
    }

    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex];

    const hook = {
      deps: oldHook ? oldHook.deps : undefined,
    }

    const hasNoDeps = !deps;
    const hasChangedDeps = hook.deps ? !deps.every((el, i) => el === hook.deps[i]) : true

    //console.debug("[useEffect]", hook, hasNoDeps, hasChangedDeps);

    if (hasNoDeps || hasChangedDeps) {
      callback();
      hook.deps = deps;
    }

    wipFiber.hooks.push(hook);
    hookIndex++;
  }

  function useState(initial) {

    if (wipFiber.tag != FunctionComponent) {
      console.error("Cannot use hooks outside of a function component!");
      return;
    }

    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex];

    const hook = {
      state: oldHook ? oldHook.state : initial,
      queue: [],
    }

    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
      if (typeof action === 'function') {
        hook.state = action(hook.state)
      } else {
        hook.state = action;
      }
    })

    const setState = (action) => {
      const fiber = wipFiber;
      hook.queue.push(action);
      //console.debug(">>U", "setState", fiber);
      const current = Object.assign(createLeaf(), fiber, { alternate: fiber, sibling: null });
      deletions = [];
      workLoopSync(current);
    }

    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
  }

  // == MUTATORS == //

  function arePropsShallowEqual(currentProps, newProps) {

    if (!currentProps || !newProps) {
      return false;
    }

    if (currentProps === newProps) {
      return true;
    }

    const currentKeys = Object.keys(currentProps);
    const currentKeysLength = currentKeys.length;
    const newKeysLength = Object.keys(newProps).length;

    if (currentKeysLength !== newKeysLength) {
      return false;
    }

    if (currentKeysLength === 0) {
      return true;
    }

    for (let i = 0; i < currentKeysLength; i++) {
      const prop = currentKeys[i];
      if (currentProps[prop] !== newProps[prop]) {
        return false;
      }
    }

    return true;
  }

  function updateClassComponent(fiber) {
    //console.debug(">>", "{2}", "[updateClassComponent]", fiber);
    fiber.tag = ClassComponent;
    if (!fiber.stateNode) {
      fiber.stateNode = new fiber.type(fiber.pendingProps);
      fiber.stateNode.updater = classComponentUpdater;
    }
    if (arePropsShallowEqual(fiber.memoizedState, fiber.stateNode.state)) {
      reconcileChildren(fiber, fiber.static);
    } else {
      fiber.stateNode.props = fiber.pendingProps;
      const children = fiber.stateNode.create(fiber.stateNode.props);
      reconcileChildren(fiber, children);
      fiber.static = children;
      fiber.memoizedState = fiber.stateNode.state;
    }
    return fiber.child;
  }

  function updateFunctionComponent(fiber) {
    //console.debug(">>", "{2}", "[updateFunctionComponent]", fiber);
    fiber.tag = FunctionComponent;
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    const children = fiber.type(fiber.pendingProps);
    reconcileChildren(fiber, children);
    return fiber.child;
  }

  function updateHostComponent(fiber) {
    if (!fiber.stateNode) {
      // console.debug("{2}", "[updateHostComponent]", "create", { ...fiber });
      fiber.stateNode = createDom(fiber);
    } else {
      //console.debug("{2}", "[updateHostComponent]", "update", { ...fiber });
    }
    reconcileChildren(fiber);
    return fiber.child;
  }

  function createFiberUpdate(fiber, update) { // unused
    let alternateChildFiber = fiber.alternate && fiber.alternate.child;

    return Object.assign(createLeaf(), alternateChildFiber, {
      ref: update.ref,
      pendingProps: update.props,
      parent: fiber,
      alternate: alternateChildFiber,
      flags: Update,
    })

  }

  // == RECONCILER == //

  // var rcc = 0;

  function reconcileChildren(wipFiber, elements = null) {

    if (!elements) {
      let props = wipFiber.pendingProps;
      if (props && props.children) {
        elements = props.children;
      }
    }

    if (!Array.isArray(elements)) {
      elements = elements != null ? [elements] : [];
    }


    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;

    // console.debug(`{${rcc}}`, "{3}", "[reconcileChildren]", ">>", { ...wipFiber }, { ...oldFiber }, elements);
    // rcc++;

    while (
      index < elements.length ||
      oldFiber != null
    ) {
      const element = elements[index]; // green leaf child
      let newFiber = null;

      if (typeof element === 'object') {
        const sameType =
          oldFiber &&
          element &&
          element.type == oldFiber.type;

        if (sameType) {
          newFiber = Object.assign(createLeaf(), oldFiber, {
            ref: element.ref,
            pendingProps: element.props,
            parent: wipFiber,
            alternate: oldFiber,
            flags: Update,
            index: index,
            sibling: null
          });
        }

        if (element && !sameType) {
          const leaf = new LeafNode(HostComponent, null, null);
          leaf.ref = element.ref;
          leaf.type = element.type;
          leaf.pendingProps = element.props;
          leaf.parent = wipFiber;
          leaf.flags = Placement;
          leaf.index = index;
          newFiber = leaf;
        }

        if (oldFiber && !sameType) {
          oldFiber.flags = Deletion;
          deletions.push(oldFiber);
        }

      } else if (typeof element === "string") {

        const sameType =
          oldFiber &&
          element &&
          oldFiber.tag == HostText;

        if (sameType) {
          newFiber = Object.assign(createLeaf(), oldFiber, {
            pendingProps: element,
            parent: wipFiber,
            alternate: oldFiber,
            flags: Update,
            index: index,
            sibling: null,
          });
        }

        if (element && !sameType) {
          const leaf = new LeafNode(HostText, element, null);
          leaf.parent = wipFiber;
          leaf.flags = Placement;
          leaf.index = index;
          newFiber = leaf;
        }

        if (oldFiber && !sameType) {
          oldFiber.flags = Deletion;
          deletions.push(oldFiber);
        }

      } else {
        if (oldFiber) {
          oldFiber.flags = Deletion;
          deletions.push(oldFiber);
        }
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element) {
        prevSibling.sibling = newFiber;
      }

      // console.debug("{3}", '[reconcile]', "<<", { ...wipFiber }, { ...newFiber });

      prevSibling = newFiber
      index++
    }
    if (wipFiber.stateNode) {
      wipFiber.stateNode._gtrInternal = wipFiber;
    }
  }

  function createRef() {
    var refObject = { current: null };
    Object.seal(refObject);
    return refObject;
  }

  exports.createRef = createRef;
  exports.useState = useState;
  exports.useEffect = useEffect;
  exports.AbstractElement = AbstractElement;
  exports.createElement = createElement;
  exports.Render = render;
})));