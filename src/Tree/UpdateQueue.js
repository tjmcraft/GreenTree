export function initializeUpdateQueue(Leaf) {
    var queue = {
        baseState: Leaf.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
            pending: null
        },
        //effects: null
    };
    Leaf.updateQueue = queue;
}