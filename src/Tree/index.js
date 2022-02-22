import { DOCUMENT_NODE, ELEMENT_NODE, GREEN_ELEMENT_TYPE, HostComponent, LegacyRoot } from "../Types";
import { createLeafRoot } from "./Leaf/Root";

var now = () => new Date().getTime();
var initialTime = now();
var currentEventTime = 0;

function isValidContainer(node) {
    return !!(node && (node.nodeType == ELEMENT_NODE || node.nodeType == DOCUMENT_NODE));
}

function getPublicRootInstance(container) {
    var containerFiber = container.current;
    
    if (!containerFiber.child) {
        return null;
    }

    return containerFiber.child.stateNode;
}

var randomKey = Math.random().toString(36).slice(2);
var internalInstanceKey = '__treeLeaf$' + randomKey;
var internalPropsKey = '__treeProps$' + randomKey;
var internalContainerInstanceKey = '__treeContainer$' + randomKey;
var internalEventHandlersKey = '__treeEvents$' + randomKey;

function precacheLeafNode(hostInst, node) {
    node[internalInstanceKey] = hostInst;
}

function markContainerAsRoot(hostRoot, node) {
    node[internalContainerInstanceKey] = hostRoot;
}

function unmarkContainerAsRoot(node) {
    node[internalContainerInstanceKey] = null;
}

function isContainerMarkedAsRoot(node) {
    return !!node[internalContainerInstanceKey];
}

function createRootNode(container, tag, options) {
    var root = createLeafRoot(container, tag);
    markContainerAsRoot(root.current, container);
    return root;
}

function DOMBlockingRoot(container, tag, options) {
    this._internalRoot = createRootNode(container, tag, options);
}

function createRoot(container, options) {
    return new DOMBlockingRoot(container, LegacyRoot, options);
}

function createRootContainer(container) {
    var rootSibling;
    var warned = false;
    while (rootSibling = container.lastChild) {
        if (!warned && rootSibling.nodeType === DOCUMENT_NODE) {
            console.warn('Root container is not empty!');
            warned = true;
        }
        container.removeChild(rootSibling);
    }
    return createRoot(container);
}

function requestEventTime() {
    currentEventTime = now() - initialTime;
    return currentEventTime;
}

function createUpdate(payload, eventTime) {
    return Object.assign({
        tag: "UpdateState",
        eventTime: eventTime,
        payload: payload,
        callback: void 0,
        next: null,
    }, {});
}

function enqueueUpdate(node, update) {
    var updateQueue = node.updateQueue;
    if (updateQueue === null) {
        console.warn("Already unmounted!", node);
        return;
    }
    var sharedQueue = updateQueue.shared;
    var pendingQueue = sharedQueue.pending;
    sharedQueue.pending = update;
    console.warn("enqeueUpdate:", updateQueue)
}

function scheduleUpdateOnLeaf(leaf, eventTime) {

}

function updateContainer(element, container, parentComponent, callback) {

    const current = container.current;
    const eventTime = requestEventTime();

    const update = createUpdate({
        element: element
    }, eventTime);

    enqueueUpdate(current, update);
    scheduleUpdateOnLeaf(current, eventTime);
    

    console.debug("[updateContainer]", "{current}", current);
    console.debug("[updateContainer]", "{element}", element);
    console.debug("[updateContainer]", "{eventTime}", eventTime);
}

function legacyRender(parent, children, container, callback) {
    var root = container._greentreeRootContainer;
    var leafRoot;

    if (!root) { // First time initial mount
        root = container._greentreeRootContainer = createRootContainer(container);
    }
    leafRoot = root._internalRoot;
    updateContainer(children, leafRoot, parent, callback);
    return getPublicRootInstance(leafRoot);
}

function Render(element, container, callback) {
    if (!isValidContainer(container)) {
        throw Error("Target container is not a DOM element.");
    }
    const root$1 = legacyRender(null, element, container, callback);
    //container.append(root$1);
    //window.root$1 = root$1;
    return root$1;
}

export { Render };