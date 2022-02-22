import { AUTOFOCUS, CHILDREN, DANGEROUSLY_SET_INNER_HTML, DOCUMENT_NODE, HostComponent, HostText, HTML$1, NoLanes, STYLE, SUPPRESS_CONTENT_EDITABLE_WARNING, SUPPRESS_HYDRATION_WARNING } from "../Types";
import { updatedAncestorInfo, validateDOMNesting } from "./Context";
import { _assign } from "./Helpers";
import { getIntrinsicNamespace, HTML_NAMESPACE$1 } from "./Namespace";

var registrationNameDependencies = {};
var properties = {};

var randomKey = Math.random().toString(36).slice(2);
var internalPropsKey = '__greenProps$' + randomKey;

function getFiberCurrentPropsFromNode(node) {
    return node[internalPropsKey] || null;
}

function updateFiberProps(node, props) {
    node[internalPropsKey] = props;
}

export function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    var parentNamespace;

    {
        // TODO: take namespace into account when validating.
        var hostContextDev = hostContext;
        validateDOMNesting(type, null, hostContextDev.ancestorInfo);

        if (typeof props.children === 'string' || typeof props.children === 'number') {
            var string = '' + props.children;
            var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type);
            validateDOMNesting(null, string, ownAncestorInfo);
        }

        parentNamespace = hostContextDev.namespace;
    }

    var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
    console.debug("[createInstance]", "{domElement}", domElement);
    //precacheFiberNode(internalInstanceHandle, domElement);
    updateFiberProps(domElement, props);
    return domElement;
}

export function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    {
        var hostContextDev = hostContext;
        validateDOMNesting(null, text, hostContextDev.ancestorInfo);
    }

    var textNode = createTextNode(text, rootContainerInstance);
    //precacheFiberNode(internalInstanceHandle, textNode);
    return textNode;
}

function getOwnerDocumentFromRootContainer(rootContainerElement) {
    return rootContainerElement.nodeType === DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
}

function isCustomComponent(tagName, props) {
    if (tagName.indexOf('-') === -1) {
        return typeof props.is === 'string';
    }

    switch (tagName) {
        // These are reserved SVG and MathML elements.
        // We don't mind this list too much because we expect it to never grow.
        // The alternative is to track the namespace in a few places which is convoluted.
        // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
        case 'annotation-xml':
        case 'color-profile':
        case 'font-face':
        case 'font-face-src':
        case 'font-face-uri':
        case 'font-face-format':
        case 'font-face-name':
        case 'missing-glyph':
            return false;

        default:
            return true;
    }
}

// For HTML, certain tags should omit their close tag. We keep a list for
// those special-case tags.
var omittedCloseTags = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true // NOTE: menuitem's close tag should be omitted, but that causes problems.

};

// `omittedCloseTags` except that `menuitem` should still have its closing tag.

var voidElementTags = _assign({
    menuitem: true
}, omittedCloseTags);

var HTML = '__html';

function assertValidProps(tag, props) {
    if (!props) {
        return;
    } // Note the use of `==` which checks for null or undefined.


    if (voidElementTags[tag]) {
        if (!(props.children == null && props.dangerouslySetInnerHTML == null)) {
            {
                throw Error(tag + " is a void element tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
            }
        }
    }

    if (props.dangerouslySetInnerHTML != null) {
        if (!(props.children == null)) {
            {
                throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
            }
        }

        if (!(typeof props.dangerouslySetInnerHTML === 'object' && HTML in props.dangerouslySetInnerHTML)) {
            {
                throw Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information.");
            }
        }
    }

    {
        if (!props.suppressContentEditableWarning && props.contentEditable && props.children != null) {
            error('A component is `contentEditable` and contains `children` managed by ' + 'React. It is now your responsibility to guarantee that none of ' + 'those nodes are unexpectedly modified or duplicated. This is ' + 'probably not intentional.');
        }
    }

    if (!(props.style == null || typeof props.style === 'object')) {
        {
            throw Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
        }
    }
}

function createElement(type, props, rootContainerElement, parentNamespace) {
    var isCustomComponentTag; // We create tags in the namespace of their parent container, except HTML
    // tags get no namespace.

    var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
    var domElement;
    var namespaceURI = parentNamespace;

    if (namespaceURI === HTML_NAMESPACE$1) {
        namespaceURI = getIntrinsicNamespace(type);
    }

    if (namespaceURI === HTML_NAMESPACE$1) {
        {
            isCustomComponentTag = isCustomComponent(type, props); // Should this check be gated by parent namespace? Not sure we want to
            // allow <SVG> or <mATH>.

            if (!isCustomComponentTag && type !== type.toLowerCase()) {
                error('<%s /> is using incorrect casing. ' + 'Use PascalCase for React components, ' + 'or lowercase for HTML elements.', type);
            }
        }

        if (type === 'script') {
            // Create the script via .innerHTML so its "parser-inserted" flag is
            // set to true and it does not execute
            var div = ownerDocument.createElement('div');

            div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
            // This is guaranteed to yield a script element.

            var firstChild = div.firstChild;
            domElement = div.removeChild(firstChild);
        } else if (typeof props.is === 'string') {
            // $FlowIssue `createElement` should be updated for Web Components
            domElement = ownerDocument.createElement(type, {
                is: props.is
            });
        } else {
            // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
            // See discussion in https://github.com/facebook/react/pull/6896
            // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
            domElement = ownerDocument.createElement(type); // Normally attributes are assigned in `setInitialDOMProperties`, however the `multiple` and `size`
            // attributes on `select`s needs to be added before `option`s are inserted.
            // This prevents:
            // - a bug where the `select` does not scroll to the correct option because singular
            //  `select` elements automatically pick the first item #13222
            // - a bug where the `select` set the first item as selected despite the `size` attribute #14239
            // See https://github.com/facebook/react/issues/13222
            // and https://github.com/facebook/react/issues/14239

            if (type === 'select') {
                var node = domElement;

                if (props.multiple) {
                    node.multiple = true;
                } else if (props.size) {
                    // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
                    // it is possible that no option is selected.
                    //
                    // This is only necessary when a select in "single selection mode".
                    node.size = props.size;
                }
            }
        }
    } else {
        domElement = ownerDocument.createElementNS(namespaceURI, type);
    }

    {
        if (namespaceURI === HTML_NAMESPACE$1) {
            if (!isCustomComponentTag && Object.prototype.toString.call(domElement) === '[object HTMLUnknownElement]' && !Object.prototype.hasOwnProperty.call(warnedUnknownTags, type)) {
                warnedUnknownTags[type] = true;

                error('The tag <%s> is unrecognized in this browser. ' + 'If you meant to render a React component, start its name with ' + 'an uppercase letter.', type);
            }
        }
    }

    return domElement;
}

function createTextNode(text, rootContainerElement) {
    return getOwnerDocumentFromRootContainer(rootContainerElement).createTextNode(text);
}

var setTextContent = function (node, text) {
    if (text) {
        var firstChild = node.firstChild;

        if (firstChild && firstChild === node.lastChild && firstChild.nodeType === TEXT_NODE) {
            firstChild.nodeValue = text;
            return;
        }
    }

    node.textContent = text;
};

// FINALIZE

function shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag) {
    if (propertyInfo !== null) {
        return propertyInfo.type === RESERVED;
    }

    if (isCustomComponentTag) {
        return false;
    }

    if (name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
        return true;
    }

    return false;
}

function shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag) {
    if (propertyInfo !== null && propertyInfo.type === RESERVED) {
        return false;
    }

    switch (typeof value) {
        case 'function': // $FlowIssue symbol is perfectly valid here

        case 'symbol':
            // eslint-disable-line
            return true;

        case 'boolean':
            {
                if (isCustomComponentTag) {
                    return false;
                }

                if (propertyInfo !== null) {
                    return !propertyInfo.acceptsBooleans;
                } else {
                    var prefix = name.toLowerCase().slice(0, 5);
                    return prefix !== 'data-' && prefix !== 'aria-';
                }
            }

        default:
            return false;
    }
}

function shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag) {
    if (value === null || typeof value === 'undefined') {
        return true;
    }

    if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag)) {
        return true;
    }

    if (isCustomComponentTag) {
        return false;
    }

    if (propertyInfo !== null) {

        switch (propertyInfo.type) {
            case BOOLEAN:
                return !value;

            case OVERLOADED_BOOLEAN:
                return value === false;

            case NUMERIC:
                return isNaN(value);

            case POSITIVE_NUMERIC:
                return isNaN(value) || value < 1;
        }
    }

    return false;
}

// A reserved attribute.
// It is handled by React separately and shouldn't be written to the DOM.
var RESERVED = 0; // A simple string attribute.
// Attributes that aren't in the filter are presumed to have this type.

var STRING = 1; // A string attribute that accepts booleans in React. In HTML, these are called
// "enumerated" attributes with "true" and "false" as possible values.
// When true, it should be set to a "true" string.
// When false, it should be set to a "false" string.

var BOOLEANISH_STRING = 2; // A real boolean attribute.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.

var BOOLEAN = 3; // An attribute that can be used as a flag as well as with a value.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.
// For any other value, should be present with that value.

var OVERLOADED_BOOLEAN = 4; // An attribute that must be numeric or parse as a numeric.
// When falsy, it should be removed.

var NUMERIC = 5; // An attribute that must be positive numeric or parse as a positive numeric.
// When falsy, it should be removed.

var POSITIVE_NUMERIC = 6;

/* eslint-disable max-len */
var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
/* eslint-enable max-len */

var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var ROOT_ATTRIBUTE_NAME = 'data-reactroot';
var VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');
var hasOwnProperty = Object.prototype.hasOwnProperty;

var illegalAttributeNameCache = {};
var validatedAttributeNameCache = {};

function isAttributeNameSafe(attributeName) {
    if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
        return true;
    }

    if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
        return false;
    }

    if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
        validatedAttributeNameCache[attributeName] = true;
        return true;
    }

    illegalAttributeNameCache[attributeName] = true;

    {
        error('Invalid attribute name: `%s`', attributeName);
    }

    return false;
}

function getPropertyInfo(name) {
    return properties.hasOwnProperty(name) ? properties[name] : null;
}

function setValueForProperty(node, name, value, isCustomComponentTag) {
    var propertyInfo = getPropertyInfo(name);

    if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
        return;
    }

    if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
        value = null;
    } // If the prop isn't in the special list, treat it as a simple attribute.


    if (isCustomComponentTag || propertyInfo === null) {
        if (isAttributeNameSafe(name)) {
            var _attributeName = name;

            if (value === null) {
                node.removeAttribute(_attributeName);
            } else {
                node.setAttribute(_attributeName, '' + value);
            }
        }

        return;
    }

    var mustUseProperty = propertyInfo.mustUseProperty;

    if (mustUseProperty) {
        var propertyName = propertyInfo.propertyName;

        if (value === null) {
            var type = propertyInfo.type;
            node[propertyName] = type === BOOLEAN ? false : '';
        } else {
            // Contrary to `setAttribute`, object properties are properly
            // `toString`ed by IE8/9.
            node[propertyName] = value;
        }

        return;
    } // The rest are treated as attributes with special cases.


    var attributeName = propertyInfo.attributeName,
        attributeNamespace = propertyInfo.attributeNamespace;

    if (value === null) {
        node.removeAttribute(attributeName);
    } else {
        var _type = propertyInfo.type;
        var attributeValue;

        if (_type === BOOLEAN || _type === OVERLOADED_BOOLEAN && value === true) {
            // If attribute type is boolean, we know for sure it won't be an execution sink
            // and we won't require Trusted Type here.
            attributeValue = '';
        } else {
            // `setAttribute` with objects becomes only `[object]` in IE8/9,
            // ('' + value) makes it output the correct toString()-value.
            {
                attributeValue = '' + value;
            }

            if (propertyInfo.sanitizeURL) {
                sanitizeURL(attributeValue.toString());
            }
        }

        if (attributeNamespace) {
            node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
        } else {
            node.setAttribute(attributeName, attributeValue);
        }
    }
}

function setInitialDOMProperties(tag, domElement, rootContainerElement, nextProps, isCustomComponentTag) {
    for (var propKey in nextProps) {
        if (!nextProps.hasOwnProperty(propKey)) {
            continue;
        }

        var nextProp = nextProps[propKey];

        if (propKey === STYLE) {
            {
                if (nextProp) {
                    // Freeze the next style object so that we can assume it won't be
                    // mutated. We have already warned for this in the past.
                    Object.freeze(nextProp);
                }
            } // Relies on `updateStylesByID` not mutating `styleUpdates`.


            setValueForStyles(domElement, nextProp);
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
            var nextHtml = nextProp ? nextProp[HTML$1] : undefined;

            if (nextHtml != null) {
                setInnerHTML(domElement, nextHtml);
            }
        } else if (propKey === CHILDREN) {
            if (typeof nextProp === 'string') {
                // Avoid setting initial textContent when the text is empty. In IE11 setting
                // textContent on a <textarea> will cause the placeholder to not
                // show within the <textarea> until it has been focused and blurred again.
                // https://github.com/facebook/react/issues/6731#issuecomment-254874553
                var canSetTextContent = tag !== 'textarea' || nextProp !== '';

                if (canSetTextContent) {
                    setTextContent(domElement, nextProp);
                }
            } else if (typeof nextProp === 'number') {
                setTextContent(domElement, '' + nextProp);
            }
        } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING);
        else if (propKey === AUTOFOCUS);
        else if (registrationNameDependencies.hasOwnProperty(propKey)) {
            if (nextProp != null) {
                if (typeof nextProp !== 'function') {
                    warnForInvalidEventListener(propKey, nextProp);
                }

                if (propKey === 'onScroll') {
                    listenToNonDelegatedEvent('scroll', domElement);
                }
            }
        } else if (nextProp != null) {
            setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
        }
    }
}

function setInitialProperties(domElement, tag, rawProps, rootContainerElement) {
    var isCustomComponentTag = isCustomComponent(tag, rawProps);

    var props;

    switch (tag) {
        case 'dialog':
            listenToNonDelegatedEvent('cancel', domElement);
            listenToNonDelegatedEvent('close', domElement);
            props = rawProps;
            break;

        case 'iframe':
        case 'object':
        case 'embed':
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the load event.
            listenToNonDelegatedEvent('load', domElement);
            props = rawProps;
            break;

        case 'video':
        case 'audio':
            // We listen to these events in case to ensure emulated bubble
            // listeners still fire for all the media events.
            for (var i = 0; i < mediaEventTypes.length; i++) {
                listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
            }

            props = rawProps;
            break;

        case 'source':
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the error event.
            listenToNonDelegatedEvent('error', domElement);
            props = rawProps;
            break;

        case 'img':
        case 'image':
        case 'link':
            // We listen to these events in case to ensure emulated bubble
            // listeners still fire for error and load events.
            listenToNonDelegatedEvent('error', domElement);
            listenToNonDelegatedEvent('load', domElement);
            props = rawProps;
            break;

        case 'details':
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the toggle event.
            listenToNonDelegatedEvent('toggle', domElement);
            props = rawProps;
            break;

        case 'input':
            initWrapperState(domElement, rawProps);
            props = getHostProps(domElement, rawProps); // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.

            listenToNonDelegatedEvent('invalid', domElement);

            break;

        case 'option':
            validateProps(domElement, rawProps);
            props = getHostProps$1(domElement, rawProps);
            break;

        case 'select':
            initWrapperState$1(domElement, rawProps);
            props = getHostProps$2(domElement, rawProps); // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.

            listenToNonDelegatedEvent('invalid', domElement);

            break;

        case 'textarea':
            initWrapperState$2(domElement, rawProps);
            props = getHostProps$3(domElement, rawProps); // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.

            listenToNonDelegatedEvent('invalid', domElement);

            break;

        default:
            props = rawProps;
    }

    assertValidProps(tag, props);
    setInitialDOMProperties(tag, domElement, rootContainerElement, props, isCustomComponentTag);

    switch (tag) {
        case 'input':
            // TODO: Make sure we check if this is still unmounted or do any clean
            // up necessary since we never stop tracking anymore.
            track(domElement);
            postMountWrapper(domElement, rawProps, false);
            break;

        case 'textarea':
            // TODO: Make sure we check if this is still unmounted or do any clean
            // up necessary since we never stop tracking anymore.
            track(domElement);
            postMountWrapper$3(domElement);
            break;

        case 'option':
            postMountWrapper$1(domElement, rawProps);
            break;

        case 'select':
            postMountWrapper$2(domElement, rawProps);
            break;

        default:
            if (typeof props.onClick === 'function') {
                // TODO: This cast may not be sound for SVG, MathML or custom elements.
                trapClickOnNonInteractiveElement(domElement);
            }

            break;
    }
}

function shouldAutoFocusHostComponent(type, props) {
    switch (type) {
        case 'button':
        case 'input':
        case 'select':
        case 'textarea':
            return !!props.autoFocus;
    }

    return false;
}

export function finalizeInitialChildren(domElement, type, props, rootContainerInstance, hostContext) {
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return shouldAutoFocusHostComponent(type, props);
}


// MUTATION

function appendInitialChild(parentInstance, child) {
    parentInstance.appendChild(child);
}

export const appendAllChildren = function (parent, workInProgress, needsVisibilityToggle, isHidden) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    var node = workInProgress.child;

    while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
        }
        else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }

        if (node === workInProgress) {
            return;
        }

        while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress) {
                return;
            }

            node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;
    }
};

export const updateHostContainer = function (workInProgress) { // Noop
};

export const updateHostComponent$1 = function (current, workInProgress, type, newProps, rootContainerInstance) {
    // If we have an alternate, that means this is an update and we need to
    // schedule a side-effect to do the updates.
    var oldProps = current.memoizedProps;

    if (oldProps === newProps) {
        // In mutation mode, this is sufficient for a bailout because
        // we won't touch this node even if children changed.
        return;
    } // If we get updated because one of our children updated, we don't
    // have newProps so we'll have to reuse them.
    // TODO: Split the update API as separate for the props vs. children.
    // Even better would be if children weren't special cased at all tho.


    var instance = workInProgress.stateNode;
    var currentHostContext = getHostContext(); // TODO: Experiencing an error where oldProps is null. Suggests a host
    // component is hitting the resume path. Figure out why. Possibly
    // related to `hidden`.

    var updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext); // TODO: Type this specific to this type of component.

    workInProgress.updateQueue = updatePayload; // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update. All the work is done in commitWork.

    if (updatePayload) {
        markUpdate(workInProgress);
    }
};

export const updateHostText$1 = function (current, workInProgress, oldText, newText) {
    // If the text differs, mark it as an update. All the work in done in commitWork.
    if (oldText !== newText) {
        markUpdate(workInProgress);
    }
};


// COMMIT

export function markRootFinished(root, remainingLanes) {
    var noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
    root.pendingLanes = remainingLanes; // Let's try everything again

    root.suspendedLanes = 0;
    root.pingedLanes = 0;
    root.expiredLanes &= remainingLanes;
    root.mutableReadLanes &= remainingLanes;
    root.entangledLanes &= remainingLanes;
    var entanglements = root.entanglements;
    //var eventTimes = root.eventTimes;
    var expirationTimes = root.expirationTimes; // Clear the lanes that no longer have pending work

    var lanes = noLongerPendingLanes;

    
}

