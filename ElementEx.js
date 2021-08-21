/**
 * ElementEx.js Library
 * !WARNING! This library modify element instance itself!
 * 
 * Copyright (c) TJMC-Company, Inc. and its affiliates. All Rights Reserved.
 * 
 * Created for TJMC-Company, Inc. by MakAndJo
*/

'use strict';

/**
 * Functions toogle elements using css
 * @param {Boolean} state state to toggle TRUE/FALSE (it can be also null)
 * @param {String} class class to toggle STRING (it can be also null)
 */
Element.prototype.toggle = function(s = null, cls = null) {
    let cl = this.classList,
        c = cls || 'hidden',
        e = (s != null ? s : cl.contains(c) == 1),
        ce = (cls != null)
    cl[(ce ? !e : e) ? 'remove' : 'add'](c)
}

/**
 * The alternative function to querySelector
 * - It's more compact
 * - Ignores null and undefined
 * - Also support multiple select
 * - You can select the inherit element with element.qsl()
 * @param {Object} selector - The selector + object to select
 * @return {Element} element
 */
function qsl(s) {
    if (typeof s !== 'undefined' && s != null) return (typeof this === 'object' && this.nodeName ? this : document).querySelector(s)
}
Element.prototype.qsl = qsl

/**
 * The alternative function to querySelector
 * - It's more compact
 * - Ignores null and undefined
 * - Also support multiple select
 * - You can select the inherit element with element.qsl()
 * @param {Object} selector - The selector + object to select
 * @return {Element} element
 */
function qsla(s) {
    if (typeof s !== 'undefined' && s != null) return (typeof this === 'object' && this.nodeName ? this : document).querySelectorAll(s)
}
Element.prototype.qsla = qsla

/**
 * Creates new element with given attributes
 * @param {String} tag - The element tag
 * @param {Object} attrs - The attributes for this element
 * @param  {Element} childrens - Childrens for element
 * @returns {Element} instance of element
 */
function createElement(tag, attrs, ...childrens) {
    var element = document.createElement((typeof tag == 'string') ? tag : 'div');
    var insert_html = false;
    for (const name in attrs) {
        if (name && attrs.hasOwnProperty(name)) {
            let value = attrs[name];
            if (value instanceof Array) { value = value.filter(e => e).join(' ') }
            if (name == 'html' && value == true) { insert_html = true; continue; }
            if (value === true) { element.setAttribute(name, name) }
            else if (typeof value === 'string' && value != null) { element.setAttribute(name, value) }
                else if (value != null) { element[name] = value }
        }
    }
    for (const child of childrens) {
        if (child && child != null) {
            if (insert_html && child.nodeType == null) { element.innerHTML += child }
            else { element.append(child) }
        }
    }
    return element;
}
const cE = createElement

/**
 * Creates new svg element with given attributes
 * @param {Object} attrs - The attributes for this element
 * @param  {Element} childrens - Childrens for element
 * @returns {Element} instance of element
 */
function createSVGElement(attrs, ...childrens) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (let name in attrs) {
        if (name && attrs.hasOwnProperty(name)) {
            let value = attrs[name];
            if (value === true) {
                element.setAttribute(name, name);
            } else if (value !== false && value != null) {
                element.setAttribute(name, value.toString());
            }
        }
    }
    for (let child of childrens) {
        if (child && child.nodeType != null) {
            element.appendChild(child);
        } else {
            element.innerHTML += child.toString();
        }
    }
    return element;
}

/**
 * This function merging only arrays unique values. It does not merges arrays in to array with duplicate values at any stage.
 * - Function accept multiple array input (merges them to single array with no duplicates)
 * - it also can be used to filter duplicates in single array
 * @param {Object} arguments
 */
function merge (...args) {
    let set = new Set()
    for (let arr of args) {
        arr.map((value) => {
            set.add(value)
        })
    }
    return [...set]
}

Element.prototype.removeAllChildNodes = function() {
    let parent = this
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }
}

function randomInteger(max) {
    let min = 0
    let rand = min + Math.random() * (max + 1 - min)
    return Math.floor(rand)
}

function randomString(length) {
    var result           = ''
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}