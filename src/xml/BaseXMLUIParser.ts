import { Widget } from '../widgets/Widget.js';
import { toKebabCase } from '../helpers/toKebabCase.js';
import { WHITESPACE_REGEX } from '../helpers/whitespace-regex.js';
import type { WidgetAutoXML, WidgetXMLInputConfig, WidgetXMLInputConfigParameter, WidgetXMLInputConfigTextParameter, WidgetAutoXMLConfigValidator, WidgetXMLInputConfigValueParameter, WidgetXMLInputConfigWidgetParameter } from './WidgetAutoXML.js';
import type { ASTInstantiationConfig } from '../ast/ASTInstantiationConfig.js';
import type { ASTInstantiationContext } from '../ast/ASTInstantiationContext.js';
import type { XMLWidgetFactory } from './XMLWidgetFactory.js';
import type { XMLAttributeValueDeserializer } from './XMLAttributeValueDeserializer.js';
import type { XMLAttributeNamespaceHandler } from './XMLAttributeNamespaceHandler.js';
import type { XMLElementDeserializer } from './XMLElementDeserializer.js';
import type { XMLParameterModeValidator } from './XMLParameterModeValidator.js';
import type { XMLArgumentModifier } from './XMLArgumentModifier.js';
import type { XMLPostInitHook } from './XMLPostInitHook.js';
import { RootNode } from '../ast/RootNode.js';
import { ASTNode } from '../ast/ASTNode.js';
import { MetadataElementNode } from '../ast/MetadataElementNode.js';
import { MetadataAttributeNode } from '../ast/MetadataAttributeNode.js';
import { MetadataTextNode } from '../ast/MetadataTextNode.js';
import { MetadataCommentNode } from '../ast/MetadataCommentNode.js';
import { UITreeNode } from '../ast/UITreeNode.js';
import { ScriptNode } from '../ast/ScriptNode.js';
import { WidgetNode } from '../ast/WidgetNode.js';
import { TextNode } from '../ast/TextNode.js';
import { ValueNode } from '../ast/ValueNode.js';
import { OptionNode } from '../ast/OptionNode.js';
import { OptionsObjectNode } from '../ast/OptionsObjectNode.js';
import { LoneOptionNode } from '../ast/LoneOptionNode.js';
import { OptionsNode } from '../ast/OptionsNode.js';
import { AnyEventListenerNode } from '../ast/AnyEventListenerNode.js';
import { EventListenerNode } from '../ast/EventListenerNode.js';
import { LayerNode } from '../ast/LayerNode.js';
import { type FactoryDefinition } from '../serialization/FactoryDefinition.js';

const RESERVED_PARAMETER_MODES = ['value', 'text', 'widget'];
const RESERVED_ELEMENT_NAMES = ['script', 'ui-tree'];

/**
 * The base lazy-widgets XML namespace. All lazy-widgets namespaces will be
 * prefixed with this. lazy-widgets elements must use this namespace.
 *
 * @category XML
 */
export const XML_NAMESPACE_BASE = 'lazy-widgets';
export const XML_NAMESPACE_PREFIX = `${XML_NAMESPACE_BASE}:`;
export const XML_SUB_NAMESPACE_OPTIONS = 'options';
export const XML_SUB_NAMESPACE_ON = 'on';
export const XML_SUB_NAMESPACE_ONCE = 'once';

function getSubNamespace(namespace: string): string {
    return namespace.substring(XML_NAMESPACE_PREFIX.length);
}

function namespaceMatches(namespace: string | null, subNamespace?: string | null): boolean {
    if (namespace === null) {
        return false;
    } if (subNamespace === undefined) {
        return namespace === XML_NAMESPACE_BASE || namespace.startsWith(XML_NAMESPACE_PREFIX);
    } else if (subNamespace === null) {
        return namespace === XML_NAMESPACE_BASE;
    } else if (!namespace.startsWith(XML_NAMESPACE_PREFIX)) {
        return false;
    } else {
        return getSubNamespace(namespace) === subNamespace;
    }
}

/**
 * A bare-bones XML UI parser. This must not be used directly as this is an
 * extensible parser; you are supported to create a subclass of this and add all
 * the features/validators that you need.
 *
 * You won't need to create your own parser unless you have an XML format that
 * is not compatible with the default format. Most times it's enough to use
 * {@link XMLUIParser} and register new features if necessary.
 *
 * @category XML
 */
export abstract class BaseXMLUIParser {
    /** The DOMParser to actually parse the XML into nodes */
    private domParser = new DOMParser();
    /** A map which assigns a factory function to an element name. */
    private factories = new Map<string, FactoryDefinition>();
    /**
     * A map which assigns a validator function to a unique name, allowing a
     * validator to be referred to by string. Referred to as built-in
     * validators.
     */
    private validators = new Map<string, WidgetAutoXMLConfigValidator>();
    /**
     * A map which assigns a single character string prefix to a string
     * deserializer.
     */
    private attributeValueDeserializers = new Map<string, XMLAttributeValueDeserializer>();
    /** A map which assigns an attribute namespace to a handler function. */
    private attributeNamespaceHandlers = new Map<string, XMLAttributeNamespaceHandler>();
    /** A map which assigns an element name to a an XML element deserializer. */
    private elementDeserializers = new Map<string, [elementDeserializer: XMLElementDeserializer, parameterMode: string]>();
    /** A map which defines custom parameter modes. */
    private parameterModes = new Map<string, [validator: XMLParameterModeValidator | null, canBeList: boolean, canBeOptional: boolean]>;
    /** A list of functions that modify a factory's parameter list. */
    private argumentModifiers = new Array<XMLArgumentModifier>;
    /**
     * A list of functions that are invoked after a widget is instanced, so that
     * the instance can be modified post-initialization.
     */
    private postInitHooks = new Array<XMLPostInitHook>;

    /**
     * Parse a value in an attribute. The value will be deserialized according
     * to its prefix. If there is no prefix, the value is treated as a string.
     *
     * @param rawValue - The value in the attribute, with the prefix included
     * @param context - The current parser context, which will be passed to a deserializer if the value is prefixed with a registered deserializer prefix
     */
    parseAttributeValue(rawValue: string, context: ASTInstantiationContext): unknown {
        if (rawValue.length === 0) {
            return rawValue;
        }

        const deserializer = this.attributeValueDeserializers.get(rawValue[0]);
        if (deserializer) {
            // encoded value
            return deserializer(this, context, rawValue.slice(1));
        } else {
            // just a string
            return rawValue;
        }
    }

    /**
     * Find the next unset parameter of a given mode.
     *
     * @param paramConfig - The input mapping of the widget being built
     * @param parametersSet - A list containing which of the parameters in the input mapping are already set
     * @param mode - The parameter mode to find
     * @returns Returns the index of the next unset parameter of the wanted mode. If none are found, -1 is returned.
     */
    findNextParamOfType(paramConfig: WidgetXMLInputConfig, parametersSet: Array<boolean>, mode: string) {
        const paramCount = paramConfig.length;
        let canBeList = false;

        if (RESERVED_PARAMETER_MODES.indexOf(mode) > 0) {
            canBeList = mode === 'widget';
        } else {
            const parameterModeConfig = this.parameterModes.get(mode);

            if (parameterModeConfig === undefined) {
                throw new Error(`Invalid parameter mode "${mode}"`);
            }

            canBeList = parameterModeConfig[1];
        }

        for (let i = 0; i < paramCount; i++) {
            const param = paramConfig[i];
            if (param.mode === mode && (!parametersSet[i] || (canBeList && (param as { list: boolean }).list))) {
                return i;
            }
        }

        return -1;
    }

    getFactory(kebabName: string): FactoryDefinition | undefined {
        return this.factories.get(kebabName);
    }

    getParameterMode(mode: string) {
        // TODO remove this. parameter mode configs should be dictated by the
        // implementation of an ArgumentNode
        return this.parameterModes.get(mode);
    }

    /**
     * Register a built-in validator; assigns a string to a validator function,
     * so that the validator function can be referred to via a string instead of
     * via a function.
     *
     * @param key - The validator key - the string that will be used instead of the function
     * @param validator - A function which can throw an error on an invalid value, and transform an input value. Can be chained
     */
    registerValidator(key: string, validator: WidgetAutoXMLConfigValidator) {
        if (this.validators.has(key)) {
            throw new Error(`Built-in validator key "${key}" already taken`);
        }

        this.validators.set(key, validator);
    }

    /**
     * Register a attribute value deserializer; assigns a deserializer function
     * to a single character prefix. The value will be passed to the
     * deserializer without the prefix.
     *
     * @param prefix - A single character prefix that decides which deserializer to use. Must be unique
     * @param deserializer - A function that transforms a string without the prefix into any value
     */
    registerAttributeValueDeserializer(prefix: string, deserializer: XMLAttributeValueDeserializer) {
        if (prefix.length !== 1) {
            throw new Error('Attribute deserializer prefix must be a single character');
        }
        if (this.attributeValueDeserializers.has(prefix)) {
            throw new Error(`Attribute deserializer prefix "${prefix}" already taken`);
        }

        this.attributeValueDeserializers.set(prefix, deserializer);
    }

    /**
     * Register a attribute namespace handler; assigns a handler function to a
     * unique namespace. The attribute object will be passed to the handler
     * function.
     *
     * @param namespace - A unique namespace. When this namespace is found in an attribute, instead of ignoring the attribute, the attribute will be passed to the handler
     * @param handler - A function that provides custom functionality when an attribute with the wanted namespace is used
     */
    registerAttributeNamespaceHandler(namespace: string, handler: XMLAttributeNamespaceHandler) {
        if (namespace.length === 0) {
            throw new Error('Namespace must not be empty');
        }
        if (namespace === XML_NAMESPACE_BASE) {
            throw new Error(`Namespace must not be the base namespace ("${XML_NAMESPACE_BASE}")`);
        }
        if (this.attributeNamespaceHandlers.has(namespace)) {
            throw new Error(`Attribute namespace "${namespace}" already taken`);
        }

        this.attributeNamespaceHandlers.set(namespace, handler);
    }

    /**
     * Register an element deserializer function; elements with the wanted name
     * will be treated as parameters serialized as an element instead of an
     * attribute.
     *
     * @param nodeName - A unique node name. Widgets will not be able to be registered with this name
     * @param parameterMode - The parameter mode to treat the value as
     * @param deserializer - The deserializer function that turns the XML element into a value
     */
    registerElementDeserializer(nodeName: string, parameterMode: string, deserializer: XMLElementDeserializer) {
        if (nodeName.length === 0) {
            throw new Error('Element deserializer node name must not be an empty string');
        }
        if (this.elementDeserializers.has(nodeName)) {
            throw new Error(`Element deserializer node name "${nodeName}" already taken by another element deserializer`);
        }
        if (this.factories.has(nodeName)) {
            throw new Error(`Element deserializer node name "${nodeName}" already taken by a widget factory`);
        }

        this.elementDeserializers.set(nodeName, [deserializer, parameterMode]);
    }

    /**
     * Registers a parameter mode; defines whether the parameter mode can be a
     * list, can be optional and how it's validated.
     *
     * @param parameterMode - A string that is used as a key for this parameter mode
     * @param validator - A function that validates whether a deserialized value is valid for this mode
     * @param canBeList - If true, when a parameter with this mode has a config with a `list` field set to true, the parameter will be treated as a list
     * @param canBeOptional - If true, when a parameter with this mode has a config with a `optional` field set to true, the parameter will be optional (no error thrown if undefined)
     */
    registerParameterMode(parameterMode: string, validator: XMLParameterModeValidator, canBeList: boolean, canBeOptional: boolean) {
        if (parameterMode.length === 0) {
            throw new Error('Parameter mode must not be an empty string');
        }
        if (this.parameterModes.has(parameterMode)) {
            throw new Error(`Parameter mode "${parameterMode}" already taken`);
        }

        this.parameterModes.set(parameterMode, [validator, canBeList, canBeOptional]);
    }

    /**
     * Register an argument modifier.
     *
     * @param modifier - A function that modifies an argument list passed to a factory. The function will be added to the end of the modifier list
     */
    registerArgumentModifier(modifier: XMLArgumentModifier) {
        this.argumentModifiers.push(modifier);
    }

    /**
     * Register a post-initialization hook.
     *
     * @param hook - A function that will be called after a widget instance is created. The instance will be passed to the function, so it can be used to modify the instance post-initialization
     */
    registerPostInitHook(hook: XMLPostInitHook) {
        this.postInitHooks.push(hook);
    }

    /**
     * Parse an XML document which can contain multiple <ui-tree> descendants.
     *
     * @param xmlDoc - The XML document to parse
     * @param config - The configuration object to use for the parser
     * @returns Returns a pair containing, respectively, a Map which maps a UI tree name to a widget, and the parser context after all UI trees are parsed
     */
    parseFromXMLDocument(xmlDoc: XMLDocument, config?: ASTInstantiationConfig): [Map<string, Widget>, ASTInstantiationContext] {
        const rootNode = this.getParseTreeFromXMLDocument(xmlDoc);
        return rootNode.instantiateUITrees(this, config);
    }

    /**
     * Parse an XML string. {@link BaseXMLUIParser#parseFromXMLDocument} will be
     * called.
     *
     * @param str - A string containing an XML document
     * @param config - The configuration object to use for the parser
     * @returns Returns a pair containing, respectively, a Map which maps a UI tree name to a widget, and the parser context after all UI trees are parsed
     */
    parseFromString(str: string, config?: ASTInstantiationConfig): [Map<string, Widget>, ASTInstantiationContext] {
        const rootNode = this.getParseTreeFromString(str);
        return rootNode.instantiateUITrees(this, config);
    }

    /**
     * Parse an XML string from a URL. {@link BaseXMLUIParser#parseFromString}
     * will be called.
     *
     * @param resource - The URL to download the XML from
     * @param config - The configuration object to use for the parser
     * @param requestOptions - Options to use for the HTTP request
     * @returns Returns a pair containing, respectively, a Map which maps a UI tree name to a widget, and the parser context after all UI trees are parsed. Returned asynchronously as a promise
     */
    async parseFromURL(resource: RequestInfo | URL, config?: ASTInstantiationConfig, requestOptions?: RequestInit): Promise<[Map<string, Widget>, ASTInstantiationContext]> {
        const rootNode = await this.getParseTreeFromURL(resource, requestOptions);
        return rootNode.instantiateUITrees(this, config);
    }

    protected deserializeMetadata(node: Node, parent: ASTNode): void {
        const nodeType = node.nodeType;
        let meta: ASTNode | null = null;
        if (nodeType === Node.ELEMENT_NODE) {
            const elem = node as Element;
            meta = new MetadataElementNode(elem.localName, elem.namespaceURI);
        } else if (nodeType === Node.ATTRIBUTE_NODE) {
            const attr = node as Attr;
            meta = new MetadataAttributeNode(attr.localName, attr.value, attr.namespaceURI);
        } else if (nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE) {
            const text = node as Text;
            meta = new MetadataTextNode(text.data);
        } else if (nodeType === Node.COMMENT_NODE) {
            const text = node as Text;
            meta = new MetadataCommentNode(text.data);
        } else if (nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
            // TODO safe to ignore, or should it be kept as a new kind of
            //      metadata to be used by custom parsers?
        } else {
            throw new Error(`Unexpected XML node type: ${nodeType}`);
        }

        if (meta !== null) {
            parent.addChild(meta);
            parent = meta;
        }

        for (const child of node.childNodes) {
            this.deserializeMetadata(child, parent);
        }
    }

    protected deserializeLayer(layerElem: Element, widgetNode: WidgetNode): void {
        // make layer node
        const layerNode = new LayerNode();
        widgetNode.addChild(layerNode);

        // look for can-expand/name attributes and a single widget element
        for (const child of layerElem.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.ELEMENT_NODE) {
                const elem = child as Element;
                const namespace = elem.namespaceURI;

                if (namespaceMatches(namespace, null)) {
                    if (layerNode.hasChildOfType(WidgetNode.type)) {
                        throw new Error('Layers can only have one widget');
                    }

                    this.deserializeWidget(elem, layerNode);
                } else if (namespaceMatches(namespace)) {
                    throw new Error('Unexpected element with non-base library namespace as child of layer');
                } else {
                    this.deserializeMetadata(elem, layerNode);
                }
            } else if (nodeType === Node.ATTRIBUTE_NODE) {
                const attr = child as Node as Attr;
                const namespace = attr.namespaceURI;

                if (namespaceMatches(namespace, null)) {
                    const name = attr.localName;
                    if (name === 'name') {
                        layerNode.nameRaw = name;
                    } else if (name === 'can-expand') {
                        layerNode.canExpandRaw = attr.value;
                    } else {
                        throw new Error(`Unknown layer attribute "${name}"`);
                    }
                } else if (namespaceMatches(namespace)) {
                    throw new Error('Unexpected attribute with non-base library namespace in layer');
                } else {
                    this.deserializeMetadata(attr, layerNode);
                }
            } else if (nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE) {
                throw new Error('Unexpected text node as child of layer');
            } else if (nodeType === Node.COMMENT_NODE) {
                this.deserializeMetadata(child, widgetNode);
            } else if (nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                // TODO safe to ignore, or should it be kept as a new kind of
                //      metadata to be used by custom parsers?
            } else {
                throw new Error(`Unexpected XML node type: ${nodeType}`);
            }
        }

        // verify layer has widget
        if (!layerNode.hasChildOfType(WidgetNode.type)) {
            throw new Error('Layer has no child widget');
        }
    }

    protected deserializeWidgetChildElement(elem: Element, widgetNode: WidgetNode): void {
        const namespace = elem.namespaceURI;

        if (namespaceMatches(namespace, null)) {
            const name = elem.localName;
            if (name === 'layer') {
                this.deserializeLayer(elem, widgetNode);
            } else {
                this.deserializeWidget(elem, widgetNode);
            }
        } else if (namespaceMatches(namespace)) {
            throw new Error(`Unexpected element using non-base library namespace`);
        } else {
            this.deserializeMetadata(elem, widgetNode);
        }
    }

    protected deserializeWidgetAttribute(attr: Attr, widgetNode: WidgetNode): void {
        const namespace = attr.namespaceURI;

        if (namespaceMatches(namespace, null)) {
            // value
            widgetNode.addChild(new ValueNode(attr.localName, attr.value));
        } else if (namespaceMatches(namespace, XML_SUB_NAMESPACE_OPTIONS)) {
            // options
            // get current or make options node
            let optionsNode = widgetNode.getFirstChildOfType(OptionsNode.type);
            if (optionsNode === null) {
                optionsNode = new OptionsNode();
                widgetNode.addChild(optionsNode);
            }

            // add to options node
            const name = attr.localName;
            if (name === '_') {
                // options object
                optionsNode.addChild(new OptionsObjectNode(attr.value));
            } else {
                // lone option
                optionsNode.addChild(new LoneOptionNode(name, attr.value));
            }
        } else {
            const isOnce = namespaceMatches(namespace, XML_SUB_NAMESPACE_ONCE);
            if (isOnce || namespaceMatches(namespace, XML_SUB_NAMESPACE_ON)) {
                // on/once
                const name = attr.localName;
                if (name === '_') {
                    // any event type
                    if (isOnce) {
                        throw new Error("Event listeners that listen to any event type can't be triggered only once");
                    }

                    widgetNode.addChild(new AnyEventListenerNode(attr.value));
                } else {
                    // specific event type
                    widgetNode.addChild(new EventListenerNode(attr.localName, attr.value, isOnce));
                }
            } else {
                this.deserializeMetadata(attr, widgetNode);
            }
        }
    }

    protected deserializeWidget(widgetElem: Element, parent: ASTNode): void {
        // get factory
        const factoryName = widgetElem.localName;
        const factoryDefinition = this.factories.get(factoryName);
        if (factoryDefinition === undefined) {
            throw new Error(`No factory registered to name "${factoryName}"`);
        }

        // make widget node
        const widgetNode = new WidgetNode(factoryName);
        parent.addChild(widgetNode);

        // look for widget/layer elements, argument/option/listener attributes
        // and text nodes. deserialize comments and elements/attributes that
        // don't use library namespaces as metadata nodes
        const textParts = new Array<string>();

        for (const child of widgetElem.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.ELEMENT_NODE) {
                this.deserializeWidgetChildElement(child as Element, widgetNode);
            } else if (nodeType === Node.ATTRIBUTE_NODE) {
                // XXX for some reason directly casting ChildNode to Attr
                //     doesn't work
                this.deserializeWidgetAttribute(child as Node as Attr, widgetNode);
            } else if (nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE) {
                textParts.push((child as Text).data);
            } else if (nodeType === Node.COMMENT_NODE) {
                this.deserializeMetadata(child, widgetNode);
            } else if (nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                // TODO safe to ignore, or should it be kept as a new kind of
                //      metadata to be used by custom parsers?
            } else {
                throw new Error(`Unexpected XML node type: ${nodeType}`);
            }
        }

        // make text node if text is present
        if (textParts.length > 0) {
            widgetNode.addChild(new TextNode(textParts.join('')));
        }
    }

    protected deserializeUITree(uiTreeElem: Element, rootNode: RootNode): void {
        // get ui tree name
        const uiTreeName = uiTreeElem.getAttributeNS(XML_NAMESPACE_BASE, 'name');
        if (uiTreeName === null) {
            throw new Error('Unexpected unnamed UI tree');
        }

        // make ui tree node
        const uiTree = new UITreeNode(uiTreeName);
        rootNode.addChild(uiTree);

        // look for script elements and a single non-script element (treated as
        // a widget). deserialize comments and elements/attributes that don't
        // use library namespaces as metadata nodes
        for (const child of uiTreeElem.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.ELEMENT_NODE) {
                const elem = child as Element;
                const namespace = elem.namespaceURI;

                if (namespace === XML_NAMESPACE_BASE) {
                    const name = elem.localName;
                    if (name === 'script') {
                        this.deserializeScript(elem, uiTree);
                    } else {
                        this.deserializeWidget(elem, uiTree);
                    }
                } else if (namespaceMatches(namespace)) {
                    throw new Error(`Unexpected element using non-base library namespace`);
                } else {
                    this.deserializeMetadata(elem, uiTree);
                }
            } else if (nodeType === Node.ATTRIBUTE_NODE) {
                // XXX for some reason directly casting ChildNode to Attr
                //     doesn't work
                const attr = child as Node as Attr;
                const namespace = attr.namespaceURI;

                if (namespace === XML_NAMESPACE_BASE) {
                    if (attr.localName !== 'name') {
                        throw new Error(`Unexpected attribute with name "${attr.localName}" using base library namespace`);
                    }
                } else if (namespaceMatches(namespace)) {
                    throw new Error(`Unexpected attribute using non-base library namespace`);
                } else {
                    this.deserializeMetadata(attr, uiTree);
                }
            } else if (nodeType === Node.TEXT_NODE) {
                if (!WHITESPACE_REGEX.test((child as CharacterData).data)) {
                    throw new Error('Unexpected text node as child of root node');
                }
            } else if (nodeType === Node.CDATA_SECTION_NODE) {
                throw new Error(`Unexpected CDATA node as child of root node`);
            } else if (nodeType === Node.COMMENT_NODE) {
                this.deserializeMetadata(child, uiTree);
            } else if (nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                // TODO safe to ignore, or should it be kept as a new kind of
                //      metadata to be used by custom parsers?
            } else {
                throw new Error(`Unexpected XML node type: ${nodeType}`);
            }
        }
    }

    protected deserializeScript(elem: Element, parent: RootNode | UITreeNode): void {
        // collect text parts
        const textParts = new Array<string>();

        for (const child of elem.childNodes) {
            const nodeType = child.nodeType;
            // TODO should external scripts be allowed? src="yadayada.js"
            if (nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE) {
                textParts.push((child as Text).data);
            } else {
                throw new Error(`Unexpected node type ${nodeType} as child of script element`);
            }
        }

        // join text parts into script node
        parent.addChild(new ScriptNode(textParts.join('')));
    }

    protected deserializeRootDescendants(node: Node, rootNode: RootNode, foundRoot = false): void {
        // look for ui-tree and script elements (or a root element if it hasn't
        // been found yet). deserialize comments and elements/attributes that
        // don't use library namespaces as metadata nodes
        for (const child of node.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.ELEMENT_NODE) {
                const elem = child as Element;
                const namespace = elem.namespaceURI;

                if (namespaceMatches(namespace)) {
                    if (namespace !== XML_NAMESPACE_BASE) {
                        throw new Error(`Unexpected element using non-base library namespace`);
                    }

                    const name = elem.localName;
                    if (name === 'root') {
                        if (foundRoot) {
                            throw new Error(`Unexpected root element inside root element`);
                        } else {
                            this.deserializeRootDescendants(elem, rootNode, true);
                        }
                    } else if (name === 'ui-tree') {
                        this.deserializeUITree(elem, rootNode);
                    } else if (name === 'script') {
                        this.deserializeScript(elem, rootNode);
                    } else {
                        throw new Error(`Unexpected element with name "${name}" using base library namespace`);
                    }
                } else {
                    this.deserializeMetadata(elem, rootNode);
                }
            } else if (nodeType === Node.ATTRIBUTE_NODE) {
                // XXX for some reason directly casting ChildNode to Attr
                //     doesn't work
                const attr = child as Node as Attr;
                const namespace = attr.namespaceURI;

                if (namespaceMatches(namespace)) {
                    throw new Error(`Unexpected attribute with name "${attr.localName}" using library namespace`);
                } else {
                    this.deserializeMetadata(attr, rootNode);
                }
            } else if (nodeType === Node.TEXT_NODE) {
                if (!WHITESPACE_REGEX.test((child as CharacterData).data)) {
                    throw new Error('Unexpected text node');
                }
            } else if (nodeType === Node.CDATA_SECTION_NODE) {
                throw new Error(`Unexpected CDATA node`);
            } else if (nodeType === Node.COMMENT_NODE) {
                this.deserializeMetadata(child, rootNode);
            } else if (nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                // TODO safe to ignore, or should it be kept as a new kind of
                //      metadata to be used by custom parsers?
            } else {
                throw new Error(`Unexpected XML node type: ${nodeType}`);
            }
        }
    }

    getParseTreeFromXMLDocument(xmlDoc: XMLDocument): RootNode {
        // deserialize all UI trees
        const rootNode = new RootNode();
        this.deserializeRootDescendants(xmlDoc, rootNode);
        return rootNode;
    }

    getParseTreeFromString(str: string): RootNode {
        const xmlDoc = this.domParser.parseFromString(str, 'text/xml');

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            throw new Error('Invalid XML');
        }

        return this.getParseTreeFromXMLDocument(xmlDoc);
    }

    async getParseTreeFromURL(resource: RequestInfo | URL, requestOptions?: RequestInit): Promise<RootNode> {
        const response = await fetch(resource, requestOptions);

        if (!response.ok) {
            throw new Error(`Response not OK (status code ${response.status})`);
        }

        return this.getParseTreeFromString(await response.text());
    }
}
