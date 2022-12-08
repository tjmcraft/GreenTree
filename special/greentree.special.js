/**
 * GreenTree.js Library
 *
 * Copyright (c) TJMC-Company, Inc. and its affiliates. All Rights Reserved.
 *
 * Created for TJMC-Company, Inc. by MakAndJo
 */
 (function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
      (global = global || self, factory(global.GreenTree = {}));
}(this, (function (exports) {
  'use strict';

  var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
  const RESERVED_PROPS = { children: true, ref: true, unsafeHTML: true, ns: true };
  const GREEN_ELEMENT_TYPE = Symbol('green.element');

  function hasValidRef(config) {
    {
      if (hasOwnProperty$1.call(config, 'ref')) {
        var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
        if (getter && getter.isGreenWarning) {
          return false;
        }
      }
    }
    return config.ref !== undefined;
  }

  var GreenElement = function (type, key, ref, self, source, owner, props) {
    let element = {
      $$typeof: GREEN_ELEMENT_TYPE,
      type: type,
      key: key,
      ref: ref,
      props: props,
      _owner: owner
    }; {
      element._store = {};

      Object.defineProperty(element._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: false
      });

      Object.defineProperty(element, '_self', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: self
      });

      Object.defineProperty(element, '_source', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source
      });
    }
    return element;
  }

  function createElement(type, attributes, children) {
    var propName;

    var props = {};
    var key = null;
    var ref = null;
    var self = null;
    var source = null;

    if (attributes != null) {
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
      } {
        Object.freeze && Object.freeze(childArray);
      }
      props.children = childArray;
    }

    return GreenElement(type, key, ref, self, source, null, props);
  }

  function setProps(element, props) {
    if (props) for (const prop in props) {
      if (prop && props.hasOwnProperty(prop) && !RESERVED_PROPS.hasOwnProperty(prop)) {
        let value = props[prop]
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
    }
    return !!1;
  }

  function createRef() {
    var refObject = { current: null };
    Object.seal(refObject);
    return refObject;
  }

  const removeAllChildNodes = function (parent) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild)
    }
  }

  function updateContainer(element, container, parent, callback) {
    console.debug("[updateContainer]", arguments);
  }

  function updateChildren(element, parent) {
    console.debug(">>", "legacyRender:", element);
    if (element.$$typeof == GREEN_ELEMENT_TYPE) {
      if (typeof element.type === 'string') {
        const dom_element = document.createElement(element.type);
        element.dom_e = dom_element;
        if (element.props) {
          const props = element.props;
          setProps(dom_element, props);
          if (props.children) {
            if (Array.isArray(props.children)) {
              props.children.forEach(child => updateChildren(child, element));
            } else {
              updateChildren(props.children, element);
            }
          }
        }
        if (parent) {
          parent.dom_e.append(element.dom_e);
        }
        return element;
      } else if (typeof element.type === 'function') {
        const children = element.type(element.props);
        return updateChildren(children, element);
      }
    } else if (typeof element === 'string') {
      element = document.createTextNode(element);
      if (parent) {
        parent.dom_e.append(element);
      }
      return element;
    } else {
      console.debug("Invalid:", element)
    }
    return undefined;
  }

  function legacyRender(parentComponent, children, container, forceHydrate, callback) {
    children = updateChildren(children, parentComponent);
    if (container) {
      container.append(children.dom_e);
    }
    return children;
  }

  function render(element, container, callback) {
    if (element.$$typeof !== GREEN_ELEMENT_TYPE) {
      console.warn("Element is not a GreenElement!");
      return;
    }
    const root$1 = legacyRender(null, element, container, false, callback);
    window.root$1 = root$1;
    return root$1;
  }

  exports.createElement = createElement;
  exports.createRef = createRef;
  exports.render = render;

})));