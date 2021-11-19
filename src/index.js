/**
 * GreenTree.js Library
 * 
 * Copyright (c) TJMC-Company, Inc. and its affiliates. All Rights Reserved.
 * 
 * Created for TJMC-Company, Inc. by MakAndJo
 */

'use strict';

const { default: AbstractElement } = require("./AbstractElement");
const { GREEN_ELEMENT_TYPE } = require("./Types");

/**
 * Creates new element with given attributes
 * @param {String} tag - The element tag
 * @param {Object} attrs - The attributes for this element
 * @param  {Element} children - Children for element
 * @returns {Element} instance of element
 */
function createElement(type = "div", attributes = null, children = null) {
    var propName;
    var props = {};
    var key = null;
    var ref = null;
    var self = null;
    var source = null;
    var unsafeHTML = false;
    var namespaceURI = null;

    if (attributes != null) {
        if (hasValidRef(attributes)) {
            ref = attributes.ref;
        }
        unsafeHTML = attributes.unsafeHTML === true;
        namespaceURI = attributes.ns;
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

    let element_instance = null;

    if (typeof type === 'string') {

        element_instance = new AbstractElement(props);
        element_instance.type = type;
        element_instance.unsafeHTML = unsafeHTML;
        element_instance.create = function () {

            let dom_element;

            if (namespaceURI) {
                dom_element = document.createElementNS(namespaceURI, type);
            } else {
                dom_element = document.createElement(type);
            }

            setProps(dom_element, props);

            /*if (this.props.children) {
                Array.of(this.props.children)
                    .flat(Infinity)
                    .filter(e => e)
                    .forEach(child => {
                        if (!unsafeHTML) dom_element.append(child);
                        else dom_element.innerHTML += child;
                    });
            }*/
                
            return dom_element;
        }
        //console.debug('StringEl:', element_instance);
    } else if (type.__proto__ === AbstractElement) {
        element_instance = new AbstractElement(props);
        element_instance.type = type;
        //console.debug('AbstractEl:', element_instance);
    } else if (typeof type === 'function') {
        element_instance = new AbstractElement(props);
        element_instance.type = type;
        //element_instance.create = type;
        //console.debug('FunctionEl:', element_instance);
    }

    if (element_instance.content) {
        /*if (ref) {
            if (typeof ref === 'function') ref.call(this, element_instance.content)
            else if (typeof ref === 'object') ref.current = element_instance.content
            //else if (typeof attributes.ref === 'string') this.refs[attributes.ref] = element_instance.content
        }*/
        return element_instance;
    } else {
        console.warn('[GreenTree]', 'Your element is not generated!');
    }
    return null;

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

function createElement2(type, attributes, children) {
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
    const root$1 = legacyRender(null, element, container, false, callback);
    container.append(root$1.dom_e);
    //window.root$1 = root$1;
    return root$1;
}

function legacyRender(parentComponent, children, container, forceHydrate, callback) {
    if (children.$$typeof == GREEN_ELEMENT_TYPE) {
        const dom_element = document.createElement(children.type);
        children.dom_e = dom_element;
        if (children.props) {
            console.debug("Props:", children.props);
            setProps(dom_element, children.props);
            if (Array.isArray(children.props.children)) {
                children.props.children.forEach(child => legacyRender(children, child, null, null));
            }
            if (Array.isArray(children.props.children))
                for (const child of children.props.children) {
                    if (child && child != null)
                        if (!children.props.unsafeHTML) dom_element.append(child.dom_e || child);
                        else dom_element.innerHTML += child;
                }
            else
                if (children.props.children && children.props.children != null)
                    if (!children.props.unsafeHTML) dom_element.append(children.props.children);
                    else dom_element.innerHTML += children.props.children;
        }
    } else {
        console.debug("Invalid:", children)
    }
    return children;
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

function legacyRender$1(children) {
    console.debug(" -> Element:", children);
    if (typeof children === "object" && children instanceof AbstractElement) {
        console.debug("-[RenderABE] Start!");
        console.debug("+[RenderABE] Type:", typeof children.type);
        if (typeof children.type === "string") {
            console.debug("++[RenderABE] Type String!");
            if (children.props) {
                console.debug("+++[RenderABE] Has Props!");
                const a_root = children.content;
                //console.debug("ARoot:", a_root)
                if (children.props.children) {
                    console.debug("++++[RenderABE] Has Children in Props!");
                    if (!!a_root?.nodeType) {
                        console.debug("+++++[RenderABE] Children Node Type!");
                        Array.of(children.props.children)
                            .flat(Infinity)
                            .filter(e => e)
                            .forEach(child => {
                                const b_root = legacyRender$1(child);
                                //console.debug("BRoot:", b_root)
                                if (!children.unsafeHTML) {
                                    a_root.append(b_root);
                                } else {
                                    console.warn("++++++[RenderABE] Using unsafeHTML!");
                                    a_root.innerHTML += (b_root);
                                }
                            })
                    }
                }
                //console.debug("RetCHC:", children.content);
                return children.content;
            }
        } else if (typeof children.type === "function") {
            console.debug("++[RenderABE] Type Function!");
            if (children.type.__proto__ === AbstractElement) {
                console.debug("+++[RenderABE] Type ABSTRACT!");
                const c_root = new children.type(children.props);
                //c_root.type = children.type;
                const r = legacyRender$1(c_root);
                console.warn(c_root);
            } else {
                console.debug("++[RenderABE] Type Func!");
                return "func_raw";
            }
        }
    } else if (typeof children === "string") {
        console.debug("+[RenderSTE] Type String!");
        return children;
    }
    return "";
}

function Render(element, target) {
    if (!element instanceof AbstractElement) throw new Error('Element is not instance of AbstractElement');
    if (!target instanceof HTMLElement) throw new Error('Target is not instance of HTMLElement');
    target.removeAllChildNodes();
    /*if (element instanceof Array) {
        element = element.filter(e => !!e?.nodeType)
        target.append(...element);
    } else {
        target.append(...[element]);
    }*/
    const root = legacyRender$1(element);

    target.append(root);
}

exports.AbstractElement = AbstractElement;
exports.createElement = createElement;
exports.createElement2 = createElement2;
exports.createRef = createRef;
exports.Render = Render;
exports.render = render;