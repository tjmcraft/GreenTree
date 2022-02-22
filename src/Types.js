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

export const NoMode = 0;
export const StrictMode = 1;
export const BlockingMode = 2;
export const ConcurentMode = 4;
export const ProfileMode = 8;
export const DebugTraceMode = 16;

export const LegacyRoot = 0;

export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2;
export const HostRoot = 3;
export const HostComponent = 5;
export const HostText = 6;

export const NoLanes = 0;
export const NoLane = 0;
export const SyncLane = 1;

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

export const NoFlags = 0;
export const PerformedWork = 1;
export const Placement = 2;
export const Update = 4;
export const PlacementAndUpdate = 6;
export const Deletion = 8;
export const ContentReset = 16;
export const Snapshot = 256;
export const HostEffectMask = 2047;
export const Incomplete = 2048;

export const RootIncomplete = 0;
export const RootFatalErrored = 1;
export const RootErrored = 2;
export const RootComplete = 5;

export var SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
export var SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
export var DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
export var AUTOFOCUS = 'autoFocus';
export var CHILDREN = 'children';
export var STYLE = 'style';
export var HTML$1 = '__html';