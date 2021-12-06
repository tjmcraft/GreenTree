const { GREEN_ELEMENT_TYPE, RESERVED_PROPS, ELEMENT_NODE, GREEN_TREE_TYPE } = require("../Types");

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

function SuperNode(tag, pendingProps, key, mode) {
     // Instance
     this.tag = tag;
     this.key = key;
     this.elementType = null;
     this.type = null;
     this.stateNode = null; // Fiber
 
     this.return = null;
     this.child = null;
     this.sibling = null;
     this.index = 0;
     this.ref = null;
     this.pendingProps = pendingProps;
     this.memoizedProps = null;
     this.updateQueue = null;
     this.memoizedState = null;
     this.dependencies = null;
     this.mode = mode; // Effects
 
     this.flags = NoFlags;
     this.nextEffect = null;
     this.firstEffect = null;
     this.lastEffect = null;
     this.lanes = NoLanes;
     this.childLanes = NoLanes;
     this.alternate = null;
}

var createSuper = function (tag, pendingProps, key, mode) {
    return new SuperNode(tag, pendingProps, key, mode);
};

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

function createSuperNodeFromTypeAndProps(type, props) {
    var Super = createSuper(type, props, null, null);
}

function createSuperNode(element) {
    var type = element.type;
    var pendingProps = element.props;
    var superNode = createSuperNodeFromTypeAndProps(type, pendingProps);
    return superNode;
}

function updateElement(element, container, parentComponent, callback) {
    var created = null;
    if (typeof element === "object") {
        if (element.$$typeof == GREEN_ELEMENT_TYPE) {
            console.debug("element:", element);
            if (typeof element.type === "string") {
                const dom_element = document.createElement(element.type);
                if (element.props) {
                    //console.debug("Props:", element.props);
                    setProps(dom_element, element.props); // Set properties to DOM element
                    if (Array.isArray(element.props.children)) {
                        const root_c = element.props.children.map(child => updateElement(child, null, element, null));
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
                    const c = updateElement(root_a, null, null);
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
                    const c = updateElement(stateNode, null);
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
    //container.child = element;
}

function legacyCreateRootContainerFromDOM(container, forceHydrate) {
    const shouldHydrate = forceHydrate || false;
    if (!shouldHydrate) {
        let warned = false;
        let root;
        while (root = container.lastChild) {
            {
                if (!warned && root.nodeType === ELEMENT_NODE && root.hasAttribute("green-root")) {
                    warned = true;
                    console.warn("Warn! Removing root node from DOM container given is a bad idea!");
                }
            }
            container.removeChild(root);
        }
    }
    return {
        id: 1,
        current: container,
        $$typeof: GREEN_TREE_TYPE,
    };
}

function legacyRender(parentComponent, children, container, callback) {
    var root = container._greentreeRootContainer;
    if (!root) {
        root = container._greentreeRootContainer = legacyCreateRootContainerFromDOM(container, false);
        updateElement(children, root, parentComponent, callback);
    } else {
        updateElement(children, root, parentComponent, callback);
    }
    return root;
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
    if (container.nodeType !== ELEMENT_NODE && !container.tagName) {
        console.error("Container is not a node element!");
        return;
    }
    const root$1 = legacyRender(null, element, container, callback);
    //container.append(root$1);
    //window.root$1 = root$1;
    return root$1;
}

exports.Render = Render;