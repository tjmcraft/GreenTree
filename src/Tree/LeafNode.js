
function LeafNode(tag, pendingProps, key) {
    // Instance
    this.tag = tag; // GTR Node tag
    this.key = key; // GTR Key
    //this.elementType = null; // Element type (div, span, function, component)
    this.type = null; // Element type (div, span, function, component)
    this.stateNode = null; // HTML Element node
    // Fiber
    this.return = null; // GTR previous node
    this.child = null; // GTR Child node
    //this.sibling = null; // GTR Sibling node
    this.index = 0; // Index of current node
    this.ref = null; // GTR Reference
    this.pendingProps = pendingProps; // Pending props
    this.memoizedProps = null; // Current props
    this.memoizedState = null; // Current state
    this.updateQueue = null; // GTR Update queue
    // Effects
    this.alternate = null; // GTR Alternate node
}

export const createLeaf = function(tag, pendingProps, key) {
    return new LeafNode(tag, pendingProps, key);
};