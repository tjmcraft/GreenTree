import { GREEN_ELEMENT_TYPE, Placement } from "../Types";
import { createLeafFromElement, createLeafFromText } from "./Leaf";

var isArray$1 = Array.isArray;

var MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;

function getIteratorFn(maybeIterable) {
    if (maybeIterable === null || typeof maybeIterable !== 'object') {
        return null;
    }

    var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

    if (typeof maybeIterator === 'function') {
        return maybeIterator;
    }

    return null;
}

function ChildReconciler(shouldTrackSideEffects) {
    function deleteChild(returnFiber, childToDelete) {
        if (!shouldTrackSideEffects) {
            // Noop.
            return;
        } // Deletions are added in reversed order so we add it to the front.
        // At this point, the return fiber's effect list is empty except for
        // deletions, so we can just append the deletion to the list. The remaining
        // effects aren't added until the complete phase. Once we implement
        // resuming, this may not be true.


        var last = returnFiber.lastEffect;

        if (last !== null) {
            last.nextEffect = childToDelete;
            returnFiber.lastEffect = childToDelete;
        } else {
            returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
        }

        childToDelete.nextEffect = null;
        childToDelete.flags = Deletion;
    }

    function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects) {
            // Noop.
            return null;
        } // TODO: For the shouldClone case, this could be micro-optimized a bit by
        // assuming that after the first child we've already added everything.


        var childToDelete = currentFirstChild;

        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }

        return null;
    }

    function mapRemainingChildren(returnFiber, currentFirstChild) {
        // Add the remaining children to a temporary map so that we can find them by
        // keys quickly. Implicit (null) keys get added to this set with their index
        // instead.
        var existingChildren = new Map();
        var existingChild = currentFirstChild;

        while (existingChild !== null) {
            if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild);
            } else {
                existingChildren.set(existingChild.index, existingChild);
            }

            existingChild = existingChild.sibling;
        }

        return existingChildren;
    }

    function useFiber(fiber, pendingProps) {
        // We currently set sibling to null and index to 0 here because it is easy
        // to forget to do before returning it. E.g. for the single child case.
        var clone = createWorkInProgress(fiber, pendingProps);
        clone.index = 0;
        clone.sibling = null;
        return clone;
    }

    function placeChild(newFiber, lastPlacedIndex, newIndex) {
        newFiber.index = newIndex;

        if (!shouldTrackSideEffects) {
            // Noop.
            return lastPlacedIndex;
        }

        var current = newFiber.alternate;

        if (current !== null) {
            var oldIndex = current.index;

            if (oldIndex < lastPlacedIndex) {
                // This is a move.
                newFiber.flags = Placement;
                return lastPlacedIndex;
            } else {
                // This item can stay in place.
                return oldIndex;
            }
        } else {
            // This is an insertion.
            newFiber.flags = Placement;
            return lastPlacedIndex;
        }
    }

    function placeSingleChild(newFiber) {
        // This is simpler for the single child case. We only need to do a
        // placement for inserting new children.
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.flags = Placement;
        }

        return newFiber;
    }

    function updateTextNode(returnFiber, current, textContent, lanes) {
        if (current === null || current.tag !== HostText) {
            // Insert
            var created = createLeafFromText(textContent, returnFiber.mode, lanes);
            created.return = returnFiber;
            return created;
        } else {
            // Update
            var existing = useFiber(current, textContent);
            existing.return = returnFiber;
            return existing;
        }
    }

    function updateElement(returnFiber, current, element, lanes) {
        if (current !== null) {
            if (current.elementType === element.type || ( // Keep this check inline so it only runs on the false path:
                    isCompatibleFamilyForHotReloading(current, element))) {
                // Move based on index
                var existing = useFiber(current, element.props);
                existing.ref = coerceRef(returnFiber, current, element);
                existing.return = returnFiber;

                {
                    existing._debugSource = element._source;
                    existing._debugOwner = element._owner;
                }

                return existing;
            }
        } // Insert


        var created = createLeafFromElement(element, returnFiber.mode, lanes);
        created.ref = coerceRef(returnFiber, current, element);
        created.return = returnFiber;
        return created;
    }

    function createChild(returnFiber, newChild, lanes) {
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            // Text nodes don't have keys. If the previous node is implicitly keyed
            // we can continue to replace it without aborting even if it is not a text
            // node.
            var created = createLeafFromText('' + newChild, returnFiber.mode, lanes);
            created.return = returnFiber;
            return created;
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case GREEN_ELEMENT_TYPE:
                    {
                        var _created = createLeafFromElement(newChild, returnFiber.mode, lanes);

                        //_created.ref = coerceRef(returnFiber, null, newChild);
                        _created.return = returnFiber;
                        return _created;
                    }
            }

            if (isArray$1(newChild) || getIteratorFn(newChild)) {
                var _created3 = createLeafFromFragment(newChild, returnFiber.mode, lanes, null);

                _created3.return = returnFiber;
                return _created3;
            }

            throwOnInvalidObjectType(returnFiber, newChild);
        }

        {
            if (typeof newChild === 'function') {
                warnOnFunctionType(returnFiber);
            }
        }

        return null;
    }

    function updateSlot(returnFiber, oldFiber, newChild, lanes) {
        // Update the fiber if the keys match, otherwise return null.
        var key = oldFiber !== null ? oldFiber.key : null;

        if (typeof newChild === 'string' || typeof newChild === 'number') {
            // Text nodes don't have keys. If the previous node is implicitly keyed
            // we can continue to replace it without aborting even if it is not a text
            // node.
            if (key !== null) {
                return null;
            }

            return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case GREEN_ELEMENT_TYPE:
                    {
                        if (newChild.key === key) {
                            if (newChild.type === REACT_FRAGMENT_TYPE) {
                                return updateFragment(returnFiber, oldFiber, newChild.props.children, lanes, key);
                            }

                            return updateElement(returnFiber, oldFiber, newChild, lanes);
                        } else {
                            return null;
                        }
                    }
            }

            if (isArray$1(newChild) || getIteratorFn(newChild)) {
                if (key !== null) {
                    return null;
                }

                return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
            }

            throwOnInvalidObjectType(returnFiber, newChild);
        }

        {
            if (typeof newChild === 'function') {
                warnOnFunctionType(returnFiber);
            }
        }

        return null;
    }

    function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            // Text nodes don't have keys, so we neither have to check the old nor
            // new node for the key. If both are text nodes, they match.
            var matchedFiber = existingChildren.get(newIdx) || null;
            return updateTextNode(returnFiber, matchedFiber, '' + newChild, lanes);
        }

        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case GREEN_ELEMENT_TYPE:
                    {
                        var _matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;

                        if (newChild.type === REACT_FRAGMENT_TYPE) {
                            return updateFragment(returnFiber, _matchedFiber, newChild.props.children, lanes, newChild.key);
                        }

                        return updateElement(returnFiber, _matchedFiber, newChild, lanes);
                    }
            }

            if (isArray$1(newChild) || getIteratorFn(newChild)) {
                var _matchedFiber3 = existingChildren.get(newIdx) || null;

                return updateFragment(returnFiber, _matchedFiber3, newChild, lanes, null);
            }

            throwOnInvalidObjectType(returnFiber, newChild);
        }

        {
            if (typeof newChild === 'function') {
                warnOnFunctionType(returnFiber);
            }
        }

        return null;
    }
    /**
     * Warns if there is a duplicate or missing key
     */


    function warnOnInvalidKey(child, knownKeys, returnFiber) {
        {
            if (typeof child !== 'object' || child === null) {
                return knownKeys;
            }

            switch (child.$$typeof) {
                case GREEN_ELEMENT_TYPE:
                    //warnForMissingKey(child, returnFiber);
                    var key = child.key;

                    if (typeof key !== 'string') {
                        break;
                    }

                    if (knownKeys === null) {
                        knownKeys = new Set();
                        knownKeys.add(key);
                        break;
                    }

                    if (!knownKeys.has(key)) {
                        knownKeys.add(key);
                        break;
                    }

                    error('Encountered two children with the same key, `%s`. ' + 'Keys should be unique so that components maintain their identity ' + 'across updates. Non-unique keys may cause children to be ' + 'duplicated and/or omitted — the behavior is unsupported and ' + 'could change in a future version.', key);

                    break;
            }
        }

        return knownKeys;
    }

    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
        // This algorithm can't optimize by searching from both ends since we
        // don't have backpointers on fibers. I'm trying to see how far we can get
        // with that model. If it ends up not being worth the tradeoffs, we can
        // add it later.
        // Even with a two ended optimization, we'd want to optimize for the case
        // where there are few changes and brute force the comparison instead of
        // going for the Map. It'd like to explore hitting that path first in
        // forward-only mode and only go for the Map once we notice that we need
        // lots of look ahead. This doesn't handle reversal as well as two ended
        // search but that's unusual. Besides, for the two ended optimization to
        // work on Iterables, we'd need to copy the whole set.
        // In this first iteration, we'll just live with hitting the bad case
        // (adding everything to a Map) in for every insert/move.
        // If you change this code, also update reconcileChildrenIterator() which
        // uses the same algorithm.
        {
            // First, validate keys.
            var knownKeys = null;

            for (var i = 0; i < newChildren.length; i++) {
                var child = newChildren[i];
                knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
            }
        }

        var resultingFirstChild = null;
        var previousNewFiber = null;
        var oldFiber = currentFirstChild;
        var lastPlacedIndex = 0;
        var newIdx = 0;
        var nextOldFiber = null;

        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            if (oldFiber.index > newIdx) {
                nextOldFiber = oldFiber;
                oldFiber = null;
            } else {
                nextOldFiber = oldFiber.sibling;
            }

            var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);

            if (newFiber === null) {
                // TODO: This breaks on empty slots like null children. That's
                // unfortunate because it triggers the slow path all the time. We need
                // a better way to communicate whether this was a miss or null,
                // boolean, undefined, etc.
                if (oldFiber === null) {
                    oldFiber = nextOldFiber;
                }

                break;
            }

            if (shouldTrackSideEffects) {
                if (oldFiber && newFiber.alternate === null) {
                    // We matched the slot, but we didn't reuse the existing fiber, so we
                    // need to delete the existing child.
                    deleteChild(returnFiber, oldFiber);
                }
            }

            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

            if (previousNewFiber === null) {
                // TODO: Move out of the loop. This only happens for the first run.
                resultingFirstChild = newFiber;
            } else {
                // TODO: Defer siblings if we're not at the right index for this slot.
                // I.e. if we had null values before, then we want to defer this
                // for each null value. However, we also don't want to call updateSlot
                // with the previous one.
                previousNewFiber.sibling = newFiber;
            }

            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }

        if (newIdx === newChildren.length) {
            // We've reached the end of the new children. We can delete the rest.
            deleteRemainingChildren(returnFiber, oldFiber);
            return resultingFirstChild;
        }

        if (oldFiber === null) {
            // If we don't have any more existing children we can choose a fast path
            // since the rest will all be insertions.
            for (; newIdx < newChildren.length; newIdx++) {
                var _newFiber = createChild(returnFiber, newChildren[newIdx], lanes);

                if (_newFiber === null) {
                    continue;
                }

                lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

                if (previousNewFiber === null) {
                    // TODO: Move out of the loop. This only happens for the first run.
                    resultingFirstChild = _newFiber;
                } else {
                    previousNewFiber.sibling = _newFiber;
                }

                previousNewFiber = _newFiber;
            }

            return resultingFirstChild;
        } // Add all children to a key map for quick lookups.


        var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

        for (; newIdx < newChildren.length; newIdx++) {
            var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], lanes);

            if (_newFiber2 !== null) {
                if (shouldTrackSideEffects) {
                    if (_newFiber2.alternate !== null) {
                        // The new fiber is a work in progress, but if there exists a
                        // current, that means that we reused the fiber. We need to delete
                        // it from the child list so that we don't add it to the deletion
                        // list.
                        existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
                    }
                }

                lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

                if (previousNewFiber === null) {
                    resultingFirstChild = _newFiber2;
                } else {
                    previousNewFiber.sibling = _newFiber2;
                }

                previousNewFiber = _newFiber2;
            }
        }

        if (shouldTrackSideEffects) {
            // Any existing children that weren't consumed above were deleted. We need
            // to add them to the deletion list.
            existingChildren.forEach(function(child) {
                return deleteChild(returnFiber, child);
            });
        }

        return resultingFirstChild;
    }

    function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildrenIterable, lanes) {
        // This is the same implementation as reconcileChildrenArray(),
        // but using the iterator instead.
        var iteratorFn = getIteratorFn(newChildrenIterable);

        if (!(typeof iteratorFn === 'function')) {
            {
                throw Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue.");
            }
        }

        {
            // We don't support rendering Generators because it's a mutation.
            // See https://github.com/facebook/react/issues/12995
            if (typeof Symbol === 'function' && // $FlowFixMe Flow doesn't know about toStringTag
                newChildrenIterable[Symbol.toStringTag] === 'Generator') {
                if (!didWarnAboutGenerators) {
                    error('Using Generators as children is unsupported and will likely yield ' + 'unexpected results because enumerating a generator mutates it. ' + 'You may convert it to an array with `Array.from()` or the ' + '`[...spread]` operator before rendering. Keep in mind ' + 'you might need to polyfill these features for older browsers.');
                }

                didWarnAboutGenerators = true;
            } // Warn about using Maps as children


            if (newChildrenIterable.entries === iteratorFn) {
                if (!didWarnAboutMaps) {
                    error('Using Maps as children is not supported. ' + 'Use an array of keyed ReactElements instead.');
                }

                didWarnAboutMaps = true;
            } // First, validate keys.
            // We'll get a different iterator later for the main pass.


            var _newChildren = iteratorFn.call(newChildrenIterable);

            if (_newChildren) {
                var knownKeys = null;

                var _step = _newChildren.next();

                for (; !_step.done; _step = _newChildren.next()) {
                    var child = _step.value;
                    knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
                }
            }
        }

        var newChildren = iteratorFn.call(newChildrenIterable);

        if (!(newChildren != null)) {
            {
                throw Error("An iterable object provided no iterator.");
            }
        }

        var resultingFirstChild = null;
        var previousNewFiber = null;
        var oldFiber = currentFirstChild;
        var lastPlacedIndex = 0;
        var newIdx = 0;
        var nextOldFiber = null;
        var step = newChildren.next();

        for (; oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
            if (oldFiber.index > newIdx) {
                nextOldFiber = oldFiber;
                oldFiber = null;
            } else {
                nextOldFiber = oldFiber.sibling;
            }

            var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);

            if (newFiber === null) {
                // TODO: This breaks on empty slots like null children. That's
                // unfortunate because it triggers the slow path all the time. We need
                // a better way to communicate whether this was a miss or null,
                // boolean, undefined, etc.
                if (oldFiber === null) {
                    oldFiber = nextOldFiber;
                }

                break;
            }

            if (shouldTrackSideEffects) {
                if (oldFiber && newFiber.alternate === null) {
                    // We matched the slot, but we didn't reuse the existing fiber, so we
                    // need to delete the existing child.
                    deleteChild(returnFiber, oldFiber);
                }
            }

            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

            if (previousNewFiber === null) {
                // TODO: Move out of the loop. This only happens for the first run.
                resultingFirstChild = newFiber;
            } else {
                // TODO: Defer siblings if we're not at the right index for this slot.
                // I.e. if we had null values before, then we want to defer this
                // for each null value. However, we also don't want to call updateSlot
                // with the previous one.
                previousNewFiber.sibling = newFiber;
            }

            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }

        if (step.done) {
            // We've reached the end of the new children. We can delete the rest.
            deleteRemainingChildren(returnFiber, oldFiber);
            return resultingFirstChild;
        }

        if (oldFiber === null) {
            // If we don't have any more existing children we can choose a fast path
            // since the rest will all be insertions.
            for (; !step.done; newIdx++, step = newChildren.next()) {
                var _newFiber3 = createChild(returnFiber, step.value, lanes);

                if (_newFiber3 === null) {
                    continue;
                }

                lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx);

                if (previousNewFiber === null) {
                    // TODO: Move out of the loop. This only happens for the first run.
                    resultingFirstChild = _newFiber3;
                } else {
                    previousNewFiber.sibling = _newFiber3;
                }

                previousNewFiber = _newFiber3;
            }

            return resultingFirstChild;
        } // Add all children to a key map for quick lookups.


        var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

        for (; !step.done; newIdx++, step = newChildren.next()) {
            var _newFiber4 = updateFromMap(existingChildren, returnFiber, newIdx, step.value, lanes);

            if (_newFiber4 !== null) {
                if (shouldTrackSideEffects) {
                    if (_newFiber4.alternate !== null) {
                        // The new fiber is a work in progress, but if there exists a
                        // current, that means that we reused the fiber. We need to delete
                        // it from the child list so that we don't add it to the deletion
                        // list.
                        existingChildren.delete(_newFiber4.key === null ? newIdx : _newFiber4.key);
                    }
                }

                lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx);

                if (previousNewFiber === null) {
                    resultingFirstChild = _newFiber4;
                } else {
                    previousNewFiber.sibling = _newFiber4;
                }

                previousNewFiber = _newFiber4;
            }
        }

        if (shouldTrackSideEffects) {
            // Any existing children that weren't consumed above were deleted. We need
            // to add them to the deletion list.
            existingChildren.forEach(function(child) {
                return deleteChild(returnFiber, child);
            });
        }

        return resultingFirstChild;
    }

    function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, lanes) {
        // There's no need to check for keys on text nodes since we don't have a
        // way to define them.
        if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
            // We already have an existing node so let's just update it and delete
            // the rest.
            deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
            var existing = useFiber(currentFirstChild, textContent);
            existing.return = returnFiber;
            return existing;
        } // The existing first child is not a text node so we need to create one
        // and delete the existing ones.


        deleteRemainingChildren(returnFiber, currentFirstChild);
        var created = createLeafFromText(textContent, returnFiber.mode, lanes);
        created.return = returnFiber;
        return created;
    }

    function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
        var key = element.key;
        var child = currentFirstChild;

        while (child !== null) {
            // TODO: If key === null and child.key === null, then this only applies to
            // the first item in the list.
            if (child.key === key) {
                switch (child.tag) {

                    case Block:

                        // We intentionally fallthrough here if enableBlocksAPI is not on.
                        // eslint-disable-next-lined no-fallthrough

                    default:
                        {
                            if (child.elementType === element.type || ( // Keep this check inline so it only runs on the false path:
                                    isCompatibleFamilyForHotReloading(child, element))) {
                                deleteRemainingChildren(returnFiber, child.sibling);

                                var _existing3 = useFiber(child, element.props);

                                _existing3.ref = coerceRef(returnFiber, child, element);
                                _existing3.return = returnFiber;

                                {
                                    _existing3._debugSource = element._source;
                                    _existing3._debugOwner = element._owner;
                                }

                                return _existing3;
                            }

                            break;
                        }
                } // Didn't match.


                deleteRemainingChildren(returnFiber, child);
                break;
            } else {
                deleteChild(returnFiber, child);
            }

            child = child.sibling;
        }

        {
            var _created4 = createLeafFromElement(element, returnFiber.mode, lanes);

            //_created4.ref = coerceRef(returnFiber, currentFirstChild, element);
            _created4.return = returnFiber;
            return _created4;
        }
    }

    function reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes) {

        var isObject = typeof newChild === 'object' && newChild !== null;

        if (isObject) {
            switch (newChild.$$typeof) {
                case GREEN_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes));
            }
        }

        if (typeof newChild === 'string' || typeof newChild === 'number') {
            return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, lanes));
        }

        if (isArray$1(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
        }

        if (getIteratorFn(newChild)) {
            return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
        }

        if (isObject) {
            throwOnInvalidObjectType(returnFiber, newChild);
        }

        {
            if (typeof newChild === 'function') {
                warnOnFunctionType(returnFiber);
            }
        }

        if (typeof newChild === 'undefined' && !isUnkeyedTopLevelFragment) {
            // If the new child is undefined, and the return fiber is a composite
            // component, throw an error. If Fiber return types are disabled,
            // we already threw above.
            switch (returnFiber.tag) {
                case ClassComponent:
                    {
                        {
                            var instance = returnFiber.stateNode;

                            if (instance.render._isMockFunction) {
                                // We allow auto-mocks to proceed as if they're returning null.
                                break;
                            }
                        }
                    }
                    // Intentionally fall through to the next case, which handles both
                    // functions and classes
                    // eslint-disable-next-lined no-fallthrough

                case Block:
                case FunctionComponent:
                case ForwardRef:
                case SimpleMemoComponent:
                    {
                        {
                            {
                                throw Error((getComponentName(returnFiber.type) || 'Component') + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.");
                            }
                        }
                    }
            }
        } // Remaining cases are all treated as empty.


        return deleteRemainingChildren(returnFiber, currentFirstChild);
    }

    return reconcileChildFibers;
}

export var reconcileChildLeafs = ChildReconciler(true);
export var mountChildLeafs = ChildReconciler(false);