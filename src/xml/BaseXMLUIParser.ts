import { Widget } from '../widgets/Widget';
import { toKebabCase } from '../helpers/toKebabCase';
import type { WidgetAutoXML, WidgetAutoXMLConfig, WidgetAutoXMLConfigParameter, WidgetAutoXMLConfigTextParameter, WidgetAutoXMLConfigValidator, WidgetAutoXMLConfigValueParameter, WidgetAutoXMLConfigWidgetParameter } from './WidgetAutoXML';
import type { XMLUIParserConfig } from './XMLUIParserConfig';
import type { XMLUIParserContext } from './XMLUIParserContext';
import type { XMLUIParserScriptContext } from './XMLUIParserScriptContext';
import type { XMLWidgetFactory } from './XMLWidgetFactory';
import type { XMLAttributeValueDeserializer } from './XMLAttributeValueDeserializer';
import type { XMLAttributeNamespaceHandler } from './XMLAttributeNamespaceHandler';
import type { XMLElementDeserializer } from './XMLElementDeserializer';
import type { XMLParameterModeValidator } from './XMLParameterModeValidator';
import type { XMLParameterModifier } from './XMLParameterModifier';
import type { XMLPostInitHook } from './XMLPostInitHook';

export const WHITESPACE_REGEX = /^\s*$/;
export const XML_NAMESPACE_BASE = 'lazy-widgets';

const RESERVED_PARAMETER_MODES = ['value', 'text', 'widget'];
const RESERVED_ELEMENT_NAMES = ['script', 'ui-tree'];
const RESERVED_IMPORTS = ['context', 'window', 'globalThis'];

/**
 * Makes sure a map-like value, such as a Record, is transformed to a Map.
 *
 * @param record - The map-like value to transform. If nothing is supplied, then an empty Map is created automatically
 * @returns Returns a new Map that is equivalent to the input, or the input if the input is already a Map
 * @internal
 */
function normalizeToMap(record: Record<string, unknown> | Map<string, unknown> = new Map()) {
    if (!(record instanceof Map)) {
        const orig = record;
        record = new Map();

        for (const key of Object.getOwnPropertyNames(orig)) {
            record.set(key, orig[key]);
        }
    }

    return record;
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
    private factories = new Map<string, (context: XMLUIParserContext, elem: Element) => Widget>();
    private validators = new Map<string, WidgetAutoXMLConfigValidator>();
    private attributeValueDeserializers = new Map<string, XMLAttributeValueDeserializer>();
    private attributeNamespaceDeserializers = new Map<string, XMLAttributeNamespaceHandler>();
    private elementDeserializers = new Map<string, [elementDeserializer: XMLElementDeserializer, parameterMode: string]>();
    private parameterModes = new Map<string, [validator: XMLParameterModeValidator | null, canBeList: boolean, canBeOptional: boolean]>;
    private parameterModifiers = new Array<XMLParameterModifier>;
    private postInitHooks = new Array<XMLPostInitHook>;

    parseAttributeValue(rawValue: string, context: XMLUIParserContext): unknown {
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

    findNextParamOfType(paramConfig: WidgetAutoXMLConfig, parametersSet: Array<boolean>, mode: string) {
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

    private instantiateWidget(inputConfig: WidgetAutoXMLConfig, paramNames: Map<string, number>, paramValidators: Map<number, (inputValue: unknown) => unknown>, factory: XMLWidgetFactory, context: XMLUIParserContext, elem: Element) {
        // parse parameters and options
        const paramCount = inputConfig.length;
        const instantiationContext: Record<string, unknown> = {};
        const parameters = new Array<unknown>(paramCount);
        const setParameters = new Array<boolean>(paramCount).fill(false);
        const setViaName = new Array<boolean>(paramCount).fill(false);

        for (const attribute of elem.attributes) {
            const namespace = attribute.namespaceURI;
            if (namespace === null || namespace === XML_NAMESPACE_BASE) {
                // this attribute sets a parameter's value
                const index = paramNames.get(attribute.localName);
                if (index === undefined) {
                    throw new Error(`Can't set parameter "${attribute.localName}"; parameter does not exist for this widget`);
                }

                if (setParameters[index]) {
                    throw new Error(`Can't set parameter "${attribute.localName}"; parameter was already set`);
                }

                setParameters[index] = true;
                setViaName[index] = true;

                const arg = this.parseAttributeValue(attribute.value, context);
                const paramConfig = inputConfig[index];

                if (paramConfig.mode === 'value') {
                    if (arg === undefined) {
                        if (!paramConfig.optional) {
                            throw new Error(`Required parameters (${paramConfig.name}) can't be undefined`);
                        }
                    } else {
                        const validator = paramValidators.get(index);
                        if (validator === undefined) {
                            parameters[index] = arg;
                        } else {
                            parameters[index] = validator(arg);
                        }
                    }
                } else if (paramConfig.mode === 'widget') {
                    if (arg === undefined) {
                        if (!paramConfig.optional) {
                            throw new Error(`Required parameters (${paramConfig.name}) can't be undefined`);
                        }
                    } else {
                        const validator = (paramConfig as WidgetAutoXMLConfigWidgetParameter).validator;

                        if (paramConfig.list) {
                            if (!Array.isArray(arg)) {
                                throw new Error(`Parameter "${paramConfig.name}" must be an array of Widgets`);
                            }

                            if (validator) {
                                const validArg = [];
                                for (const widget of arg) {
                                    validArg.push(validator(widget));
                                }

                                parameters[index] = validArg;
                            } else {
                                parameters[index] = arg;
                            }
                        } else {
                            if (!(arg instanceof Widget)) {
                                throw new Error(`Parameter "${paramConfig.name}" must be a Widget`);
                            }

                            if (validator) {
                                parameters[index] = validator(arg);
                            } else {
                                parameters[index] = arg;
                            }
                        }
                    }
                } else if (paramConfig.mode === 'text') {
                    if (arg === undefined) {
                        throw new Error(`Text parameters (${paramConfig.name}) can't be undefined`);
                    } else {
                        if (typeof arg !== 'string') {
                            throw new Error(`Text parameters (${paramConfig.name}) must be strings`);
                        }

                        parameters[index] = arg;
                    }
                } else {
                    const paramModeConfig = this.parameterModes.get(paramConfig.mode);
                    if (!paramModeConfig) {
                        throw new Error(`Unknown parameter mode "${paramConfig.mode}"; this is a bug, since there is an earlier check for this, please report it`);
                    }

                    const [validator, canBeList, canBeOptional] = paramModeConfig;

                    if (arg === undefined) {
                        if (!canBeOptional || !paramConfig.optional) {
                            throw new Error(`Required parameters (${paramConfig.name}) can't be undefined`);
                        }
                    } else {
                        if (canBeList && paramConfig.list) {
                            if (!Array.isArray(arg)) {
                                throw new Error(`Parameter "${paramConfig.name}" must be an array`);
                            }

                            if (validator) {
                                const validArg = [];
                                for (const value of arg) {
                                    validArg.push(validator(this, context, paramConfig, value));
                                }

                                parameters[index] = validArg;
                            } else {
                                parameters[index] = arg;
                            }
                        } else if (validator) {
                            parameters[index] = validator(this, context, paramConfig, arg);
                        } else {
                            parameters[index] = arg;
                        }
                    }
                }
            } else {
                const deserializer = this.attributeNamespaceDeserializers.get(namespace);
                if (deserializer) {
                    deserializer(this, context, instantiationContext, attribute);
                }
            }
        }

        // parse child elements (widgets, layers and text nodes)
        let textContent = '';
        for (const childNode of elem.childNodes) {
            const nodeType = childNode.nodeType;

            if (nodeType === Node.DOCUMENT_NODE) {
                throw new Error('Unexpected document node in XML file');
            } else if (nodeType === Node.DOCUMENT_TYPE_NODE) {
                throw new Error('Unexpected document type node in XML file');
            } else if (nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                throw new Error('Unexpected document fragment node in XML file');
            } else if (nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE) {
                textContent += (childNode as CharacterData).data;
            } else if (nodeType === Node.ELEMENT_NODE) {
                const childElem = childNode as Element;
                if (childElem.namespaceURI !== XML_NAMESPACE_BASE) {
                    continue;
                }

                const lowerNodeName = childElem.nodeName.toLowerCase();
                const deserializerTuple = this.elementDeserializers.get(lowerNodeName);
                if (deserializerTuple) {
                    const [deserializer, parameterMode] = deserializerTuple;
                    const parameterModeTuple = this.parameterModes.get(parameterMode);

                    if (!parameterModeTuple) {
                        throw new Error(`Parameter mode "${parameterMode}" for element deserializer "${lowerNodeName}" is missing; this is a bug, please report it`);
                    }

                    const canBeList = parameterModeTuple[1];
                    const index = this.findNextParamOfType(inputConfig, setParameters, parameterMode);
                    const value = deserializer(this, context, childElem);
                    setParameters[index] = true;

                    if (canBeList && (inputConfig[index] as { list?: boolean }).list) {
                        if (parameters[index] === undefined) {
                            parameters[index] = [value];
                        } else {
                            (parameters[index] as Array<unknown>).push(value);
                        }
                    } else {
                        parameters[index] = value;
                    }
                } else {
                    // validator
                    const index = this.findNextParamOfType(inputConfig, setParameters, 'widget');
                    const childWidget = this.parseWidgetElem(context, childElem);
                    setParameters[index] = true;

                    if ((inputConfig[index] as WidgetAutoXMLConfigWidgetParameter).list) {
                        if (parameters[index] === undefined) {
                            parameters[index] = [childWidget];
                        } else {
                            (parameters[index] as Array<Widget>).push(childWidget);
                        }
                    } else {
                        parameters[index] = childWidget;
                    }
                }
            }
        }

        // add text parameter if needed
        const textIndex = this.findNextParamOfType(inputConfig, setParameters, 'text');
        if (textIndex >= 0) {
            parameters[textIndex] = textContent;
            setParameters[textIndex] = true;
        } else if (!WHITESPACE_REGEX.test(textContent)) {
            throw new Error('XML widget has a child text node, but there are no text parameters left to fill');
        }

        // check if all required parameters are set
        for (let i = 0; i < paramCount; i++) {
            if (!setParameters[i]) {
                const param = inputConfig[i];
                const mode = param.mode;
                if (mode === 'value' || mode === 'text') {
                    if (!param.optional) {
                        throw new Error(`Parameter "${param.name}" with mode "${mode}" is not set`);
                    }
                } else {
                    const modeConfig = this.parameterModes.get(mode);
                    if (modeConfig === undefined) {
                        throw new Error(`Unknown parameter mode "${mode}"; this is a bug, since there is an earlier check for this, please report it`);
                    }

                    if (!modeConfig[2] || !(param as { optional: boolean }).optional) {
                        throw new Error(`Required parameter "${param.name}"`);
                    }
                }
            }
        }

        // modify parameters
        for (const modifier of this.parameterModifiers) {
            modifier(this, context, instantiationContext, parameters);
        }

        // instantiate widget
        const instance = factory(...parameters);

        // map widget back to ID
        if (instance.id !== null) {
            if (context.idMap.has(instance.id)) {
                throw new Error(`Widget ID "${instance.id}" is already taken`);
            }

            context.idMap.set(instance.id, instance);
        }

        // post-init hooks
        for (const hook of this.postInitHooks) {
            hook(this, context, instantiationContext, instance);
        }

        return instance;
    }

    registerFactory(name: string, inputConfig: WidgetAutoXMLConfig, factory: XMLWidgetFactory): void;
    registerFactory<T extends Widget>(widgetClass: new (...args: unknown[]) => T, inputConfig: WidgetAutoXMLConfig, factory: XMLWidgetFactory): void;
    registerFactory<T extends Widget = Widget>(nameOrWidgetClass: string | (new (...args: unknown[]) => T), inputConfig: WidgetAutoXMLConfig, factory: XMLWidgetFactory) {
        // handle constructors as names
        let factoryName = nameOrWidgetClass;
        if (typeof factoryName !== 'string') {
            factoryName = factoryName.name;
        }

        // make sure name is in kebab-case; element names are case-insensitive,
        // but just toLowerCase'ing it makes the tag names unreadable if the
        // string originally in camelCase or PascalCase
        factoryName = toKebabCase(factoryName);

        // make sure the name is not reserved/taken
        if (RESERVED_ELEMENT_NAMES.indexOf(factoryName) >= 0) {
            throw new Error(`The factory name "${factoryName}" is reserved`);
        }
        if (this.factories.has(factoryName)) {
            throw new Error(`The factory name "${factoryName}" is already taken by another factory`);
        }
        if (this.elementDeserializers.has(factoryName)) {
            throw new Error(`The factory name "${factoryName}" is already taken by an element deserializer`);
        }

        // validate parameter config and build parameter name map
        let hasTextNodeParam = false;
        const traps = new Set<string>();
        const paramValidators = new Map<number, (inputValue: unknown) => unknown>();
        const paramNames = new Map<string, number>();
        const paramCount = inputConfig.length;

        for (let i = 0; i < paramCount; i++) {
            const paramGeneric = inputConfig[i];

            if (paramGeneric.mode === 'value') {
                const param = paramGeneric as WidgetAutoXMLConfigValueParameter;

                if (param.validator !== undefined) {
                    let validators: Array<WidgetAutoXMLConfigValidator | string>;

                    // split validators into validation functions and strings
                    if (typeof param.validator === 'string') {
                        validators = param.validator.split(':');
                    } else if (typeof param.validator === 'function') {
                        validators = [param.validator];
                    } else if (Array.isArray(param.validator)) {
                        validators = [];

                        for (const subValidator of param.validator) {
                            if (typeof subValidator === 'string') {
                                validators.push(...subValidator.split(':'));
                            } else if (typeof subValidator === 'function') {
                                validators.push(subValidator);
                            } else {
                                throw new Error(`Invalid validator type: ${typeof subValidator}`);
                            }
                        }
                    } else {
                        throw new Error(`Invalid validator type: ${typeof param.validator}`);
                    }

                    // convert built-in validators (strings) to functions
                    const validatorCount = validators.length;
                    if (validatorCount > 0) {
                        for (let v = 0; v < validatorCount; v++) {
                            const rawValidator = validators[v];
                            if (rawValidator === '') {
                                throw new Error('Leading or trailing ":" in validator list');
                            } else if (typeof rawValidator === 'string') {
                                const func = this.validators.get(rawValidator);
                                if (func === undefined) {
                                    throw new Error(`Built-in validator "${rawValidator}" does not exist`);
                                }

                                validators[v] = func;
                            }
                        }

                        // merge validators into a single validator
                        paramValidators.set(i, (inputValue: unknown) =>  {
                            let value = inputValue;
                            for (let v = 0, stop = false; !stop && v < validatorCount; v++) {
                                [value, stop] = (validators[v] as WidgetAutoXMLConfigValidator)(value);
                            }

                            return value;
                        });
                    }
                }

                paramNames.set(param.name, i);
            } else if (paramGeneric.mode === 'text') {
                const param = paramGeneric as WidgetAutoXMLConfigTextParameter;

                if (hasTextNodeParam) {
                    throw new Error('Cannot add another "text" mode parameter; there can only be one text parameter. If you have more string parameters, add them as "value" mode parameters with a "string" validator, and only keep the most important string parameter as the "text" mode parameter');
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }

                hasTextNodeParam = true;
            } else if (paramGeneric.mode === 'widget') {
                const param = paramGeneric as WidgetAutoXMLConfigWidgetParameter;
                if (traps.has('widget')) {
                    throw new Error('Cannot add another "widget" mode parameter; there is already a previous widget parameter that is optional or a list');
                }

                if (param.list || param.optional) {
                    traps.add('widget');
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }
            } else {
                const param = paramGeneric as WidgetAutoXMLConfigParameter;
                const paramMode = param.mode;
                const paramConfig = this.parameterModes.get(paramMode);

                if (paramConfig === undefined) {
                    throw new Error(`Unknown parameter mode "${paramMode}"`);
                }

                const canBeList = paramConfig[1];
                const canBeOptional = paramConfig[2];

                if (traps.has(paramMode)) {
                    let msgEnd;
                    if (canBeList && canBeOptional) {
                        msgEnd = 'optional or a list';
                    } else if (canBeList) {
                        msgEnd = 'a list';
                    } else {
                        msgEnd = 'optional';
                    }

                    throw new Error(`Cannot add another "${paramMode}" parameter mode; there is already a previous parameter with the same mode that is ${msgEnd}`);
                }

                if ((canBeList && param.list) || (canBeOptional && param.optional)) {
                    traps.add(paramMode);
                }

                paramNames.set(param.name, i);
            }
        }

        // register factory
        this.factories.set(factoryName, this.instantiateWidget.bind(
            this, inputConfig, paramNames, paramValidators, factory
        ));
    }

    registerFactoryFromClass<T extends Widget>(widgetClass: new (...args: unknown[]) => T, autoConfig: WidgetAutoXMLConfig): void {
        this.registerFactory(widgetClass, autoConfig, (...args) => new widgetClass(...args));
    }

    registerValidator(key: string, validator: WidgetAutoXMLConfigValidator) {
        if (this.validators.has(key)) {
            throw new Error(`Built-in validator key "${key}" already taken`);
        }

        this.validators.set(key, validator);
    }

    registerAttributeValueDeserializer(prefix: string, deserializer: XMLAttributeValueDeserializer) {
        if (prefix.length !== 1) {
            throw new Error('Attribute deserializer prefix must be a single character');
        }
        if (this.attributeValueDeserializers.has(prefix)) {
            throw new Error(`Attribute deserializer prefix "${prefix}" already taken`);
        }

        this.attributeValueDeserializers.set(prefix, deserializer);
    }

    registerAttributeNamespaceHandler(namespace: string, deserializer: XMLAttributeNamespaceHandler) {
        if (namespace.length === 0) {
            throw new Error('Namespace must not be empty');
        }
        if (namespace === XML_NAMESPACE_BASE) {
            throw new Error(`Namespace must not be the base namespace ("${XML_NAMESPACE_BASE}")`);
        }
        if (this.attributeNamespaceDeserializers.has(namespace)) {
            throw new Error(`Attribute namespace "${namespace}" already taken`);
        }

        this.attributeNamespaceDeserializers.set(namespace, deserializer);
    }

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

    registerParameterMode(parameterMode: string, validator: XMLParameterModeValidator, canBeList: boolean, canBeOptional: boolean) {
        if (parameterMode.length === 0) {
            throw new Error('Parameter mode must not be an empty string');
        }
        if (this.parameterModes.has(parameterMode)) {
            throw new Error(`Parameter mode "${parameterMode}" already taken`);
        }

        this.parameterModes.set(parameterMode, [validator, canBeList, canBeOptional]);
    }

    registerAutoFactory<T extends Widget = Widget>(widgetClass: (new () => T) & { autoXML: WidgetAutoXML }) {
        if (widgetClass.autoXML === null) {
            throw new Error('Widget class does not have an automatic XML factory config object set. Must be manually registered');
        }

        if (Array.isArray(widgetClass.autoXML)) {
            this.registerFactoryFromClass(widgetClass, widgetClass.autoXML);
        } else {
            const config = widgetClass.autoXML;
            this.registerFactory(widgetClass, config.inputConfig, config.factory);
        }
    }

    registerParameterModifier(modifier: XMLParameterModifier) {
        this.parameterModifiers.push(modifier);
    }

    registerPostInitHook(hook: XMLPostInitHook) {
        this.postInitHooks.push(hook);
    }

    parseWidgetElem(context: XMLUIParserContext, elem: Element): Widget {
        // get factory for this element name
        const name = elem.nodeName.toLowerCase();
        const factory = this.factories.get(name);

        if (factory === undefined) {
            throw new Error(`No factory registered to name (${name})`);
        }

        // generate widget
        return factory(context, elem);
    }

    parseUITreeNode(uiTreeNode: Element, context: XMLUIParserContext): Widget {
        // iterate children. there should only be one child element with the
        // wanted namespace that represents a widget. there can be many script
        // elements
        let topWidget = null;
        for (const child of uiTreeNode.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.ELEMENT_NODE) {
                const childElem = child as Element;
                if (childElem.namespaceURI !== XML_NAMESPACE_BASE) {
                    continue;
                }

                // is this a widget or a script?
                if (childElem.localName === 'script') {
                    // script, check if we have permission to run it
                    if (context.scriptImports === null) {
                        throw new Error('Scripts are disabled');
                    }

                    // create script context
                    const scriptContext: XMLUIParserScriptContext = {
                        variables: context.variableMap,
                        ids: context.idMap
                    };

                    // concatenate all text
                    let text = '';
                    for (const grandChild of childElem.childNodes) {
                        const gcNodeType = grandChild.nodeType;
                        if (gcNodeType === Node.TEXT_NODE || gcNodeType === Node.CDATA_SECTION_NODE) {
                            text += (grandChild as CharacterData).data;
                        } else {
                            throw new Error('Unexpected XML non-text node inside script node');
                        }
                    }

                    // exec in the global scope, passing the script context and
                    // defining all imports
                    const params = ['context'];
                    const args: Array<unknown> = [scriptContext];

                    for (const [key, value] of context.scriptImports) {
                        params.push(key);
                        args.push(value);
                    }

                    (new Function(...params, `"use strict"; ${String(text)}`))(...args);
                } else {
                    // widget, parse it
                    if (topWidget !== null) {
                        throw new Error('XML UI tree can only have one top-most widget');
                    }

                    topWidget = this.parseWidgetElem(context, childElem);
                }
            } else if (nodeType === Node.TEXT_NODE) {
                if (!WHITESPACE_REGEX.test((child as CharacterData).data)) {
                    throw new Error('Unexpected text node as UI tree child');
                }
            } else if (nodeType === Node.CDATA_SECTION_NODE) {
                throw new Error('Unexpected CDATA node as UI tree child');
            } else if (nodeType === Node.DOCUMENT_NODE) {
                throw new Error('Unexpected document node as UI tree child');
            } else if (nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                throw new Error('Unexpected document fragment node as UI tree child');
            }
        }

        if (topWidget === null) {
            throw new Error('Expected a XML widget definition in the UI tree, none found');
        }

        return topWidget;
    }

    parseFromXMLDocument(xmlDoc: XMLDocument, config?: XMLUIParserConfig): [Map<string, Widget>, XMLUIParserContext] {
        // find all UI tree nodes
        const uiTrees = xmlDoc.getElementsByTagNameNS(XML_NAMESPACE_BASE, 'ui-tree');
        if (uiTrees.length === 0) {
            throw new Error('No UI trees found in document');
        }

        // setup context
        let scriptImports = null, variableMap;
        if (config) {
            if (config.allowScripts) {
                scriptImports = normalizeToMap(config.scriptImports);

                for (const name of scriptImports.keys()) {
                    if (RESERVED_IMPORTS.indexOf(name) >= 0) {
                        throw new Error(`The script import name "${name}" is reserved`);
                    }
                }
            }

            variableMap = normalizeToMap(config.variables);
        } else {
            scriptImports = new Map();
            variableMap = new Map();
        }

        const context: XMLUIParserContext = {
            scriptImports,
            variableMap,
            idMap: new Map()
        };

        // parse UI trees
        const trees = new Map<string, Widget>();
        for (const uiTree of uiTrees) {
            const nameAttr = uiTree.attributes.getNamedItemNS(null, 'name');
            if (nameAttr === null) {
                throw new Error('UI trees must be named with a "name" attribute');
            }

            const name = nameAttr.value;
            if (trees.has(name)) {
                throw new Error(`A UI tree with the name "${name}" already exists`);
            }

            const widget = this.parseUITreeNode(uiTree, context);
            trees.set(name, widget);
        }

        return [trees, context];
    }

    parseFromString(str: string, config?: XMLUIParserConfig): [Map<string, Widget>, XMLUIParserContext] {
        const xmlDoc = this.domParser.parseFromString(str, 'text/xml');

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            throw new Error('Invalid XML');
        }

        return this.parseFromXMLDocument(xmlDoc, config);
    }

    async parseFromURL(resource: RequestInfo | URL, config?: XMLUIParserConfig, requestOptions?: RequestInit): Promise<[Map<string, Widget>, XMLUIParserContext]> {
        const response = await fetch(resource, requestOptions);

        if (!response.ok) {
            throw new Error(`Response not OK (status code ${response.status})`);
        }

        const str = await response.text();
        return this.parseFromString(str, config);
    }
}
