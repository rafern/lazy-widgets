import { BaseXMLUIParser, XML_NAMESPACE_BASE } from './BaseXMLUIParser';
import * as widgets from '../widgets/concrete-widgets';
import { WidgetAutoXML } from './WidgetAutoXML';
import { validateArray } from './validateArray';
import { validateBoolean } from './validateBoolean';
import { validateFunction } from './validateFunction';
import { validateImageSource } from './validateImageSource';
import { validateKeyboardDriver } from './validateKeyboardDriver';
import { validateKeyContext } from './validateKeyContext';
import { validateLayerInit } from './validateLayerInit';
import { validateLayoutConstraints } from './validateLayoutConstraints';
import { validateNullable } from './validateNullable';
import { validateNumber } from './validateNumber';
import { validateObject } from './validateObject';
import { validateString } from './validateString';
import { validateTheme } from './validateTheme';
import { validateValidatedVariable } from './validateValidatedVariable';
import { validateVariable } from './validateVariable';
import { validateWidget } from './validateWidget';
import { fromKebabCase } from '../helpers/fromKebabCase';
import { WidgetEventListener } from '../events/WidgetEventEmitter';
import { WHITESPACE_REGEX } from '../helpers/whitespace-regex';

import type { Widget } from '../widgets/Widget';
import type { XMLUIParserContext } from './XMLUIParserContext';
import type { LayerInit } from '../core/LayerInit';

/**
 * A layer parameter for a {@link WidgetAutoXMLConfig}.
 *
 * @category XML
 */
export interface WidgetAutoXMLConfigLayerParameter {
    mode: 'layer';
    name: string;
    optional?: boolean;
    list?: boolean;
    validator?: <W extends Widget>(value: LayerInit<Widget>) => LayerInit<W>;
}

/**
 * Deserializes an XML <layer> element, as a {@link LayerInit} value.
 *
 * @param parser - The parser that is calling this deserializer
 * @param context - The current parser context, shared with all other initializations
 * @param elem - The element to deserialize
 * @returns Returns a new LayerInit instance, to be used as a parameter
 *
 * @category XML
 */
export function deserializeLayerElement(parser: BaseXMLUIParser, context: XMLUIParserContext, elem: Element): LayerInit<Widget> {
    // parse attributes
    let child: Widget | undefined, name: string | undefined, canExpand: boolean | undefined;
    for (const attr of elem.attributes) {
        // ignore attributes that arent using the default/wanted namespace
        if (attr.namespaceURI !== null && attr.namespaceURI !== XML_NAMESPACE_BASE) {
            continue;
        }

        // parse values
        if (attr.localName === 'child') {
            if (child !== undefined) {
                throw new Error('Only one child can be specified per layer');
            }

            child = validateWidget(parser.parseAttributeValue(attr.value, context))[0];
        } else if (attr.localName === 'name') {
            if (name !== undefined) {
                throw new Error('Only one name can be specified per layer');
            }

            name = validateString(parser.parseAttributeValue(attr.value, context))[0];
        } else if (attr.localName === 'can-expand') {
            if (canExpand !== undefined) {
                throw new Error('Only one can-expand option can be specified per layer');
            }

            canExpand = validateBoolean(parser.parseAttributeValue(attr.value, context))[0];
        } else {
            throw new Error(`Unknown layer attribute "${attr.localName}"`);
        }
    }

    // parse children
    for (const childNode of elem.childNodes) {
        const nodeType = childNode.nodeType;
        if (nodeType === Node.ELEMENT_NODE) {
            // ignore non-lazy-widgets nodes
            const childElem = childNode as Element;
            if (childElem.namespaceURI !== XML_NAMESPACE_BASE) {
                continue;
            }

            if (child !== undefined) {
                throw new Error('Only one child can be specified per layer');
            }

            child = parser.parseWidgetElem(context, childElem);
        } else if (nodeType === Node.COMMENT_NODE) {
            continue;
        } else if (nodeType === Node.TEXT_NODE) {
            if (!WHITESPACE_REGEX.test((childNode as CharacterData).data)) {
                throw new Error('Unexpected text node as layer child');
            }
        } else {
            console.log(childNode)
            throw new Error('Unexpected junk as layer node child');
        }
    }

    // done
    if (child === undefined) {
        throw new Error('Layer must have a child. Either add it as an XML node, or pass it as the "child" attribute via a variable');
    }

    return { child, name, canExpand };
}

/**
 * Deserializes an attribute with an options prefix. The value will be added as
 * a field in an options object, or completely replace the options object.
 *
 * @param parser - The parser that is calling this deserializer
 * @param context - The current parser context, shared with all other initializations
 * @param instantiationContext - The current parser context, only available to this instantiation
 * @param attribute - The attribute to deserialize - the attribute name decides the options object field, but `_` replaces the options object
 *
 * @category XML
 */
export function deserializeOptionsAttribute(parser: BaseXMLUIParser, context: XMLUIParserContext, instantiationContext: Record<string, unknown>, attribute: Attr) {
    // this attribute sets an options object's field. record it in the
    // instantiation context so it can be added to the parameters list later
    if (attribute.localName === '_') {
        if (instantiationContext.optionsReplaced) {
            throw new Error('Can\'t replace options object; options object has already been replaced with "option:_"');
        }

        if ('options' in instantiationContext && Object.getOwnPropertyNames(instantiationContext.options).length > 0) {
            throw new Error("Can't replace options object; can't replace options object if individual options are being set with \"option:...\"");
        }

        instantiationContext.optionsReplaced = true;
        const optionsValue = parser.parseAttributeValue(attribute.value, context);
        instantiationContext.options = validateObject(optionsValue)[0] as Record<string, unknown>;
    } else {
        if (instantiationContext.optionsReplaced) {
            throw new Error(`Can't add option "${attribute.localName}"; can't set individual options if the options object is replaced with "option:_"`);
        }

        const nameConverted = fromKebabCase(attribute.localName);

        if ('options' in instantiationContext) {
            const options = instantiationContext.options as Record<string, unknown>;
            if (nameConverted in options) {
                throw new Error(`Can't add option "${attribute.localName}"; the option has already been set`);
            }

            options[nameConverted] = parser.parseAttributeValue(attribute.value, context);
        } else {
            instantiationContext.options = {
                [nameConverted]: parser.parseAttributeValue(attribute.value, context)
            };
        }
    }
}

/**
 * Deserializes an attribute with an event on/once prefix. The attribute will
 * decide which event listener to add to the instance post-initialization. The
 * listeners will be added to the instantiation context for later use.
 *
 * @param once - Should `once` be set to true in {@link Widget#on}?
 * @param parser - The parser that is calling this deserializer
 * @param context - The current parser context, shared with all other initializations
 * @param instantiationContext - The current parser context, only available to this instantiation
 * @param attribute - The attribute to deserialize - the attribute name decides the event type to listen to
 *
 * @category XML
 */
export function deserializeEventAttribute(once: boolean, parser: BaseXMLUIParser, context: XMLUIParserContext, instantiationContext: Record<string, unknown>, attribute: Attr) {
    // get listener callback
    const callback = validateFunction(parser.parseAttributeValue(attribute.value, context))[0];

    // add to instantiation context so it can be added later
    const listenTuple = [attribute.localName, callback, once];
    const listeners = instantiationContext.listeners;
    if (listeners === undefined) {
        instantiationContext.listeners = [listenTuple];
    } else {
        (listeners as Array<unknown>).push(listenTuple);
    }
}

/**
 * Adds an options object to the end of an argument list.
 *
 * @param _parser - The parser that is calling this deserializer (unused)
 * @param _context - The current parser context, shared with all other initializations (unused)
 * @param instantiationContext - The current parser context, only available to this instantiation
 * @param args - The argument list that will be modified
 *
 * @category XML
 */
export function addOptionsObjectToArguments(_parser: BaseXMLUIParser, _context: XMLUIParserContext, instantiationContext: Record<string, unknown>, args: Array<unknown>) {
    // add options object to end of argument list
    if ('options' in instantiationContext) {
        args.push(instantiationContext.options);
    } else {
        args.push({});
    }
}

/**
 * Adds a list of event listeners to a widget instance. The event listeners will
 * be retrieved from the instantiation context.
 *
 * @param _parser - The parser that is calling this deserializer (unused)
 * @param _context - The current parser context, shared with all other initializations (unused)
 * @param instantiationContext - The current parser context, only available to this instantiation
 * @param instance - The widget instance for which the event listeners will be added to
 *
 * @category XML
 */
export function addEventListenersToWidget(_parser: BaseXMLUIParser, _context: XMLUIParserContext, instantiationContext: Record<string, unknown>, instance: Widget) {
    // add listeners to instance
    if ('listeners' in instantiationContext) {
        const listeners = instantiationContext.listeners as Array<[string, WidgetEventListener, boolean]>;

        for (const [eventType, callback, once] of listeners) {
            instance.on(eventType, callback, once);
        }
    }
}

/**
 * An XML UI parser.
 *
 * Unlike {@link BaseXMLUIParser}:
 *
 * - All default widgets are pre-registered
 * - `<layer>` elements are treated as LayerInit parameters ("layer" parameter mode)
 * - Attribute values starting with a backslash are always treated as strings, with the backslash removed
 * - Attribute values starting with a dollar sign are always treated as variables
 * - Attribute values starting with an at sign are always treated as JSON-encoded values
 * - Attributes with the `lazy-widgets:options` namespace will be added to an options object and passed to a widget factory
 * - Attributes with the `lazy-widgets:on` namespace will add event listeners to a widget
 * - Similarly, attributes with the `lazy-widgets:once` namespace will add event listeners to a widget, but with `once` set to true
 * - A lot of built-in validators are pre-registered
 *
 * @category XML
 */
export class XMLUIParser extends BaseXMLUIParser {
    constructor() {
        super();

        // register parameter modes
        // allow passing 'layer' mode parameters
        this.registerParameterMode('layer', (_p, _c, paramConfig, value) => {
            const layerInit = validateLayerInit(value)[0];
            const validator = (paramConfig as WidgetAutoXMLConfigLayerParameter).validator;

            if (validator) {
                return validator(layerInit);
            } else {
                return layerInit;
            }
        }, true, true);

        // register element deserializers
        // allow having 'layer' child elements that act as layer arguments
        this.registerElementDeserializer('layer', 'layer', deserializeLayerElement);

        // register attribute value deserializers
        // treat an argument as a string if it starts with a backslash
        this.registerAttributeValueDeserializer('\\', (_p, _c, value) => value);
        // treat an argument as JSON-encoded if it starts with an at sign
        this.registerAttributeValueDeserializer('@', (_p, _c, value) => JSON.parse(value));
        // treat an argument as a variable if it starts with a dollar sign
        this.registerAttributeValueDeserializer('$', (_p, context, value) => {
            if (!context.variableMap.has(value)) {
                throw new Error(`Variable "${value}" does not exist`);
            }

            return context.variableMap.get(value);
        });

        // register attribute namespace deserializers
        // allow options namespace to pass values to the options object. this
        // also requires registering a parameter modifier
        this.registerAttributeNamespaceHandler(`${XML_NAMESPACE_BASE}:options`, deserializeOptionsAttribute);
        this.registerArgumentModifier(addOptionsObjectToArguments);
        // allow the on and once namespaces to add an event listener. this also
        // requires registering a post-init hook
        this.registerAttributeNamespaceHandler(`${XML_NAMESPACE_BASE}:on`, deserializeEventAttribute.bind(this, false));
        this.registerAttributeNamespaceHandler(`${XML_NAMESPACE_BASE}:once`, deserializeEventAttribute.bind(this, true));
        this.registerPostInitHook(addEventListenersToWidget);

        // register built-in validators
        this.registerValidator('array', validateArray);
        this.registerValidator('boolean', validateBoolean);
        this.registerValidator('function', validateFunction);
        this.registerValidator('image-source', validateImageSource);
        this.registerValidator('keyboard-driver', validateKeyboardDriver);
        this.registerValidator('key-context', validateKeyContext);
        this.registerValidator('layer-init', validateLayerInit);
        this.registerValidator('layout-constraints', validateLayoutConstraints);
        this.registerValidator('nullable', validateNullable);
        this.registerValidator('number', validateNumber);
        this.registerValidator('object', validateObject);
        this.registerValidator('string', validateString);
        this.registerValidator('theme', validateTheme);
        this.registerValidator('validated-variable', validateValidatedVariable);
        this.registerValidator('variable', validateVariable);
        this.registerValidator('widget', validateWidget);

        // register factories for default widgets
        for (const ctor of Object.values(widgets)) {
            this.autoRegisterFactory(ctor as ((new () => Widget) & { autoXML: WidgetAutoXML }));
        }
    }
}
