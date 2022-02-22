
var hydrationParentFiber = null;
var nextHydratableInstance = null;
var isHydrating = false;

export function popHydrationState(fiber) {

    if (fiber !== hydrationParentFiber) {
        // We're deeper than the current hydration context, inside an inserted
        // tree.
        return false;
    }

    if (!isHydrating) {
        // If we're not currently hydrating but we're in a hydration context, then
        // we were an insertion and now need to pop up reenter hydration of our
        // siblings.
        popToNextHostParent(fiber);
        isHydrating = true;
        return false;
    }

    var type = fiber.type; // If we have any remaining hydratable nodes, we need to delete them now.
    // We only do this deeper than head and body since they tend to have random
    // other nodes in them. We also ignore components with pure text content in
    // side of them.
    // TODO: Better heuristic.

    if (fiber.tag !== HostComponent || type !== 'head' && type !== 'body' && !shouldSetTextContent(type, fiber.memoizedProps)) {
        var nextInstance = nextHydratableInstance;

        while (nextInstance) {
            deleteHydratableInstance(fiber, nextInstance);
            nextInstance = getNextHydratableSibling(nextInstance);
        }
    }

    popToNextHostParent(fiber);

    if (fiber.tag === SuspenseComponent) {
        nextHydratableInstance = skipPastDehydratedSuspenseInstance(fiber);
    } else {
        nextHydratableInstance = hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null;
    }

    return true;
}