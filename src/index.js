/**
 * GreenTree.js Library
 * 
 * Copyright (c) TJMC-Company, Inc. and its affiliates. All Rights Reserved.
 * 
 * Created for TJMC-Company, Inc. by MakAndJo
 */

'use strict';

/**
 * Abstract element implementation
 */
class AbstractElement {

    /**
     * Root content of the element
     * @type {Element}
     */
    #root = null;

    /**
     * Props of the element
     */
    #props = {};

    /**
     * State storage for element
     */
    state = {};

    /**
     * Type of element
     */
    type = null;

    /**
     * Set status of the element
     */
    #initialized = false;

    /**
     * Element constructor
     * @param {*} props - Properties for the element
     */
    constructor(props = {}) {
        this.#props = props;
    }

    /**
     * Create Element method
     */
    create() {
        return document.createElement('div');
    }

    /**
     * Set state of the element
     * @param {*} state 
     */
    setState(state = {}) {
        //console.debug('[ELX] Set state: ', state);
        this._updateElement(null, this.#props, state);
    }

    /**
     * Update Element method
     */
    _updateElement(element = null, props = null, state = null, force = false) {
        props = props || this.#props;
        state = state || this.state;

        if (!this.#initialized) return;
        //console.debug('[ELX] Update element (->) : ', this.#root);

        if (this.shouldComponentUpdate(props, state) || force) {
            this.state = state;
            const new_element = element || this.create.call(this);
            this.#root && this.#root.replaceWith(new_element);
            this.#root = (new_element);
            return true;
        }
        //console.debug('[ELX] Update element (<-) : ', this.#root);
        return false;
    }

    _mountElement() {
        (this.#root = this.create.call(this)) &&
        (this.#initialized = true) &&
        (this._updateElement(this.#root, null, null, true)) &&
        (this.componentDidMount.call(this));
    }

    shouldComponentUpdate(nextProps, nextState) {
        //console.debug('shouldComponentUpdate:', JSON.stringify(this.#props) != JSON.stringify(nextProps), '+', JSON.stringify(this.state) != JSON.stringify(nextState), '->', (JSON.stringify(this.#props) != JSON.stringify(nextProps) || JSON.stringify(this.state) != JSON.stringify(nextState)))
        //console.debug('shouldComponentUpdate:', '\nProps:', this.#props, '\nNextProps:', nextProps, '\nState:', this.state, '\nNextState:', nextState,)
        return (
            (JSON.stringify(this.#props) != JSON.stringify(nextProps)) ||
            (JSON.stringify(this.state) != JSON.stringify(nextState))
        );
    }

    componentDidMount() {}

    /**
     * Get element props (Object)
     * @type {Object}
     */
    get props() {
        return this.#props;
    }

    /**
     * Get element content (HTMLObject)
     * @return {HTMLObject}
     */
    get content() {
        if (!this.#initialized || !this.#root) this._mountElement.call(this);
        return this.#root;
    }

    /**
     * Remove element method
     */
    remove() {
        this.#root.remove()
    }

}

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
        element_instance.create = function () {

            let dom_element;

            if (namespaceURI) {
                console.debug('Creating element with ns:', namespaceURI)
                dom_element = document.createElementNS(namespaceURI, type);
            } else {
                dom_element = document.createElement(type);
            }

            if (this.props) for (const prop in this.props) {
                if (prop && this.props.hasOwnProperty(prop) && !RESERVED_PROPS.hasOwnProperty(prop)) {
                    let value = this.props[prop]
                    if (value instanceof Object) {
                        if (value instanceof Array) // if array
                            dom_element.setAttribute(prop, value.filter(e => e).join(' '));
                        else if (typeof value === 'function' && value != null) // if function
                            dom_element[prop] = value;
                        else Object.assign(dom_element[prop], value);
                    } else {
                        if (value === true) // if simple true
                            dom_element.setAttribute(prop, prop);
                        else if (typeof value === 'string' && value != null) // if string
                            dom_element.setAttribute(prop, value);
                        else if (value !== false && value != null) // something else
                            dom_element.setAttribute(prop, value.toString());
                    }
                }
            }

            if (Array.isArray(this.props.children))
                for (const child of this.props.children) {
                    if (child && child != null)
                        if (!unsafeHTML) dom_element.append(child);
                        else dom_element.innerHTML += child;
                }
            else 
                if (this.props.children && this.props.children != null)
                    if (!unsafeHTML) dom_element.append(this.props.children);
                    else dom_element.innerHTML += this.props.children;
            return dom_element;
        }
    } else if (type.__proto__ === AbstractElement) {
        element_instance = new type(props);
    }

    if (element_instance) {
        if (ref) {
            if (typeof ref === 'function') ref.call(this, element_instance.content)
            else if (typeof ref === 'object') ref.current = element_instance.content
            //else if (typeof attributes.ref === 'string') this.refs[attributes.ref] = element_instance.content
        }
        return element_instance.content;
    } else {
        console.warn('[GreenTree]', 'Your element is not generated!');
    }
    return null;

}

var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const RESERVED_PROPS = { children: true, ref: true, unsafeHTML: true, ns: true };
const GREEN_ELEMENT_TYPE = Symbol('green.element');

function hasValidRef(config) {
    {
        if (hasOwnProperty$1.call(config, 'ref')) {
            var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
            console.debug('Getter:', getter);
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

}

function createRef() {
    var refObject = { current: null };
    Object.seal(refObject);
    return refObject;
}

function Render(element, target) {
    if (!element instanceof AbstractElement) throw new Error('Element is not instance of AbstractElement');
    if (!target instanceof HTMLElement) throw new Error('Target is not instance of HTMLElement');
    target.removeAllChildNodes();
    if (element instanceof Array) {
        element = element.filter(e => !!e?.nodeType)
        target.append(...element);
    } else {
        target.append(...[element]);
    }
}

exports.AbstractElement = AbstractElement;
exports.createElement = createElement;
exports.createElement2 = createElement2;
exports.createRef = createRef;
exports.Render = Render;
exports.render = render;