import { DOCUMENT_NODE, ELEMENT_NODE, GREEN_ELEMENT_TYPE, HostComponent, HostRoot, LegacyRoot } from "../Types";
import { createLeaf } from "./LeafNode";
import { createLeafRoot } from "./LeafRoot";

var workInProgress = null;

var now = () => new Date().getTime();
var initialTime = now();
var currentEventTime = 0;

function getPublicRootInstance(container) {
    console.debug("[getPublicRootInstance]", container);
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

function createRootNode(container, tag) {
    var root = createLeafRoot(container, tag);
    //markContainerAsRoot(root.current, container);
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

function getLeafRoot(leaf) {
    return leaf.return;
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

function enqueueUpdate(node, update) { // Create update on leaf
    console.debug('[enqueueUpdate]', arguments);
    var updateQueue = node.updateQueue; // Node update queue
    if (updateQueue === null) {
        console.warn("Already unmounted!", node);
        return;
    }
    updateQueue.pending = update; // Push pending update
    console.warn("[enqeueUpdate]", "{createdUpdate}", updateQueue)
}

function scheduleUpdateOnLeaf(leaf, eventTime) { // Schedule update on leaf
    console.debug('[scheduleUpdateOnLeaf]', arguments);
    var exitStatus;
    var root = getLeafRoot(leaf); // Get the root node
    exitStatus = renderRootSync(root); // Render the root sync
    return null;
}

function createWorkInProgress(current, pendingProps) {
    console.debug('[createWorkInProgress]', arguments);
    var workInProgress = current.alternate;
    console.debug('[createWorkInProgress]', '{wip}', workInProgress);

    if (workInProgress === null) {
        workInProgress = createLeaf(current.tag, pendingProps, current.key); // Create Leaf node
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        workInProgress.alternate = current; // Circular reference to current
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
    }

    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue; 

    workInProgress.ref = current.ref;
    return workInProgress;
}

function prepareWorkOnRoot(root) {
    console.debug('[prepareWorkOnRoot]', root);
    workInProgress = createWorkInProgress(root.current, null);
}

function renderRootSync(root) {
    console.debug('[renderRootSync]', arguments);
    if (workInProgress != root) {
        prepareWorkOnRoot(root);
    }
    console.debug('[renderRootSync]', '{WIP}', workInProgress);
    do {
        try {
            workLoopSync();
            break;
        } catch (e) {
            console.error('[renderRootSync]', e.message);
            throw e;
        }
    } while (true);
}

function workLoopSync() {
    while (workInProgress != null) {
        preformWorkOnUnit(workInProgress);
    }
}

function preformWorkOnUnit(unit) {
    console.debug('[performUnitOfWork]', arguments);
    var current = unit.alternate;
    var next;
    next = beginWork(current, unit);
    unit.memoizedProps = unit.pendingProps;
    if (next === null) {
        completeWorkOnUnit(unit);
    } else {
        workInProgress = next;
    }
    workInProgress = null;
}

function beginWork(current, workInProgress) {
    console.debug('[beginWork]', arguments);
    if (current !== null) {
        switch (workInProgress.tag) {
            case HostRoot:
                return updateHostRoot(current, workInProgress);
        }
    }
    return null;
}

function updateHostRoot(current, workInProgress) {
    var updateQueue = workInProgress.updateQueue;
}

function reconcileChildren() {

}

function updateContainer(element, container, parentComponent, callback) {
    console.debug('[updateContainer]', arguments);
    const current = container.current;
    const eventTime = requestEventTime();

    const update = createUpdate({
        element: element
    }, eventTime);

    enqueueUpdate(current, update);
    scheduleUpdateOnLeaf(current, eventTime);

    return true;
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

function isValidContainer(node) {
    return !!(node && (node.nodeType == ELEMENT_NODE || node.nodeType == DOCUMENT_NODE));
}

function Render(element, container, callback) {
    console.debug('[Render]', arguments);
    if (!isValidContainer(container)) {
        throw Error("Target container is not a DOM element.");
    }
    return legacyRender(null, element, container, callback);
}

export { Render };