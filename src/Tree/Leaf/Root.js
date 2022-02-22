import { createLeaf } from ".";
import { HostRoot } from "../../Types";
import { initializeUpdateQueue } from "../UpdateQueue";

function LeafRootNode(container, tag) {
    this.tag = tag;
    this.container = container;
    this.current = null;
}

export function createLeafRoot(container, tag) {
    var root = new LeafRootNode(container, tag); // LeafRootNode
    var uninitializedLeaf = createHostRootLeaf(tag); // LeafNode
    root.current = uninitializedLeaf;
    uninitializedLeaf.stateNode = container;
    initializeUpdateQueue(uninitializedLeaf);
    return root;
}

function createHostRootLeaf(tag) {
    return createLeaf(HostRoot, null, null, null);
}