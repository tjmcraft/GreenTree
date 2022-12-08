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

  const GREEN_ELEMENT_TYPE = Symbol("greentree.element");

  /**
   * Abstract element implementation
   */
  class AbstractElement {

    $$typeof = GREEN_ELEMENT_TYPE

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
     * Type of element (HTML, Function, Class)
     */
    type = 0;

    tag = null;

    stateNode = null;

    child = null;

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
    create(props = {}) {
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
    _updateElement(element = null, props = {}, state = {}, force = false) {
      props = props || this.#props;
      state = state || this.state;

      if (!this.#initialized) return;
      //console.debug('[ELX] Update element (->) : ', this.#root);

      if (this.shouldComponentUpdate(props, state) || force) {
        this.state = state;
        if (this.#root) { // already exists -> update
          console.warn('[ELX] Update element!', "->", "Update root", "type", this.type, "\n",
            "Props:", this.#props, "->", props, "\n",
            "State:", this.state, "->", state);
          if (this.type == 1) {
            //console.warn('[ELX] Update element!', "HTML", "\n", props, this.#props);
            this.#root = updateDomElement.call(this, this.#root, props);
          } else if (this.type == 3) {
            const ne = this.create.call(this, props);
            console.debug('[ELX] Update element! Created type 3:', ne);
            //this.#root = updateDomElement.call(this, this.#root, ne.props);
            //this.#root.replaceWith(ne.content);
            //this.#root = ne.content;
          } else {
            console.warn(`[ELX] Update element! -> Unknown type (${this.type}) while updating element!`);
          }
        } else {
          console.warn('[ELX] Update element!', "->", "Create new");
          switch (this.type) {
            case 1:
              {
                const new_element = createDomElement.call(this, this.tag, props);
                this.stateNode = new_element;
                this.#root = (new_element);
              }
              break;
            case 3:
              {
                console.debug("Render child node type 3", this);
                this.child = this.create.call(this, props);
                this.#root = this.child.content;
              }
              break;
            default:
              console.warn("Unknown Abstract type!", this.type)
              break;
          }
          console.debug('[ELX] Update element (->)', "Created new!", this.#root);
          //return true;
        }
        this.#props = props;
        this.state = state;
        return true;
      }
      //console.debug('[ELX] Update element (<-) : ', this.#root);
      return false;
    }

    _mountElement() {
      //(this.#root = this.create.call(this, this.props)) &&
        (this.#initialized = true) &&
        (this._updateElement(this.#root, this.props, null, true)) &&
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

    componentDidMount() { }

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

  function createDomElement(tag = "div", props = {}, namespaceURI = null) {

    let dom_element;

    if (namespaceURI) {
      dom_element = document.createElementNS(namespaceURI, tag);
    } else {
      dom_element = document.createElement(tag);
    }

    setDomProps(dom_element, props);

    return dom_element;
  }

  function updateDomElement(dom_element, props = {}) {
    setDomProps(dom_element, props);
    return dom_element;
  }

  function setDomProps(dom_element, props) {
    if (!props) return;
    for (const prop in props) {
      if (prop && props.hasOwnProperty(prop) && !RESERVED_PROPS.hasOwnProperty(prop)) {
        let value = props[prop]
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
    if (props.children) {
      Array.of(props.children)
        .flat(Infinity)
        .filter(e => e)
        .forEach(child => {
          console.debug("[setDomProps]", "Child:", child);
          if (typeof child === "string") {
            if (!props.unsafeHTML) dom_element.innerText = child;
            else dom_element.innerHTML = child;
          } else if (typeof child === "object" && child.$$typeof == GREEN_ELEMENT_TYPE) {
            if (!props.unsafeHTML) dom_element.append(child.content);
            else dom_element.innerHTML = child.content;
          } else {
            throw new Error("Unknown child type!")
          }
        });
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
      element_instance.type = 1;
      element_instance.tag = type;
      //element_instance.type = type;
      //element_instance.create = () => createDomElement(type, props, namespaceURI, unsafeHTML);
      //console.debug('StringEl:', element_instance);
    } else if (type.__proto__ === AbstractElement) {
      element_instance = new type(props);
      element_instance.type = 3;
      //console.debug('AbstractEl:', element_instance);
    } else if (typeof type === 'function') {
      element_instance = type.call(this, props);
      //element_instance.create = type;
      //console.debug('FunctionEl:', element_instance);
    }

    return element_instance;

    if (element_instance.content) {
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

  function Render(element, target) {
    console.debug("[Render]", arguments);
    if (!element instanceof AbstractElement) throw new Error('Element is not instance of AbstractElement');
    if (!target instanceof HTMLElement) throw new Error('Target is not instance of HTMLElement');
    removeAllChildNodes(target);
    target.append(element.content);
    target._gtrInternal = element;
    return 1;
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