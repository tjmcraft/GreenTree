const { GREEN_ELEMENT_TYPE, RESERVED_PROPS } = require("./Types");

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

function isMounted(component) {}

var classComponentUpdater = {
    isMounted: isMounted,
    enqueueSetState: function (inst, payload, callback) {
        var fiber = get(inst);
        var eventTime = requestEventTime();
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(eventTime, lane);
        update.payload = payload;

        if (callback !== undefined && callback !== null) {
            {
                warnOnInvalidCallback(callback, 'setState');
            }

            update.callback = callback;
        }

        enqueueUpdate(fiber, update);
        scheduleUpdateOnFiber(fiber, lane, eventTime);
    },
    enqueueReplaceState: function (inst, payload, callback) {
        var fiber = get(inst);
        var eventTime = requestEventTime();
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(eventTime, lane);
        update.tag = ReplaceState;
        update.payload = payload;

        if (callback !== undefined && callback !== null) {
            {
                warnOnInvalidCallback(callback, 'replaceState');
            }

            update.callback = callback;
        }

        enqueueUpdate(fiber, update);
        scheduleUpdateOnFiber(fiber, lane, eventTime);
    },
    enqueueForceUpdate: function (inst, callback) {
        var fiber = get(inst);
        var eventTime = requestEventTime();
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(eventTime, lane);
        update.tag = ForceUpdate;

        if (callback !== undefined && callback !== null) {
            {
                warnOnInvalidCallback(callback, 'forceUpdate');
            }

            update.callback = callback;
        }

        enqueueUpdate(fiber, update);
        scheduleUpdateOnFiber(fiber, lane, eventTime);
    }
};

function legacyCreateRootContainer(container) {
    return;
}

function legacyRender(parentComponent, children, container, callback) {
    if (container) {
        var root = container._greentreeRootContainer;
        if (!root) {
            root = container._greentreeRootContainer = legacyCreateRootContainer(container);
        }
    }
    if (typeof children === "object") {
        if (children.$$typeof == GREEN_ELEMENT_TYPE) {
            if (typeof children.type === "string") {
                const dom_element = document.createElement(children.type);
                //children.dom_e = dom_element;
                if (children.props) {
                    //console.debug("Props:", children.props);
                    setProps(dom_element, children.props); // Set properties to DOM element
                    if (Array.isArray(children.props.children)) {
                        const root_c = children.props.children.map(child => legacyRender(children, child, null, null));
                        for (const child of root_c) {
                            if (child && child != null)
                            if (!children.props.unsafeHTML) dom_element.append(child);
                            else dom_element.innerHTML += child;
                        }
                    } else
                    if (children.props.children && children.props.children != null)
                    if (!children.props.unsafeHTML) dom_element.append(children.props.children);
                    else dom_element.innerHTML += children.props.children;
                }
                console.debug("string comp:", dom_element)
                return dom_element;
            } else if (typeof children.type === "function") {
                if (isSimpleFunctionComponent(children.type)) {
                    //console.warn("Simple Function Component:", children);
                    const root_a = children.type.call(this, children.props);
                    const c = legacyRender(null, root_a, null);
                    console.debug("function comp:", c);
                    return c;
                } else {
                    //console.warn("Class Component:", children);
                    const root_gc = renderComponent(children.type, children.props);
                    const c = legacyRender(null, root_gc, null);
                    console.debug("cls comp:", c);
                    return c;
                }
            }
        } else {
            console.debug("Invalid:", children)
        }
    } else if (typeof children === "string") {
        return children;
    }
    return null;
}

function renderComponent(Component, props) {
    if (Component.prototype && typeof Component.prototype.render === 'function') {
        const root_cm = new Component(props);
        return root_cm.render();
    }
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