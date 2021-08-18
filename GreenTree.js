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
            (global = global || self, factory(global.GreenTee = {}));
}(this, (function (exports) {
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
            //this.state = props;
            //this.root = cE('div');
            //this.update(this.state);
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
            
            this.#updateElement(null, this.#props, state);
            
        }

        /**
         * Update Element method
         */
        #updateElement(element = null, props = null, state = null) {
            props = props || this.#props;
            state = state || this.state;

            if (!this.#initialized) return;
            //console.debug('[ELX] Update element (->) : ', this.#root);
            
            if (this.shouldComponentUpdate(props, state)) {
                this.state = state;
                const new_element = element || this.create.call(this);
                this.#root && this.#root.replaceWith(new_element);
                this.#root = (new_element);
                
            }
            //console.debug('[ELX] Update element (<-) : ', this.#root);
        }

        #mountElement() {
            this.#root = this.create.call(this);
            this.#initialized = true;
            this.#updateElement(this.#root);
            this.componentDidMount.call(this);
        }

        shouldComponentUpdate(nextProps, nextState) {
            //console.debug('shouldComponentUpdate:', JSON.stringify(this.#props) != JSON.stringify(nextProps), '+', JSON.stringify(this.state) != JSON.stringify(nextState), '->', (JSON.stringify(this.#props) != JSON.stringify(nextProps) || JSON.stringify(this.state) != JSON.stringify(nextState)))
            //console.debug('shouldComponentUpdate:', '\nProps:', this.#props, '\nNextProps:', nextProps, '\nState:', this.state, '\nNextState:', nextState,)
            return JSON.stringify(this.#props) != JSON.stringify(nextProps) || JSON.stringify(this.state) != JSON.stringify(nextState);
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
            if (!this.#initialized || !this.#root) this.#mountElement.call(this);
            return this.#root
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
     * @param  {Element} childrens - Childrens for element
     * @returns {Element} instance of element
     */
    function createElement(type = 'div', attributes = {}, ...children) {
        const ignoredProps = ['children', 'ref'];
        attributes = attributes || {};
        let element_instance = null;

        if (typeof type === 'string') {
            element_instance = new AbstractElement(Object.assign(attributes, {
                children: children
            }));
            //element_instance.type = type;
            element_instance.create = function () {
                const dom_element = document.createElement(type);
                for (const prop in this.props) {
                    if (prop && this.props.hasOwnProperty(prop) && !ignoredProps.includes(prop)) {
                        let value = this.props[prop]
                        if (value instanceof Object) {
                            if (value instanceof Array) dom_element.setAttribute(prop, value.filter(e => e).join(' '));
                            else Object.assign(dom_element[prop], value);
                        } else {
                            if (value === true) dom_element.setAttribute(prop, prop);
                            else if (value !== false && value != null) dom_element.setAttribute(prop, value.toString());
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
    exports.createRef = createRef;
    exports.Render = Render;
})));
