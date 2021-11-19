/**
 * GreenTree.js Library
 * 
 * Copyright (c) TJMC-Company, Inc. and its affiliates. All Rights Reserved.
 * 
 * Created for TJMC-Company, Inc. by MakAndJo
 */

'use strict';

const { GREEN_ELEMENT_TYPE } = require("./Types");

function shouldConstruct$1(Component) {
    var prototype = Component.prototype;
    return !!(prototype && prototype.isGreenElement);
}
function isSimpleFunctionComponent(type) {
    return typeof type === 'function' && !shouldConstruct$1(type) && type.defaultProps === undefined;
}
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const RESERVED_PROPS = { children: true, ref: true, unsafeHTML: true, ns: true };

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

var emptyObject = {};

{
    Object.freeze(emptyObject);
}
  
function Component(props, context, updater) {
    this.props = props;
    this.context = context;
    this.refs = emptyObject;
    this.updater = updater;
}
Component.prototype.isGreenElement = {};
Component.prototype.setState = function (partialState) {
    if (!(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null)) {
        {
          throw Error( "setState(...): takes an object of state variables to update or a function which returns an object of state variables." );
        }
    }
    //this.updater.enqueueSetState(this, partialState, callback, 'setState');
}

var GreenElement = function (type, key, ref, self, source, owner, props) {
    var element = {
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

function render(element, container, callback) {
    if (element.$$typeof !== GREEN_ELEMENT_TYPE) {
        console.error("Element is not a GreenElement!");
        return;
    }
    const root$1 = legacyRender(null, element, container, callback);
    container.append(root$1);
    //window.root$1 = root$1;
    return root$1;
}

function legacyCreateRootContainer(container) {
    return;
}

function legacyRender(parentComponent, children, container, callback) {
    if (container) {
        var root = container._greentreeRootContainer;
        if (!root) {
            root = container._greentreeRootContainer = legacyCreateRootContainer(container);
        }
    }
    if (typeof children === "object") {
        if (children.$$typeof == GREEN_ELEMENT_TYPE) {
            if (typeof children.type === "string") {
                const dom_element = document.createElement(children.type);
                //children.dom_e = dom_element;
                if (children.props) {
                    //console.debug("Props:", children.props);
                    setProps(dom_element, children.props); // Set properties to DOM element
                    if (Array.isArray(children.props.children)) {
                        const root_c = children.props.children.map(child => legacyRender(children, child, null, null));
                        for (const child of root_c) {
                            if (child && child != null)
                                if (!children.props.unsafeHTML) dom_element.append(child);
                                else dom_element.innerHTML += child;
                        }
                    } else
                        if (children.props.children && children.props.children != null)
                            if (!children.props.unsafeHTML) dom_element.append(children.props.children);
                            else dom_element.innerHTML += children.props.children;
                }
                console.debug("string comp:", dom_element)
                return dom_element;
            } else if (typeof children.type === "function") {
                if (isSimpleFunctionComponent(children.type)) {
                    //console.warn("Simple Function Component:", children);
                    const root_a = children.type.call(this, children.props);
                    const c = legacyRender(null, root_a, null);
                    console.debug("function comp:", c);
                    return c;
                } else {
                    //console.warn("Class Component:", children);
                    const root_gc = renderComponent(children.type, children.props);
                    const c = legacyRender(null, root_gc, null);
                    console.debug("cls comp:", c);
                    return c;
                }
            }
        } else {
            console.debug("Invalid:", children)
        }
    } else if (typeof children === "string") {
        return children;
    }
    return null;
}

function renderComponent(Component, props) {
    if (Component.prototype && typeof Component.prototype.render === 'function') {
        const root_cm = new Component(props);
        return root_cm.render();
    }
}

const isValidProps = (props) => props != undefined && props != null && typeof props == "object";
function setProps(element, props) {
    if (!isValidProps(props)) {
        console.warn("Invalid props:", props);
        return !!0;
    }
    for (const prop in props) {
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

exports.AbstractElement = Component;
exports.createElement = createElement;
exports.createRef = createRef;
exports.Render = render;