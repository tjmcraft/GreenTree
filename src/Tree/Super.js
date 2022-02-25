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

    this.nextEffect = null;
    this.firstEffect = null;
    this.lastEffect = null;
    this.alternate = null;
}

export const createSuper = function (tag, pendingProps, key, mode) {
   return new SuperNode(tag, pendingProps, key, mode);
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