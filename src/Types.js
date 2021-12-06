'use strict';
export const GREEN_ELEMENT_TYPE = Symbol('green.element');
export const GREEN_TREE_TYPE = Symbol('green.tree');
export const RESERVED_PROPS = { children: true, ref: true, unsafeHTML: true, ns: true };
/**
 * HTML nodeType values that represent the type of the node
 */
export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;
export const COMMENT_NODE = 8;
export const DOCUMENT_NODE = 9;

export const LegacyRoot = 1;

export const FunctionComponent = 0;
export const ClassComponent = 1;
export const HostRoot = 3;