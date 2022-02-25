import { ELEMENT_NODE, GREEN_TREE_TYPE, LegacyRoot } from "../Types";
import { createSuperRoot } from "./SuperRoot";

function createRootImpl(container, tag, options) {
    var hydrate = options != null && options.hydrate === true;
    var root = createSuperRoot(container, tag, hydrate);
    return root;
}

function DOMBlockingRoot(container, tag, options) {
    this._internalRoot = createRootImpl(container, tag, options);
}

function createLegacyRoot(container, options) {
    return new DOMBlockingRoot(container, LegacyRoot, options);
}

export function legacyCreateRootContainerFromDOM(container, forceHydrate) {
    const shouldHydrate = forceHydrate || false;
    if (!shouldHydrate) {
        let warned = false;
        let root;
        while (root = container.lastChild) {
            {
                if (!warned && root.nodeType === ELEMENT_NODE && root.hasAttribute("green-root")) {
                    warned = true;
                    console.warn("Warn! Removing root node from DOM container given is a bad idea!");
                }
            }
            container.removeChild(root);
        }
    }
    return createLegacyRoot(container, shouldHydrate ? { hudrate: true } : undefined);
}