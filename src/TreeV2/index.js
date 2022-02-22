import { shouldConstruct$1 } from "./Helpers";

const { GREEN_ELEMENT_TYPE, RESERVED_PROPS, ELEMENT_NODE, GREEN_TREE_TYPE, HostRoot, IndeterminateComponent, FunctionComponent, ClassComponent, HostComponent, NoLanes, UpdateState, HostText, NoFlags, Incomplete, PerformedWork, NoMode, HostEffectMask, RootFatalErrored, RootIncomplete, RootComplete, ProfileMode, Snapshot, Placement, ContentReset, Update, Deletion, COMMENT_NODE } = require("../Types");
const { legacyCreateRootContainerFromDOM } = require("./LegacyRoot");
const { createLeaf, createLeafNodeFromTypeAndProps } = require("./Leaf");
const { updateHostRoot, updateHostComponent, updateHostText, updateFunctionComponent } = require("./update");
const { getNextLanes, resetChildLanes, mergeLanes } = require("./Lanes");
const { createInstance, appendAllChildren, finalizeInitialChildren, updateHostContainer, markRootFinished, createTextInstance } = require("./DOM");
const { pushHostRootContext, getRootHostContainer, getHostContext, popHostContainer, popHostContext } = require("./Context");
const { popHydrationState } = require("./Hydratation");

var LoopSyncExitStatus = null;
var workInProgress = null;
var workInProgressRoot = null;
var workInProgressRootExitStatus = null;
var workInProgressRootRenderLanes = NoLanes;
var subtreeRenderLanes = NoLanes;
var nextEffect = null;
var current = null;

var emptyContextObject = {}; {
    Object.freeze(emptyContextObject);
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

function setProps(element, props) { // Set props to element
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

function isMounted(component) { // Check if the component is mounted
    return false;
}

var classComponentUpdater = { // default class component updater
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

function enqueueUpdate(Leaf, update) {
    console.debug('[enqueueUpdate]', Leaf);
    var updateQueue = Leaf.updateQueue;

    if (updateQueue === null) { // Only occurs if the fiber has been unmounted.
        return;
    }

    var sharedQueue = updateQueue.shared;
    var pending = sharedQueue.pending;

    if (pending === null) {
        update.next = update; // This is the first update. Create a circular list.
    } else {
        update.next = pending.next;
        pending.next = update;
    }

    sharedQueue.pending = update;
}

function markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
    // Update the source fiber's lanes
    sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
    var alternate = sourceFiber.alternate;

    if (alternate !== null) {
        alternate.lanes = mergeLanes(alternate.lanes, lane);
    }

    {
        if (alternate === null && (sourceFiber.flags & (Placement)) !== NoFlags) {
            warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
        }
    } // Walk the parent path to the root and update the child expiration time.


    var node = sourceFiber;
    var parent = sourceFiber.return;

    while (parent !== null) {
        parent.childLanes = mergeLanes(parent.childLanes, lane);
        alternate = parent.alternate;

        if (alternate !== null) {
            alternate.childLanes = mergeLanes(alternate.childLanes, lane);
        } else {
            {
                if ((parent.flags & (Placement)) !== NoFlags) {
                    warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
                }
            }
        }

        node = parent;
        parent = parent.return;
    }

    if (node.tag === HostRoot) {
        var root = node.stateNode;
        return root;
    } else {
        return null;
    }
}

function markRootUpdated(root, updateLane, eventTime) {
    root.pendingLanes |= updateLane; // TODO: Theoretically, any update to any lane can unblock any other lane. But
    // it's not practical to try every single possible combination. We need a
    // heuristic to decide which lanes to attempt to render, and in which batches.
    // For now, we use the same heuristic as in the old ExpirationTimes model:
    // retry any lane at equal or lower priority, but don't try updates at higher
    // priority without also including the lower priority updates. This works well
    // when considering updates across different priority levels, but isn't
    // sufficient for updates within the same priority, since we want to treat
    // those updates as parallel.
    // Unsuspend any update at equal or lower priority.

    var higherPriorityLanes = updateLane - 1; // Turns 0b1000 into 0b0111

    root.suspendedLanes &= higherPriorityLanes;
    root.pingedLanes &= higherPriorityLanes;
    var eventTimes = root.eventTimes;
    //var index = laneToIndex(updateLane); // We can always overwrite an existing timestamp because we prefer the most
    // recent event, and we assume time is monotonically increasing.

    //eventTimes[index] = eventTime;
}

function scheduleUpdateOnLeaf(Leaf, lane, eventTime) {
    var root = markUpdateLaneFromFiberToRoot(Leaf, lane);

    markRootUpdated(root, lane, eventTime);

    performSyncWorkOnRoot(root);
}

function performSyncWorkOnRoot(root) {

    var lanes;
    var exitStatus;

    lanes = getNextLanes(root, NoLanes);
    exitStatus = renderRootSync(root, lanes);

    var finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    root.finishedLanes = lanes;

    commitRoot(root);

    return null;
}

function createWorkInProgress(current, pendingProps) {
    var workInProgress = current.alternate;
    console.debug("[createWorkInProgress]", "{current}", current);
    if (workInProgress === null) {
        console.debug("WorkInProgress is null!");
        workInProgress = createLeaf(current.tag, pendingProps, current.key, current.mode);
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
        workInProgress.flags = null;
    }

    workInProgress.lanes = current.lanes;
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;

    workInProgress.index = current.index;
    workInProgress.ref = current.ref;

    return workInProgress;
}

function prepareFreshStack(root, lanes) {
    console.debug("Preparing fresh stack for:", root);
    root.finishedWork = null;
    root.finishedLanes = null;
    var timeoutHandle = root.timeoutHandle;

    if (workInProgress !== null) {
        return;
    }

    workInProgressRoot = root;
    workInProgress = createWorkInProgress(root.current, null);
    workInProgressRootRenderLanes = subtreeRenderLanes = lanes;
}

function renderRootSync(root, lanes) {

    if (workInProgressRoot !== root) {
        prepareFreshStack(root, lanes);
    }

    do {
        try {
            workLoopSync();
            break;
        } catch (e) {
            //console.error(e);
            workInProgressRootExitStatus = RootFatalErrored;
            throw e;
        }
    } while (true);

    if (workInProgress !== null) {
        throw new Error("WorkInProgress already not completed! Cannot push a incomplete root!");
    }

    workInProgressRoot = null;

    return workInProgressRootExitStatus;
}

function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

function performUnitOfWork(unitOfWork) {
    var current = unitOfWork.alternate;
    var next;

    if ((unitOfWork.mode & ProfileMode) !== NoMode) {
        //start profiler
        next = beginWork(current, unitOfWork, subtreeRenderLanes);
    } else {
        next = beginWork(current, unitOfWork, subtreeRenderLanes);
    }

    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if (next === null) {
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
}

function completeUnitOfWork(unitOfWork) {

    var completedWork = unitOfWork;
    console.debug('Completed unitOfWork: ', completedWork);

    do {

        var current = completedWork.alternate;
        var returnLeaf = completedWork.return;

        if ((completedWork.flags & Incomplete) === NoFlags) {
            var next = void 0;

            if (completedWork.mode === NoMode) {
                next = completeWork(current, completedWork, subtreeRenderLanes);
            } else {
                // start profiler
                next = completeWork(current, completedWork, subtreeRenderLanes);
            }

            if (next !== null) {
                workInProgress = next;
                return;
            }

            resetChildLanes(completedWork);

            if (returnLeaf !== null && // Do not append effects to parents if a sibling failed to complete
                (returnLeaf.flags & Incomplete) === NoFlags) {
                // Append all the effects of the subtree and this fiber onto the effect
                // list of the parent. The completion order of the children affects the
                // side-effect order.
                if (returnLeaf.firstEffect === null) {
                    returnLeaf.firstEffect = completedWork.firstEffect;
                }

                if (completedWork.lastEffect !== null) {
                    if (returnLeaf.lastEffect !== null) {
                        returnLeaf.lastEffect.nextEffect = completedWork.firstEffect;
                    }

                    returnLeaf.lastEffect = completedWork.lastEffect;
                } // If this fiber had side-effects, we append it AFTER the children's
                // side-effects. We can perform certain side-effects earlier if needed,
                // by doing multiple passes over the effect list. We don't want to
                // schedule our own side-effect on our own list because if end up
                // reusing children we'll schedule this effect onto itself since we're
                // at the end.


                var flags = completedWork.flags; // Skip both NoWork and PerformedWork tags when creating the effect
                // list. PerformedWork effect is read by React DevTools but shouldn't be
                // committed.

                if (flags > PerformedWork) {
                    if (returnLeaf.lastEffect !== null) {
                        returnLeaf.lastEffect.nextEffect = completedWork;
                    } else {
                        returnLeaf.firstEffect = completedWork;
                    }

                    returnLeaf.lastEffect = completedWork;
                }
            }

        } else {
            var _next = unwindWork(completedWork);

            if (_next !== null) {
                _next.flags &= HostEffectMask;
                workInProgress = _next;
                return;
            }

            if ((completedWork.mode & ProfileMode) !== NoMode) {
                var actualDuration = completedWork.actualDuration;
                var child = completedWork.child;

                while (child !== null) {
                    actualDuration += child.actualDuration;
                    child = child.sibling;
                }

                completedWork.actualDuration = actualDuration;
            }

            if (returnLeaf !== null) {
                returnLeaf.firstEffect = returnLeaf.lastEffect = null;
                returnLeaf.flags |= Incomplete;
            }
        }

        var siblingFiber = completedWork.sibling;

        if (siblingFiber !== null) {
            // If there is more work to do in this returnLeaf, do that next.
            workInProgress = siblingFiber;
            return;
        } // Otherwise, return to the parent

        completedWork = returnLeaf;

        workInProgress = completedWork;

    } while (completedWork !== null);

    if (workInProgressRootExitStatus === RootIncomplete) {
        workInProgressRootExitStatus = RootComplete;
    }
}

function completeWork(current, workInProgress, renderLanes) {
    console.debug("[completeWork]", arguments);
    var newProps = workInProgress.pendingProps;
    console.debug("[CW][newProps]", newProps);

    switch (workInProgress.tag) {
        case IndeterminateComponent:
        case FunctionComponent:
            return null;
        case ClassComponent:
            {
                var component = workInProgress.type;
                return null;
            }
        case HostRoot:
            {
                popHostContainer(workInProgress);
                var leafRoot = workInProgress.stateNode;

                console.debug("[CW][HostRoot]", "{root}", leafRoot);

                if (leafRoot.pendingContext) {
                    leafRoot.context = leafRoot.pendingContext;
                    leafRoot.pendingContext = null;
                }

                if (current === null || current.child === null) {
                    // If we hydrated, pop so that we can delete any remaining children
                    // that weren't hydrated.
                    var wasHydrated = popHydrationState(workInProgress);

                    if (wasHydrated) {
                        // If we hydrated, then we'll need to schedule an update for
                        // the commit side-effects on the root.
                        markUpdate(workInProgress);
                    } else if (!leafRoot.hydrate) {
                        // Schedule an effect to clear this container at the start of the next commit.
                        // This handles the case of React rendering into a container with previous children.
                        // It's also safe to do for updates too, because current.child would only be null
                        // if the previous render was null (so the the container would already be empty).
                        workInProgress.flags |= Snapshot;
                    }
                }

                updateHostContainer(workInProgress);
                return null;
            }

        case HostComponent:
            {
                popHostContext(workInProgress);
                var rootContainerInstance = getRootHostContainer();
                var type = workInProgress.type;

                console.debug("[CW][rootContainerInstance]", rootContainerInstance);

                if (current !== null && workInProgress.stateNode != null) {
                    updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);

                    if (current.ref !== workInProgress.ref) {
                        markRef$1(workInProgress);
                    }
                } else {
                    if (!newProps) {
                        if (!(workInProgress.stateNode !== null)) {
                            {
                                throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
                            }
                        } // This can happen when we abort work.

                        return null;
                    }

                    var currentHostContext = getHostContext();

                    console.debug("[CW][currentHostContext]", currentHostContext);

                    {
                        var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress);
                        appendAllChildren(instance, workInProgress, false, false);
                        workInProgress.stateNode = instance; // Certain renderers require commit-time effects for initial mount.
                        // (eg DOM renderer supports auto-focus for certain elements).
                        // Make sure such renderers get scheduled for later work.
                        console.debug("[CW][HostComponent]", workInProgress);
                        if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance)) {
                            markUpdate(workInProgress);
                        }
                    }

                    if (workInProgress.ref !== null) {
                        // If there is a ref on a host node we need to schedule a callback
                        markRef$1(workInProgress);
                    }
                }

                return null;
            }


        case HostText:
            {
                var newText = newProps;

                if (current && workInProgress.stateNode != null) {
                    var oldText = current.memoizedProps; // If we have an alternate, that means this is an update and we need
                    // to schedule a side-effect to do the updates.

                    updateHostText$1(current, workInProgress, oldText, newText);
                } else {
                    if (typeof newText !== 'string') {
                        if (!(workInProgress.stateNode !== null)) {
                            {
                                throw Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
                            }
                        } // This can happen when we abort work.

                    }

                    var _rootContainerInstance = getRootHostContainer();

                    var _currentHostContext = getHostContext();

                    var _wasHydrated2 = popHydrationState(workInProgress);

                    if (_wasHydrated2) {
                        if (prepareToHydrateHostTextInstance(workInProgress)) {
                            markUpdate(workInProgress);
                        }
                    } else {
                        workInProgress.stateNode = createTextInstance(newText, _rootContainerInstance, _currentHostContext, workInProgress);
                    }
                }

                return null;
            }

    }

    {
        throw new Error("Unknown unit of work tag!" + `(${workInProgress.tag})`);
    }
}

function beginWork(current, workInProgress, renderLanes) {
    console.debug("[beginWork]", current, workInProgress, renderLanes);

    var updateLanes = workInProgress.lanes;

    if (current !== null) {
        var oldProps = current.memoizedProps;
        var newProps = workInProgress.pendingProps;

        switch (workInProgress.tag) {
            case HostRoot:
                pushHostRootContext(workInProgress);
        }
    }

    workInProgress.lanes = NoLanes;

    switch (workInProgress.tag) {
        case IndeterminateComponent:
            {
                return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
            }

        case FunctionComponent:
            {
                var _Component = workInProgress.type;
                var unresolvedProps = workInProgress.pendingProps;
                var resolvedProps = workInProgress.elementType === _Component ? unresolvedProps : resolveDefaultProps(_Component, unresolvedProps);
                return updateFunctionComponent(current, workInProgress, _Component, resolvedProps, renderLanes);
            }

        case ClassComponent:
            {
                return null;
            }

        case HostRoot:
            return updateHostRoot(current, workInProgress, renderLanes);

        case HostComponent:
            return updateHostComponent(current, workInProgress, renderLanes);

        case HostText:
            return updateHostText(current, workInProgress);
    }
    {
        throw new Error("Unknown unit of work tag!" + `(${workInProgress.tag})`);
    }
}

function getPublicRootInstance(container) { // Get public root instance
    var containerGreen = container.current;

    if (!containerGreen.child) {
        return null; // Return null if no child
    }

    switch (containerGreen.child.tag) {
        default: return containerGreen.child.stateNode; // Return stateNode of child element
    }
}

function requestUpdateLane(Leaf) { // Request lane unbatched update
    var lane = 1;
    return lane; // Lane instance
}

/**
 * Request Event Time
 * @returns Current Time Event
 */
function requestEventTime() {
    return new Date() // Get current time
}

function createUpdate(lane, eventTime) {
    return Object.assign({}, {
        lane: lane,
        eventTime: eventTime,
        tag: UpdateState,
        payload: null,
        callback: null,
        next: null,
    });
}

/**
 * Update VDOM tree
 * @param {*} element - Element Component that we need to render
 * @param {*} container - Contaner that will be used to
 * @param {*} parentComponent - Parent Component (used for context)
 * @param {*} callback - Basic JS Sync Callback
 * @returns lane (ns now)
 */
function updateContainer(element, container, parentComponent, callback) { // Update element in container
    var current$1 = container.current;
    var eventTime = requestEventTime();
    //var created = null;

    var lane = requestUpdateLane(current$1);

    var update = createUpdate(lane, eventTime);
    update.payload = { element: element };

    /*callback = callback === undefined ? null : callback;
    if (callback !== null) {
        if (typeof callback !== 'function') {
            console.error('Callback is not type of function!');
            return false;
        }
        update.callback = callback;
    }*/

    enqueueUpdate(current$1, update);
    scheduleUpdateOnLeaf(current$1, lane, eventTime);

    return lane;

    if (typeof element === "object") {
        if (element.$$typeof == GREEN_ELEMENT_TYPE) {

            console.debug("GreenElementUpdate:", element); // Debug component itself
            console.debug("GreenContainer:", current$1) // Debug current container

            if (typeof element.type === "string") { // Check if element has string type
                const props = Object.seal(element.props); // Seal component properties
                const dom_element = document.createElement(element.type); // Create DOM element instance
                if (props) { // If we have props -> we need to set them to the element
                    console.debug("GreenProps:", props); // Debug current props
                    setProps(dom_element, props); // Set basic properties to DOM element
                    if (props.children != null && props.children.length != 0) {
                        if (Array.isArray(props.children)) { // If we have multiple childrens

                        } else { // If we have one children

                        }
                    }
                    if (Array.isArray(props.children)) {
                        const root_c = props.children.map(child => updateElement(child, null, element, null));
                        for (const child of root_c) {
                            if (child && child != null)
                                if (!props.unsafeHTML) dom_element.append(child);
                                else dom_element.innerHTML += child;
                        }
                    } else if (props.children && props.children != null) {
                        if (!props.unsafeHTML) dom_element.append(props.children);
                        else dom_element.innerHTML += props.children;
                    }
                }
                //console.debug("string comp:", dom_element);
                element._gtrInternals = {
                    type: element.type,
                    stateNode: dom_element,
                };
                var child = createLeafNodeFromTypeAndProps(element.type, props);
                child.stateNode = dom_element;
                current$1.child = child;
                //return dom_element;
            } else if (typeof element.type === "function") { // Functional type
                if (isSimpleFunctionComponent(element.type)) {
                    //console.warn("Simple Function Component:", element);
                    const root_a = element.type.call(this, element.props);
                    const c = updateElement(root_a, null, null);
                    //console.debug("function comp:", c);
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
                    //console.debug("cls comp:", c);
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

export function commitRoot(root) {
    commitRootImpl(root);
    return null;
}

function commitRootImpl(root) {
    var finishedWork = root.finishedWork;
    var lanes = root.finishedLanes;

    if (finishedWork === null) {
        return null;
    }

    root.finishedWork = null;
    root.finishedLanes = NoLanes;

    if (!(finishedWork !== root.current)) {
        {
            throw Error("Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue.");
        }
    } // commitRoot never returns a continuation; it always finishes synchronously.
    // So we can clear these now to allow a new callback to be scheduled.


    root.callbackNode = null; // Update the first and last pending times on this root. The new first
    // pending time is whatever is left on the root fiber.

    var remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
    markRootFinished(root, remainingLanes); // Clear already finished discrete updates in case that a later call of
    // `flushDiscreteUpdates` starts a useless render pass which may cancels
    // a scheduled timeout.

    if (root === workInProgressRoot) {
        // We can reset these now that they are finished.
        workInProgressRoot = null;
        workInProgress = null;
        workInProgressRootRenderLanes = NoLanes;
    } // Get the list of effects.


    var firstEffect;

    if (finishedWork.flags > PerformedWork) {
        // A fiber's effect list consists only of its children, not itself. So if
        // the root has an effect, we need to add it to the end of the list. The
        // resulting list is the set that would belong to the root's parent, if it
        // had one; that is, all the effects in the tree including the root.
        if (finishedWork.lastEffect !== null) {
            finishedWork.lastEffect.nextEffect = finishedWork;
            firstEffect = finishedWork.firstEffect;
        } else {
            firstEffect = finishedWork;
        }
    } else {
        // There is no effect on the root.
        firstEffect = finishedWork.firstEffect;
    }

    if (firstEffect !== null) {

        nextEffect = firstEffect;

        root.current = finishedWork; // The next phase is the layout phase, where we call effects that read
        // the host tree after it's been mutated. The idiomatic use case for this is
        // layout, but class component lifecycles also fire here for legacy reasons.

        nextEffect = firstEffect;

        do {
            {
                commitMutationEffects(root);
            }
        } while (nextEffect !== null);

        nextEffect = null; // Tell Scheduler to yield at the end of the frame, so the browser has an
        // opportunity to paint.
    } else {
        // No effects.
        root.current = finishedWork; // Measure these anyway so the flamegraph explicitly shows that there were
        // no effects.
        // TODO: Maybe there's a better way to report this.

    }
    return null;
}

function commitMutationEffects(root) {
    while (nextEffect !== null) {
        var flags = nextEffect.flags;

        console.debug("[commitMutationEffects]", "{flags}", flags);

        if (flags & ContentReset) {
            commitResetTextContent(nextEffect);
        }

        var primaryFlags = flags & (Placement | Update | Deletion);

        console.debug("[commitMutationEffects]", "{primaryFlags}", primaryFlags);

        switch (primaryFlags) {
            case Placement:
                {
                    commitPlacement(nextEffect);
                    nextEffect.flags &= ~Placement;
                    console.debug("[commitMutationEffects]", "{removeFlag}", nextEffect.flags);
                    break;
                }

            default:
                break;
        }
    
        nextEffect = nextEffect.nextEffect;
        //nextEffect = null;
    }
}

function getHostParentFiber(fiber) {
    var parent = fiber.return;

    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }

        parent = parent.return;
    }

    {
        {
            throw Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
        }
    }
}

function isHostParent(fiber) {
    return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function getHostSibling(fiber) {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    // TODO: Find a more efficient way to do this.
    var node = fiber;

    siblings: while (true) {
        // If we didn't find anything, let's try the next sibling.
        while (node.sibling === null) {
            if (node.return === null || isHostParent(node.return)) {
                // If we pop out of the root or hit the parent the fiber we are the
                // last sibling.
                return null;
            }

            node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;

        while (node.tag !== HostComponent && node.tag !== HostText && node.tag !== DehydratedFragment) {
            // If it is not host node and, we might have a host node inside it.
            // Try to search down until we find one.
            if (node.flags & Placement) {
                // If we don't have a child, try the siblings instead.
                continue siblings;
            } // If we don't have a child, try the siblings instead.
            // We also skip portals because they are not part of this host tree.


            if (node.child === null) {
                continue siblings;
            } else {
                node.child.return = node;
                node = node.child;
            }
        } // Check if this host node is stable or about to be placed.


        if (!(node.flags & Placement)) {
            // Found it!
            return node.stateNode;
        }
    }
}

function commitPlacement(finishedWork) {
    var parentFiber = getHostParentFiber(finishedWork); // Note: these two variables *must* always be updated together.

    var parent;
    var isContainer;
    var parentStateNode = parentFiber.stateNode;

    switch (parentFiber.tag) {
        case HostComponent:
            parent = parentStateNode;
            isContainer = false;
            break;

        case HostRoot:
            parent = parentStateNode.containerInfo;
            isContainer = true;
            break;

        case FundamentalComponent:

        // eslint-disable-next-line-no-fallthrough

        default:
            {
                {
                    throw Error("Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.");
                }
            }

    }

    if (parentFiber.flags & ContentReset) {
        // Reset the text content of the parent before doing any insertions
        resetTextContent(parent); // Clear ContentReset from the effect tag

        parentFiber.flags &= ~ContentReset;
    }

    var before = getHostSibling(finishedWork); // We only have the top Fiber that was inserted but we need to recurse down its
    // children to find all the terminal nodes.

    if (isContainer) {
        insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
    } else {
        insertOrAppendPlacementNode(finishedWork, before, parent);
    }
}

function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === HostComponent || tag === HostText;

    if (isHost || enableFundamentalAPI) {
        var stateNode = isHost ? node.stateNode : node.stateNode.instance;

        if (before) {
            insertInContainerBefore(parent, stateNode, before);
        } else {
            appendChildToContainer(parent, stateNode);
        }
    } else {
        var child = node.child;

        if (child !== null) {
            insertOrAppendPlacementNodeIntoContainer(child, before, parent);
            var sibling = child.sibling;

            while (sibling !== null) {
                insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
}

function insertOrAppendPlacementNode(node, before, parent) {
    var tag = node.tag;
    var isHost = tag === HostComponent || tag === HostText;

    if (isHost || enableFundamentalAPI) {
        var stateNode = isHost ? node.stateNode : node.stateNode.instance;

        if (before) {
            insertBefore(parent, stateNode, before);
        } else {
            appendChild(parent, stateNode);
        }
    } else {
        var child = node.child;

        if (child !== null) {
            insertOrAppendPlacementNode(child, before, parent);
            var sibling = child.sibling;

            while (sibling !== null) {
                insertOrAppendPlacementNode(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
}

function resetTextContent(domElement) {
    setTextContent(domElement, '');
}

function commitTextUpdate(textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
}

function appendChild(parentInstance, child) {
    parentInstance.appendChild(child);
}

function appendChildToContainer(container, child) {
    var parentNode;

    if (container.nodeType === COMMENT_NODE) {
        parentNode = container.parentNode;
        parentNode.insertBefore(child, container);
    } else {
        parentNode = container;
        parentNode.appendChild(child);
    } // This container might be used for a portal.
    // If something inside a portal is clicked, that click should bubble
    // through the React tree. However, on Mobile Safari the click would
    // never bubble through the *DOM* tree unless an ancestor with onclick
    // event exists. So we wouldn't see it and dispatch it.
    // This is why we ensure that non React root containers have inline onclick
    // defined.
    // https://github.com/facebook/react/issues/11918


    var reactRootContainer = container._greentreeRootContainer;

    if ((reactRootContainer === null || reactRootContainer === undefined) && parentNode.onclick === null) {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        trapClickOnNonInteractiveElement(parentNode);
    }
}

function insertBefore(parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
}

function insertInContainerBefore(container, child, beforeChild) {
    if (container.nodeType === COMMENT_NODE) {
        container.parentNode.insertBefore(child, beforeChild);
    } else {
        container.insertBefore(child, beforeChild);
    }
}

function removeChild(parentInstance, child) {
    parentInstance.removeChild(child);
}

function removeChildFromContainer(container, child) {
    if (container.nodeType === COMMENT_NODE) {
        container.parentNode.removeChild(child);
    } else {
        container.removeChild(child);
    }
}

/**
 * Legacy Render
 * @param {*} parentComponent - parent component
 * @param {*} children - current component
 * @param {Node} container - render container
 * @param {Function} callback - callback function
 * @returns 
 */
function legacyRender(parentComponent, children, container, callback) { // Legacy render component to container
    var root = container._greentreeRootContainer;
    var LeafRoot;
    if (!root) {
        root = container._greentreeRootContainer = legacyCreateRootContainerFromDOM(container, false); // Initial create root container
        LeafRoot = root._internalRoot;
        //console.debug("Leaf_root | value:", LeafRoot);
        updateContainer(children, LeafRoot, parentComponent, callback);
    } else {
        LeafRoot = root._internalRoot;
        updateContainer(children, LeafRoot, parentComponent, callback);
    }
    //console.debug("Leaf_root | value:", LeafRoot);
    window.LeafRootContainer = LeafRoot;
    return getPublicRootInstance(LeafRoot);
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
        throw new Error("Element is not a GreenElement!");
    }
    if (container.nodeType !== ELEMENT_NODE && !container.tagName) {
        throw new Error("Container is not a node element!");
    }
    const root$1 = legacyRender(null, element, container, callback);
    //container.append(root$1);
    //console.log("Root:", root$1);
    //window.root$1 = root$1;
    return root$1;
}

export { Render };