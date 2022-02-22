import { NoLanes, NoMode, ProfileMode } from "../Types";

export function isSubsetOfLanes(set, subset) {
    return (set & subset) === subset;
}

export function mergeLanes(a, b) {
    return a | b;
}

export function removeLanes(set, subset) {
    return set & ~subset;
} // Seems redundant, but it changes the type from a single lane (used for
// updates) to a group of lanes (used for flushing work).

export function laneToLanes(lane) {
    return lane;
}

export function getNextLanes(root, wipLanes) {
    var pendingLanes = root.pendingLanes;

    if (pendingLanes === NoLanes) {
        return NoLanes;
    }

    var nextLanes = 1;
    var expiredLanes = root.expiredLanes;
    var suspendedLanes = root.suspendedLanes;
    var pingedLanes = root.pingedLanes;

    return nextLanes;
}

export function resetChildLanes(completedWork) {

    var newChildLanes = NoLanes; // Bubble up the earliest expiration time.

    if ((completedWork.mode & ProfileMode) !== NoMode) {
        // In profiling mode, resetChildExpirationTime is also used to reset
        // profiler durations.
        var actualDuration = completedWork.actualDuration;
        var treeBaseDuration = completedWork.selfBaseDuration; // When a fiber is cloned, its actualDuration is reset to 0. This value will
        // only be updated if work is done on the fiber (i.e. it doesn't bailout).
        // When work is done, it should bubble to the parent's actualDuration. If
        // the fiber has not been cloned though, (meaning no work was done), then
        // this value will reflect the amount of time spent working on a previous
        // render. In that case it should not bubble. We determine whether it was
        // cloned by comparing the child pointer.

        var shouldBubbleActualDurations = completedWork.alternate === null || completedWork.child !== completedWork.alternate.child;
        var child = completedWork.child;

        while (child !== null) {
            newChildLanes = mergeLanes(newChildLanes, mergeLanes(child.lanes, child.childLanes));

            if (shouldBubbleActualDurations) {
                actualDuration += child.actualDuration;
            }

            treeBaseDuration += child.treeBaseDuration;
            child = child.sibling;
        }

        var isTimedOutSuspense = completedWork.tag === SuspenseComponent && completedWork.memoizedState !== null;

        if (isTimedOutSuspense) {
            // Don't count time spent in a timed out Suspense subtree as part of the base duration.
            var primaryChildFragment = completedWork.child;

            if (primaryChildFragment !== null) {
                treeBaseDuration -= primaryChildFragment.treeBaseDuration;
            }
        }

        completedWork.actualDuration = actualDuration;
        completedWork.treeBaseDuration = treeBaseDuration;
    } else {
        var _child = completedWork.child;

        while (_child !== null) {
            newChildLanes = mergeLanes(newChildLanes, mergeLanes(_child.lanes, _child.childLanes));
            _child = _child.sibling;
        }
    }

    completedWork.childLanes = newChildLanes;
}
