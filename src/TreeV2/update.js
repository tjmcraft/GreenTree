import { NoLanes, PerformedWork, UpdateState } from "../Types";
import { mountChildLeafs, reconcileChildLeafs } from "./ChildReconciler";
import { isSubsetOfLanes, mergeLanes } from "./Lanes";

var currentlyProcessingQueue = null;
var currentProcessingQueue = null;
var hasForceUpdate = false;

function getStateFromUpdate(workInProgress, queue, update, prevState, nextProps, instance) {
    console.debug("[getStateFromUdate]", "{ARGS}", arguments);
    switch (update.tag) {
        case UpdateState:
            {
                var _payload = update.payload;
                var partialState;
                console.debug("[getStateFromUdate]", "[UpdateState]", _payload);
    
                if (typeof _payload === "function") {
                    partialState = _payload.call(instance, prevState, nextProps);
                } else {
                    partialState = _payload;
                }
    
                if (partialState === null || partialState === undefined) {
                    console.debug("Invalid state!", partialState)
                    return prevState;
                }
    
                var end = Object.assign({}, prevState, partialState);
                console.debug("[getStateFromUdate]", "[UpdateState][end]", end);
                return end;
            }
    }
    console.debug("[getStateFromUdate]", "{END}", prevState);
    return prevState;
}

function cloneUpdateQueue(current, workInProgress) {
    var queue = workInProgress.updateQueue;
    var currentQueue = current.updateQueue;

    if (queue === currentQueue) {
        var clone = {
            baseState: currentQueue.baseState,
            firstBaseUpdate: currentQueue.firstBaseUpdate,
            lastBaseUpdate: currentQueue.lastBaseUpdate,
            shared: currentQueue.shared,
            effects: currentQueue.effects,
        };
        workInProgress.updateQueue = clone;
    }
}

function processUpdateQueue(workInProgress, props, instance, renderLanes) {
    console.debug("[processUpdateQueue]", workInProgress, props, instance, renderLanes);
    var queue = workInProgress.updateQueue;

    {
        currentProcessingQueue = queue.shared;
    }

    var firstBaseUpdate = queue.firstBaseUpdate;
    var lastBaseUpdate = queue.lastBaseUpdate;

    var pendingQueue = queue.shared.pending;

    if (pendingQueue !== null) {
        queue.shared.pending = null;

        var lastPendingUpdate = pendingQueue;
        var fisrtPendingUpdate = lastPendingUpdate.next;
        lastPendingUpdate.next = null;

        if (lastBaseUpdate === null) {
            firstBaseUpdate = fisrtPendingUpdate;
        } else {
            lastBaseUpdate.next = fisrtPendingUpdate;
        }

        lastBaseUpdate = lastPendingUpdate;

        var current = workInProgress.alternate;

        if (current !== null) {
            var currentQueue = current.updateQueue;
            var currentLastBaseUpdate = currentQueue.lastBaseUpdate;

            if (currentLastBaseUpdate !== lastBaseUpdate) {
                if (currentLastBaseUpdate === null) {
                    currentQueue.firstBaseUpdate = fisrtPendingUpdate;
                } else {
                    currentLastBaseUpdate.next = fisrtPendingUpdate;
                }
                currentQueue.lastBaseUpdate = lastPendingUpdate;
            }
        }
    }
    
    if (firstBaseUpdate !== null) {
        var newState = queue.baseState;
        console.debug("[PUQ]", "{newState}[1]", newState);

        var newLanes = NoLanes;
        var newBaseState = null;
        var newFirstBaseUpdate = null;
        var newLastBaseUpdate = null;
        var update = firstBaseUpdate;

        do {
            var updateLane = update.lane;
            var updateEventTime = update.EventTime;

            if (!isSubsetOfLanes(renderLanes, updateLane)) {
                var clone = {
                    eventTime: updateEventTime,
                    lane: updateLane,
                    tag: update.tag,
                    payload: update.payload,
                    callback: update.callback,
                    next: null
                };

                if (newLastBaseUpdate === null) {
                    newFirstBaseUpdate = newLastBaseUpdate = clone;
                    newBaseState = newState;
                    console.debug("[PUQ]", "{newBaseState}[1]", newBaseState);
                } else {
                    newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }

                newLanes = mergeLanes(newLanes, updateLane);
            } else {
                console.debug("SubsetOflanes:", current);
                // This update does have sufficient priority.
                if (newLastBaseUpdate !== null) {
                    var _clone = {
                        eventTime: updateEventTime,
                        // This update is going to be committed so we never want uncommit
                        // it. Using NoLane works because 0 is a subset of all bitmasks, so
                        // this will never be skipped by the check above.
                        lane: NoLane,
                        tag: update.tag,
                        payload: update.payload,
                        callback: update.callback,
                        next: null
                    };
                    newLastBaseUpdate = newLastBaseUpdate.next = _clone;
                } // Process this update.

                newState = getStateFromUpdate(workInProgress, queue, update, newState, props, instance);
                console.debug("[PUQ]", "{newState}[2]", newState);
            }

            update = update.next;

            if (update === null) {
                pendingQueue = queue.shared.pending;

                if (pendingQueue === null) {
                    break;
                } else {
                    var _lastPendingUpdate = pendingQueue;

                    var _firstPendingUpdate = _lastPendingUpdate.next;
                    _lastPendingUpdate.next = null;
                    update = _firstPendingUpdate;
                    queue.lastBaseUpdate = _lastPendingUpdate;
                    queue.shared.pending = null;
                }
            }
        } while (true);

        if (newLastBaseUpdate === null) {
            newBaseState = newState;
            console.debug("[PUQ]", "{newBaseState}[2]", newBaseState);
        }

        queue.baseState = newBaseState;
        console.debug("[PUQ]", "{newBaseState}[3]", newBaseState);
        queue.firstBaseUpdate = newFirstBaseUpdate;
        queue.lastBaseUpdate = newLastBaseUpdate;

        workInProgress.lanes = newLanes;
        workInProgress.memoizedState = newState;
        console.debug("[PUQ]", "{WIP}", workInProgress);

        {
            currentProcessingQueue = null;
        }
    }
}

function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
    console.debug("[reconcileChildren]", arguments);
    if (current === null) {
        workInProgress.child = mountChildLeafs(workInProgress, null, nextChildren, renderLanes);
        console.debug("[reconcileChildren]", "Fresh Child:", workInProgress.child);
    } else {
        workInProgress.child = reconcileChildLeafs(workInProgress, current.child, nextChildren, renderLanes);
        console.debug("[reconcileChildren]", "WIP Child:", workInProgress.child);
    }
}

export function updateHostRoot(current, workInProgress, renderLanes) {
    console.debug("[updateHostRoot]", current, workInProgress, renderLanes);
    var updateQueue = workInProgress.updateQueue;

    if (!(current !== null && updateQueue !== null)) {
        throw new Error("Root is already bailed out!");
    }

    var nextProps = workInProgress.pendingProps;
    var prevState = workInProgress.memoizedState;
    var prevChildren = prevState !== null ? prevState.element : null;
    cloneUpdateQueue(current, workInProgress);
    processUpdateQueue(workInProgress, nextProps, null, renderLanes);
    console.debug("[UHS]", "{WIP}", workInProgress);
    var nextState = workInProgress.memoizedState;
    console.debug("[UHS]", "nextState", nextState);

    var nextChildren = nextState.element;

    var root = workInProgress.stateNode;

    reconcileChildren(current, workInProgress, nextChildren, renderLanes);

    return workInProgress.child;
}

function shouldSetTextContent(type, props) {
    return (
        type === 'textarea' ||
        type === 'option' ||
        type === 'noscript' ||
        typeof props.children === 'string' ||
        typeof props.children === 'number' ||
        typeof props.dangerouslySetInnerHTML === 'object' &&
        props.dangerouslySetInnerHTML !== null &&
        props.dangerouslySetInnerHTML.__html != null
    );
}

export function updateHostComponent(current, workInProgress, renderLanes) {
    console.log("[updateHostComponent]", arguments);
    var type = workInProgress.type;
    var nextProps = workInProgress.pendingProps;
    var prevProps = current !== null ? current.memoizedProps : null;
    var nextChildren = nextProps.children;
    var isDirectTextChild = shouldSetTextContent(type, nextProps);

    if (isDirectTextChild) {
        nextChildren = null;
    } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
        workInProgress.flags |= ContentReset;
    }

    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}

export function updateHostText(current, workInProgress) {
    console.debug("[updateHostText]", arguments);
    if (current === null) {

    }

    return null;
}

export function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {
    {
        if (workInProgress.type !== workInProgress.elementType) {
            // Lazy component props can't be validated in createElement
            // because they're only guaranteed to be resolved here.
            var innerPropTypes = Component.propTypes;

            if (innerPropTypes) {
                checkPropTypes(innerPropTypes, nextProps, // Resolved props
                    'prop', getComponentName(Component));
            }
        }
    }

    var context;

    var nextChildren;

    {
        nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, context, renderLanes);

        if (workInProgress.mode & StrictMode) {
            disableLogs();

            try {
                nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, context, renderLanes);
            } finally {
                reenableLogs();
            }
        }
    }

    workInProgress.flags |= PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
}

export function updateClassComponent(current, workInProgress, Component, nextProps, renderLanes) {
    {
        if (workInProgress.type !== workInProgress.elementType) {
            // Lazy component props can't be validated in createElement
            // because they're only guaranteed to be resolved here.
            var innerPropTypes = Component.propTypes;

            if (innerPropTypes) {
                checkPropTypes(innerPropTypes, nextProps, // Resolved props
                    'prop', getComponentName(Component));
            }
        }
    } // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.


    var hasContext;

    if (isContextProvider(Component)) {
        hasContext = true;
        pushContextProvider(workInProgress);
    } else {
        hasContext = false;
    }

    prepareToReadContext(workInProgress, renderLanes);
    var instance = workInProgress.stateNode;
    var shouldUpdate;

    if (instance === null) {
        if (current !== null) {
            // A class component without an instance only mounts if it suspended
            // inside a non-concurrent tree, in an inconsistent state. We want to
            // treat it like a new mount, even though an empty version of it already
            // committed. Disconnect the alternate pointers.
            current.alternate = null;
            workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

            workInProgress.flags |= Placement;
        } // In the initial pass we might need to construct the instance.


        constructClassInstance(workInProgress, Component, nextProps);
        mountClassInstance(workInProgress, Component, nextProps, renderLanes);
        shouldUpdate = true;
    } else if (current === null) {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(workInProgress, Component, nextProps, renderLanes);
    } else {
        shouldUpdate = updateClassInstance(current, workInProgress, Component, nextProps, renderLanes);
    }

    var nextUnitOfWork = finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderLanes);

    {
        var inst = workInProgress.stateNode;

        if (shouldUpdate && inst.props !== nextProps) {
            if (!didWarnAboutReassigningProps) {
                error('It looks like %s is reassigning its own `this.props` while rendering. ' + 'This is not supported and can lead to confusing bugs.', getComponentName(workInProgress.type) || 'a component');
            }

            didWarnAboutReassigningProps = true;
        }
    }

    return nextUnitOfWork;
}