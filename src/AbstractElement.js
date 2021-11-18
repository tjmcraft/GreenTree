'use strict';

import { GREEN_ELEMENT_TYPE } from "./Types";

/**
 * Abstract element implementation
 */
export default class AbstractElement {

    /**
     * Root content of the element
     * @type {Element}
     */
    #root = null;

    /**
     * Props of the element
     */
    props = {};

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

    unsafeHTML = false;

    $$typeof = GREEN_ELEMENT_TYPE;

    /**
     * Element constructor
     * @param {*} props - Properties for the element
     */
    constructor(props = {}) {
        this.props = props;
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
        this._updateElement(null, this.props, state);
    }

    /**
     * Update Element method
     */
    _updateElement(element = null, props = {}, state = {}, force = false) {
        props = props || this.props;
        state = state || this.state;

        if (!this.#initialized) return;
        //console.debug('[ELX] Update element (->) : ', this.#root);

        if (this.shouldComponentUpdate(props, state) || force) {
            this.state = state;
            const new_element = element || this.create.call(this, props);
            if (new_element instanceof HTMLElement) {
                this.#root && this.#root.replaceWith(new_element);
            }
            this.#root = (new_element);
            return true;
        }
        //console.debug('[ELX] Update element (<-) : ', this.#root);
        return false;
    }

    _mountElement() {
        (this.#root = this.create.call(this, this.props)) &&
        (this.#initialized = true) &&
        (this._updateElement(this.#root, this.props, null, true)) &&
        (this.componentDidMount.call(this));
    }

    shouldComponentUpdate(nextProps, nextState) {
        //console.debug('shouldComponentUpdate:', JSON.stringify(this.props) != JSON.stringify(nextProps), '+', JSON.stringify(this.state) != JSON.stringify(nextState), '->', (JSON.stringify(this.props) != JSON.stringify(nextProps) || JSON.stringify(this.state) != JSON.stringify(nextState)))
        //console.debug('shouldComponentUpdate:', '\nProps:', this.props, '\nNextProps:', nextProps, '\nState:', this.state, '\nNextState:', nextState,)
        return (
            (JSON.stringify(this.props) != JSON.stringify(nextProps)) ||
            (JSON.stringify(this.state) != JSON.stringify(nextState))
        );
    }

    componentDidMount() {}

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