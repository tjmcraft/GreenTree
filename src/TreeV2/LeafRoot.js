import { HostRoot } from "../Types";
import { createLeaf } from "./Leaf";

function LeafRootNode(containerInfo, tag, hydrate) {
    this.tag = tag;
    this.containerInfo = containerInfo;
    this.pendingChildren = null;
    this.current = null;
    this.pingCache = null;
    this.finishedWork = null;
    this.context = null;
    this.pendingContext = null;
    this.hydrate = hydrate;
    this.callbackNode = null;
}
export function createLeafRoot(containerInfo, tag, hydrate) {
    var root = new LeafRootNode(containerInfo, tag, hydrate); // LeafRootNode
    var uninitializedLeaf = createHostRootLeaf(tag); // LeafNode
    root.current = uninitializedLeaf;
    uninitializedLeaf.stateNode = root;
    initializeUpdateQueue(uninitializedLeaf);
    return root;
}
function initializeUpdateQueue(Leaf) {
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

function createHostRootLeaf(tag) {
    return createLeaf(HostRoot, null, null, null);
}
