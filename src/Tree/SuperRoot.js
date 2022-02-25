import { HostRoot } from "../Types";
import { createSuper } from "./Super";

function SuperRootNode(containerInfo, tag, hydrate) {
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
export function createSuperRoot(containerInfo, tag, hydrate) {
    var root = new SuperRootNode(containerInfo, tag, hydrate);
    var uninitializedSuper = createHostRootSuper(tag);
    root.current = uninitializedSuper;
    uninitializedSuper.stateNode = root;
    //initializeUpdateQueue(uninitializedSuper);
    return root;
}

function createHostRootSuper(tag) {
    return createSuper(HostRoot, null, null, null);
}
