import { createLeaf } from "./LeafNode";
import { HostRoot } from "../Types";

export function initializeUpdateQueue(Leaf) {
    var queue = {
        current: Leaf.memoizedState,
        pending: null
        //effects: null
    };
    Leaf.updateQueue = queue;
}

function LeafRootNode(container, tag) {
    this.tag = tag;
    this.container = container;
    this.current = null;
}

export function createLeafRoot(container, tag) {
    var root = new LeafRootNode(container, tag); // LeafRootNode
    var uninitializedLeaf = createHostRootLeaf(tag); // LeafNode
    root.current = uninitializedLeaf;
    uninitializedLeaf.return = root;
    uninitializedLeaf.stateNode = container;
    initializeUpdateQueue(uninitializedLeaf);
    return root;
}

function createHostRootLeaf(tag) {
    return createLeaf(HostRoot, null, null);
}