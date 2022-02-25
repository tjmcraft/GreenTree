'use strict';

const { GREEN_ELEMENT_TYPE, RESERVED_PROPS } = require("../Types");

function createRef() {
    var refObject = { current: null };
    Object.seal(refObject);
    return refObject;
}

var TreeUpdater = {
    isMounted: function (publicInstance) {
        return false;
    },
    enqueueSetState: function (publicInstance, partialState, callback, callerName) {
        console.warn('enqueueSetState:', publicInstance.constructor.name);
    },
    enqueueForceUpdate: function (publicInstance, callback, callerName) {
        console.warn('enqueueForceUpdate:', publicInstance);
    },
    enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
        console.warn('enqueueReplaceState:', publicInstance);
    },
};

var emptyObject = {};

{
    Object.freeze(emptyObject);
}
  
function Component(props, context, updater) {
    this.props = props;
    this.context = context;
    this.refs = emptyObject;
    this.updater = updater || TreeUpdater;
}
Component.prototype.isGreenElement = {};
Component.prototype.setState = function (partialState, callback) {
    if (!(typeof partialState === 'object' || typeof partialState === 'function' || partialState == null)) {
        {
          throw Error( "setState(...): takes an object of state variables to update or a function which returns an object of state variables." );
        }
    }
    //console.log("setState:", partialState);
    this.updater.enqueueSetState(this, partialState, callback, 'setState');
}
Component.prototype.forceUpdate = function (callback) {
    this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};

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

exports.Component = Component;
exports.createElement = createElement;
exports.createRef = createRef;