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
    __root = null;

    /**
     * Props of the element
     */
    __props = {};

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
    __initialized = false;

    /**
     * Element constructor
     * @param {*} props - Properties for the element
     */
    constructor(props = {}) {
        this.__props = props;
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
        this._updateElement(null, this.__props, state);
    }

    /**
     * Update Element method
     */
    _updateElement(element = null, props = null, state = null, force = false) {
        props = props || this.__props;
        state = state || this.state;

        if (!this.__initialized) return;
        //console.debug('[ELX] Update element (->) : ', this.__root);

        if (this.shouldComponentUpdate(props, state) || force) {
            this.state = state;
            const new_element = element || this.create.call(this);
            this.__root && this.__root.replaceWith(new_element);
            this.__root = (new_element);
            return true;
        }
        //console.debug('[ELX] Update element (<-) : ', this.__root);
        return false;
    }

    _mountElement() {
        (this.__root = this.create.call(this)) &&
        (this.__initialized = true) &&
        (this._updateElement(this.__root, null, null, true)) &&
        (this.componentDidMount.call(this));
    }

    shouldComponentUpdate(nextProps, nextState) {
        //console.debug('shouldComponentUpdate:', JSON.stringify(this.__props) != JSON.stringify(nextProps), '+', JSON.stringify(this.state) != JSON.stringify(nextState), '->', (JSON.stringify(this.__props) != JSON.stringify(nextProps) || JSON.stringify(this.state) != JSON.stringify(nextState)))
        //console.debug('shouldComponentUpdate:', '\nProps:', this.__props, '\nNextProps:', nextProps, '\nState:', this.state, '\nNextState:', nextState,)
        return (
            (JSON.stringify(this.__props) != JSON.stringify(nextProps)) ||
            (JSON.stringify(this.state) != JSON.stringify(nextState))
        );
    }

    componentDidMount() {}

    /**
     * Get element props (Object)
     * @type {Object}
     */
    get props() {
        return this.__props;
    }

    /**
     * Get element content (HTMLObject)
     * @return {HTMLObject}
     */
    get content() {
        if (!this.__initialized || !this.__root) this._mountElement.call(this);
        return this.__root
    }

    /**
     * Remove element method
     */
    remove() {
        this.__root.remove()
    }

}

/**
 * Creates new element with given attributes
 * @param {String} tag - The element tag
 * @param {Object} attrs - The attributes for this element
 * @param  {Element} childrens - Childrens for element
 * @returns {Element} instance of element
 */
function createElement(type = 'div', attributes = {}, ...children) {
    const ignoredProps = ['children', 'ref'];
    attributes = attributes ?? {};
    let element_instance = null;

    if (typeof type === 'string') {
        element_instance = new AbstractElement(Object.assign(attributes, {
            children: children
        }));
        //element_instance.type = type;
        element_instance.create = function () {
            if (type.toLowerCase() == "svg")
                const dom_element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            else
                const dom_element = document.createElement(type);
            for (const prop in this.props) {
                if (prop && this.props.hasOwnProperty(prop) && !ignoredProps.includes(prop)) {
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
            for (const child of this.props.children) {
                if (child && child != null) dom_element.append(child);
            }
            return dom_element;
        }
    } else if (type.__proto__ === AbstractElement) {
        element_instance = new type(Object.assign(attributes, {
            children: children
        }));
    }

    if (attributes.ref) {
        if (typeof attributes.ref === 'function') attributes.ref.call(this, element_instance.content)
        else if (typeof attributes.ref === 'object') attributes.ref.current = element_instance.content
        //else if (typeof attributes.ref === 'string') this.refs[attributes.ref] = element_instance.content
    }

    return element_instance.content;

}

const RESERVED_PROPS = ['children', 'ref'];
const GREEN_ELEMENT_TYPE = Symbol('green.element');

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
    var refObject = {
        current: null
    };

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