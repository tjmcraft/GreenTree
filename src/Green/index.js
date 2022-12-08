'use strict';

const { GREEN_ELEMENT_TYPE, RESERVED_PROPS } = require("../Types");

function createRef() {
    return Object.seal({ current: null });
}

const TreeUpdater = {
    isMounted: function (publicInstance) {
        return false;
    },
    enqueueSetState: function (publicInstance, partialState, callback, callerName) {
        console.warn('[Green]', '[enqueueSetState]', publicInstance.constructor.name);
    },
    enqueueForceUpdate: function (publicInstance, callback, callerName) {
        console.warn('[Green]', '[enqueueForceUpdate]', publicInstance);
    },
    enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
        console.warn('[Green]', '[enqueueReplaceState]', publicInstance);
    },
};
  
function Component(props, context, updater) {
    this.props = props;
    this.context = context;
    this.refs = {};
    this.updater = updater || TreeUpdater;
}
Component.prototype.isGreenElement = true;
Component.prototype.setState = function (partialState, callback) {
    if (!(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null)) {
        {
          throw Error( "setState(...): takes an object of state variables to update or a function which returns an object of state variables." );
        }
    }
    this.updater.enqueueSetState(this, partialState, callback, 'setState');
}
Component.prototype.forceUpdate = function (callback) {
    this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
}

const GreenElement = function (type, key, ref, props) {
    return Object.assign({
        $$typeof: GREEN_ELEMENT_TYPE,
        type: 'div',
        key: 0,
        ref: null,
        props: {},
    }, {
        type: type,
        key: key, // Unused now
        ref: ref, // unused now
        props: props,
    });
}

function createElement(type, attributes, children) {

    let props = {};
    let key = null;
    let ref = null;

    if (attributes != null) {
        for (var propName in attributes) {
            if (attributes.hasOwnProperty(propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = attributes[propName];
            }
        }
    }

    const childrenLength = arguments.length - 2;

    if (childrenLength === 1) {
        props.children = children;
    } else if (childrenLength > 1) {
        let childArray = Array(childrenLength);
        for (var i = 0; i < childArray.length; i++) {
            childArray[i] = arguments[i + 2];
        }
        Object.freeze(childArray);
        props.children = childArray;
    }

    return GreenElement(type, key, ref, props);
}

exports.Component = Component;
exports.createElement = createElement;
exports.createRef = createRef;