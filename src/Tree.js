const { GREEN_ELEMENT_TYPE, RESERVED_PROPS } = require("./Types");

var emptyContextObject = {};
{
  Object.freeze(emptyContextObject);
}

function shouldConstruct$1(Component) {
    var prototype = Component.prototype;
    return !!(prototype && prototype.isGreenElement);
}
function isSimpleFunctionComponent(type) {
    return typeof type === 'function' && !shouldConstruct$1(type) && type.defaultProps === undefined;
}
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

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

function SuperNode(node, type, child) {
    return {
        elementType: type,
        child: child,
        stateNode: node,
        return: this,
    };
}

function isMounted(component) {
    return false;
}

var classComponentUpdater = {
    isMounted: isMounted,
    enqueueSetState: function (inst, payload, callback) {
        console.debug('enqueueSetState:', {
            instance: inst,
            payload: payload,
        });
    },
    enqueueReplaceState: function (inst, payload, callback) {
        
    },
    enqueueForceUpdate: function (inst, callback) {
       
    }
};

function updateElement(element, container, parentComponent, callback) {
    if (typeof element === "object") {
        if (element.$$typeof == GREEN_ELEMENT_TYPE) {
            console.debug("element:", element);
            if (typeof element.type === "string") {
                const dom_element = document.createElement(element.type);
                if (element.props) {
                    //console.debug("Props:", element.props);
                    setProps(dom_element, element.props); // Set properties to DOM element
                    if (Array.isArray(element.props.children)) {
                        const root_c = element.props.children.map(child => legacyRender(element, child, null, null));
                        for (const child of root_c) {
                            if (child && child != null)
                            if (!element.props.unsafeHTML) dom_element.append(child);
                            else dom_element.innerHTML += child;
                        }
                    } else
                    if (element.props.children && element.props.children != null)
                    if (!element.props.unsafeHTML) dom_element.append(element.props.children);
                    else dom_element.innerHTML += element.props.children;
                }
                console.debug("string comp:", dom_element);
                element._gtrInternals = {
                    type: element.type,
                    stateNode: dom_element,
                };
                return dom_element;
            } else if (typeof element.type === "function") {
                if (isSimpleFunctionComponent(element.type)) {
                    //console.warn("Simple Function Component:", element);
                    const root_a = element.type.call(this, element.props);
                    const c = legacyRender(null, root_a, null);
                    console.debug("function comp:", c);
                    return c;
                } else {
                    //console.warn("Class Component:", element);
                    var instance = constructClassInstance(element.type, element.props);
                    var stateNode = instance.render();
                    instance._gtrInternals = {
                        type: element.type,
                        stateNode: stateNode,
                        return: instance,
                    };
                    const c = legacyRender(element, stateNode, null);
                    console.debug("cls comp:", c);
                    return c;
                }
            }

        } else {
            console.debug("Invalid:", element)
        }
    } else if (typeof element === "string") {
        return element;
    }
    return null;
}

function legacyCreateRootContainer(container) {
    return {
        current: container
    };
}

function legacyRender(parentComponent, children, container, callback) {
    if (container) {
        var root = container._greentreeRootContainer;
        if (!root) {
            root = container._greentreeRootContainer = legacyCreateRootContainer(container);
        }
    }
    return updateElement(children, container, null, null);
    return null;
}

function constructClassInstance(Component, props) {
    var context = emptyContextObject;
    if (Component.prototype && typeof Component.prototype.render === 'function') {
        var instance = new Component(props, context);
        instance.updater = classComponentUpdater;
        return instance;
    }
}

function Render(element, container, callback) {
    if (element.$$typeof !== GREEN_ELEMENT_TYPE) {
        console.error("Element is not a GreenElement!");
        return;
    }
    const root$1 = legacyRender(null, element, container, callback);
    container.append(root$1);
    //window.root$1 = root$1;
    return root$1;
}

exports.Render = Render;