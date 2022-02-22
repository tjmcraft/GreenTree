function LeafNode(tag, pendingProps, key, mode) {
    // Instance
    this.tag = tag;
    this.key = key;
    this.elementType = null;
    this.type = null;
    this.stateNode = null;
    // Fiber
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.index = 0;
    this.ref = null;
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.memoizedState = null;
    this.updateQueue = null;
    this.mode = mode;
    // Effects
    this.alternate = null;
}

export const createLeaf = function(tag, pendingProps, key, mode) {
    return new LeafNode(tag, pendingProps, key, mode);
};