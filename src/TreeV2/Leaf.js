import { ClassComponent, FunctionComponent, HostComponent, HostText, IndeterminateComponent } from "../Types";
import { shouldConstruct$1 } from "./Helpers";

function LeafNode(tag, pendingProps, key, mode) {
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

export const createLeaf = function(tag, pendingProps, key, mode) {
    return new LeafNode(tag, pendingProps, key, mode);
};

export function createLeafNodeFromTypeAndProps(type, props, key, mode, lanes) {
    var LeafTag = IndeterminateComponent;
    if (typeof type === 'function') {
        if (shouldConstruct$1(type)) {
            LeafTag = ClassComponent;
        } else {
            LeafTag = FunctionComponent;
        }
    } else if (typeof type === 'string') {
        LeafTag = HostComponent;
    } else {
        LeafTag = -1;
    }
    var Leaf = createLeaf(LeafTag, props, null, null);
    Leaf.elementType = type;
    Leaf.type = type;
    return Leaf;
}

function createLeafNode(element) {
    var type = element.type;
    var pendingProps = element.props;
    var LeafNode = createLeafNodeFromTypeAndProps(type, pendingProps);
    return LeafNode;
}

export function createLeafFromElement(element, mode, lanes) {
    var type = element.type;
    var key = element.key;
    var pendingProps = element.props;
    var LeafNode = createLeafNodeFromTypeAndProps(type, pendingProps, key, mode, lanes);

    return LeafNode;
}

export function createLeafFromText(content, mode, lanes) {
    var fiber = createLeaf(HostText, content, null, mode);
    fiber.lanes = lanes;
    return fiber;
}