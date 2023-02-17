import { LayerInit } from '../core/LayerInit';
import { Widget } from '../widgets/Widget';
import { fromKebabCase } from './fromKebabCase';
import { toKebabCase } from './toKebabCase';
import { validateArray } from './validateArray';
import { validateBoolean } from './validateBoolean';
import { validateFunction } from './validateFunction';
import { validateImageSource } from './validateImageSource';
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
import type { WidgetAutoXML, WidgetAutoXMLConfig, WidgetAutoXMLConfigLayerParameter, WidgetAutoXMLConfigParameterList, WidgetAutoXMLConfigValidator, WidgetAutoXMLConfigWidgetParameter } from './WidgetAutoXML';
import type { XMLUIParserConfig } from './XMLUIParserConfig';
import type { XMLUIParserContext } from './XMLUIParserContext';
import type { XMLUIParserScriptContext } from './XMLUIParserScriptContext';

export type XMLWidgetFactory = (parser: BaseXMLUIParser, context: XMLUIParserContext, xmlElem: Element) => Widget;

const VALIDATORS = new Map<string, WidgetAutoXMLConfigValidator>([
    ['array', validateArray],
    ['boolean', validateBoolean],
    ['function', validateFunction],
    ['image-source', validateImageSource],
    ['key-context', validateKeyContext],
    ['layout-constraints', validateLayoutConstraints],
    ['number', validateNumber],
    ['object', validateObject],
    ['string', validateString],
    ['theme', validateTheme],
    ['validated-variable', validateValidatedVariable],
    ['variable', validateVariable],
    ['nullable:array', validateNullable(validateArray)],
    ['nullable:boolean', validateNullable(validateBoolean)],
    ['nullable:function', validateNullable(validateFunction)],
    ['nullable:image-source', validateNullable(validateImageSource)],
    ['nullable:key-context', validateNullable(validateKeyContext)],
    ['nullable:layout-constraints', validateNullable(validateLayoutConstraints)],
    ['nullable:number', validateNullable(validateNumber)],
    ['nullable:object', validateNullable(validateObject)],
    ['nullable:string', validateNullable(validateString)],
    ['nullable:theme', validateNullable(validateTheme)],
    ['nullable:validated-variable', validateNullable(validateValidatedVariable)],
    ['nullable:variable', validateNullable(validateVariable)],
]);

const WHITESPACE_REGEX = /^\s*$/;

const XML_NAMESPACE_BASE = 'lazy-widgets';
const XML_NAMESPACE_OPTS = `${XML_NAMESPACE_BASE}:options`;
const XML_NAMESPACE_META = `${XML_NAMESPACE_BASE}:metadata`;

const RESERVED_NAMES = ['layer', 'script', 'ui-tree'];
const RESERVED_IMPORTS = ['context', 'window', 'globalThis'];

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

function findNextParamOfType(paramConfig: WidgetAutoXMLConfigParameterList, parametersSet: Array<boolean>, mode: string) {
    const paramCount = paramConfig.length;

    for (let i = 0; i < paramCount; i++) {
        const param = paramConfig[i];
        if (param.mode === mode) {
            if (mode === 'widget') {
                if (!parametersSet[i] || (param as WidgetAutoXMLConfigWidgetParameter).list) {
                    return i;
                }
            } else if (mode === 'layer') {
                if ((param as WidgetAutoXMLConfigLayerParameter).list) {
                    return i;
                }
            } else if (!parametersSet[i]) {
                return i;
            }
        }
    }

    return -1;
}

export class BaseXMLUIParser {
    private factories = new Map<string, XMLWidgetFactory>();
    private domParser = new DOMParser();

    parseAttribute(rawValue: string, context: XMLUIParserContext): unknown {
        if (rawValue.length === 0) {
            return rawValue;
        }

        if (rawValue[0] === '$') {
            // maybe a variable
            if (rawValue.length <= 1) {
                // special case - only a $ was typed with no variable name;
                // treat as a string
                return rawValue;
            }

            const noPrefix = rawValue.slice(1);

            if (noPrefix[0] === '$') {
                // NOT a variable, the $ is escaped by having 2 $ instead of 1
                return noPrefix;
            } else {
                // definitely a variable
                if (!context.variableMap.has(noPrefix)) {
                    throw new Error(`Variable "${noPrefix}" does not exist`);
                }

                return context.variableMap.get(noPrefix);
            }
        } else if (rawValue[0] === '@') {
            // maybe a json-encoded value
            if (rawValue.length <= 1) {
                // special case - only an @ was typed with no json data
                // afterwards; treat as a string
                return rawValue;
            }

            const noPrefix = rawValue.slice(1);

            if (noPrefix[0] === '@') {
                // NOT a json-encoded value, the @ is escaped by having 2 @
                // instead of 1
                return noPrefix;
            } else {
                // definitely a json-encoded value
                return JSON.parse(noPrefix);
            }
        } else {
            // just a string
            return rawValue;
        }
    }

    registerFactory(name: string, factory: XMLWidgetFactory): void;
    registerFactory<T extends Widget>(widgetClass: new (...args: unknown[]) => T, factory: XMLWidgetFactory): void;
    registerFactory<T extends Widget = Widget>(nameOrWidgetClass: string | (new (...args: unknown[]) => T), factory: XMLWidgetFactory) {
        // handle constructors as names
        let name = nameOrWidgetClass;
        if (typeof name !== 'string') {
            name = name.name;
        }

        // make sure name is in kebab-case; element names are case-insensitive,
        // but just toLowerCase'ing it makes the tag names unreadable if the
        // string originally in camelCase or PascalCase
        name = toKebabCase(name);

        // make sure the name is not reserved
        if (RESERVED_NAMES.indexOf(name) >= 0) {
            throw new Error(`This factory name (${name}) is reserved`);
        }

        // check if already taken
        if (this.factories.has(name)) {
            throw new Error(`There is a factory already registered to this name (${name})`);
        }

        // register factory
        this.factories.set(name, factory);
    }

    registerConfigFactory<T extends Widget>(widgetClass: new (...args: unknown[]) => T, autoConfig: WidgetAutoXMLConfig): void {
        // this is an auto-factory config. create a new factory that fits the
        // requirements of the config

        // validate parameter config and build parameter name map
        let widgetTrapReached = false;
        let layerTrapReached = false;
        let hasTextNodeParam = false;
        const paramNames = new Map<string, number>();
        const paramCount = autoConfig.parameters.length;

        for (let i = 0; i < paramCount; i++) {
            const param = autoConfig.parameters[i];

            if (param.mode === 'widget') {
                if (widgetTrapReached) {
                    throw new Error('Cannot add another widget parameter; there is already a previous widget parameter that is optional or a list');
                }

                if (param.list || param.optional) {
                    widgetTrapReached = true;
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }
            } else if (param.mode === 'layer') {
                if (layerTrapReached) {
                    throw new Error('Cannot add another layer parameter; there is already a previous layer parameter that is a list');
                }

                if (param.list) {
                    layerTrapReached = true;
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }
            } else if (param.mode === 'text') {
                if (hasTextNodeParam) {
                    throw new Error('Cannot add another text parameter; there can only be one text parameter. If you have more string parameters, add them as "value" mode parameters with a "string" validator, and only keep the most important string parameter as the "text" mode parameter');
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }

                hasTextNodeParam = true;
            } else if (param.mode === 'value') {
                if (param.validator !== undefined && typeof param.validator !== 'function' && !VALIDATORS.has(param.validator)) {
                    throw new Error(`Unknown built-in validator name (${param.validator})`);
                }

                paramNames.set(param.name, i);
            } else {
                throw new Error(`Unknown parameter mode (${(param as { mode: unknown }).mode})`);
            }
        }

        // make factory
        this.registerFactory(widgetClass, (_parser: BaseXMLUIParser, context: XMLUIParserContext, elem: Element) => {
            // parse parameters and options
            let options: Record<string, unknown> | null = autoConfig.hasOptions ? {} : null;
            let optionsReplaced = false;
            const parameters = new Array<unknown>(paramCount);
            const setParameters = new Array<boolean>(paramCount).fill(false);
            const setViaName = new Array<boolean>(paramCount).fill(false);
            let id: string | null = null;
            let meta: Map<string, unknown> | null = null;

            for (const attribute of elem.attributes) {
                if (attribute.namespaceURI === XML_NAMESPACE_OPTS) {
                    // this attribute sets an options object's field
                    if (options === null) {
                        throw new Error(`Can't add option "${attribute.localName}"; widget does not accept an options object`);
                    }

                    if (attribute.localName === '_') {
                        if (optionsReplaced) {
                            throw new Error('Can\'t replace options object; options object has already been replaced with "option:_"');
                        }

                        if (Object.getOwnPropertyNames(options).length > 0) {
                            throw new Error("Can't replace options object; can't replace options object if individual options are being set with \"option:...\"");
                        }

                        optionsReplaced = true;
                        const optionsValue = this.parseAttribute(attribute.value, context);
                        options = validateObject(optionsValue) as Record<string, unknown>;
                    } else {
                        if (optionsReplaced) {
                            throw new Error(`Can't add option "${attribute.localName}"; can't set individual options if the options object is replaced with "option:_"`);
                        }

                        const nameConverted = fromKebabCase(attribute.localName);
                        if (nameConverted in options) {
                            throw new Error(`Can't add option "${attribute.localName}"; the option has already been set`);
                        }

                        options[nameConverted] = this.parseAttribute(attribute.value, context);
                    }
                } else if (attribute.namespaceURI === XML_NAMESPACE_META) {
                    // this attribute is a meta value
                    const nameConverted = fromKebabCase(attribute.localName);
                    const val = attribute.value;

                    if (nameConverted === 'id') {
                        if (context.idMap.has(nameConverted)) {
                            throw new Error(`Widget ID "${val}" already taken`);
                        } else if (id !== null) {
                            throw new Error('Widget ID can only be set once');
                        }

                        id = val;
                    } else {
                        if (meta === null) {
                            meta = new Map();
                        } else {
                            if (meta.has(nameConverted)) {
                                throw new Error(`Metadata with key "${nameConverted}" already set`);
                            }
                        }

                        meta.set(nameConverted, this.parseAttribute(val, context));
                    }
                } else if (attribute.namespaceURI === null || attribute.namespaceURI === XML_NAMESPACE_BASE) {
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

                    const arg = this.parseAttribute(attribute.value, context);
                    const paramConfig = autoConfig.parameters[index];

                    if (paramConfig.mode === 'value') {
                        if (arg === undefined) {
                            if (!paramConfig.optional) {
                                throw new Error(`Required parameters (${paramConfig.name}) can't be undefined`);
                            }
                        } else {
                            if (paramConfig.validator) {
                                let validator = paramConfig.validator;
                                if (typeof validator === 'string') {
                                    const builtinValid = VALIDATORS.get(validator);
                                    if (builtinValid === undefined) {
                                        throw new Error(`No built-in validator with name "${validator}" exists`);
                                    }

                                    validator = builtinValid;
                                }

                                parameters[index] = validator(arg);
                            } else {
                                parameters[index] = arg;
                            }
                        }
                    } else if (paramConfig.mode === 'widget') {
                        if (arg === undefined) {
                            if (!paramConfig.optional) {
                                throw new Error(`Required parameters (${paramConfig.name}) can't be undefined`);
                            }
                        } else {
                            if (paramConfig.list) {
                                if (!Array.isArray(arg)) {
                                    throw new Error(`Parameter "${paramConfig.name}" must be an array of Widgets`);
                                }

                                if (paramConfig.validator) {
                                    const validArg = [];
                                    for (const widget of arg) {
                                        validArg.push(paramConfig.validator(widget));
                                    }

                                    parameters[index] = validArg;
                                } else {
                                    parameters[index] = arg;
                                }
                            } else {
                                if (!(arg instanceof Widget)) {
                                    throw new Error(`Parameter "${paramConfig.name}" must be a Widget`);
                                }

                                if (paramConfig.validator) {
                                    parameters[index] = paramConfig.validator(arg);
                                } else {
                                    parameters[index] = arg;
                                }
                            }
                        }
                    } else if (paramConfig.mode === 'layer') {
                        if (arg === undefined) {
                            throw new Error(`Layer parameters (${paramConfig.name}) can't be undefined`);
                        } else {
                            if (paramConfig.list) {
                                if (!Array.isArray(arg)) {
                                    throw new Error(`Parameter "${paramConfig.name}" must be an array of layers`);
                                }

                                const validArg = [];
                                for (const layer of arg) {
                                    validArg.push(validateLayerInit(layer));
                                }

                                parameters[index] = validArg;
                            } else {
                                parameters[index] = validateLayerInit(arg);
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
                        if (childElem.namespaceURI === XML_NAMESPACE_OPTS) {
                            throw new Error(`Unexpected "${XML_NAMESPACE_OPTS}" namespace in XML element`);
                        }
                        if (childElem.namespaceURI === XML_NAMESPACE_META) {
                            throw new Error(`Unexpected "${XML_NAMESPACE_META}" namespace in XML element`);
                        }

                        continue;
                    }

                    if (childElem.nodeName.toLowerCase() === 'layer') {
                        const index = findNextParamOfType(autoConfig.parameters, setParameters, 'layer');
                        const layer = this.parseLayerElem(context, childElem);
                        setParameters[index] = true;

                        if ((autoConfig.parameters[index] as WidgetAutoXMLConfigLayerParameter).list) {
                            if (parameters[index] === undefined) {
                                parameters[index] = [layer];
                            } else {
                                (parameters[index] as Array<LayerInit<Widget>>).push(layer);
                            }
                        } else {
                            parameters[index] = layer;
                        }
                    } else {
                        // validator
                        const index = findNextParamOfType(autoConfig.parameters, setParameters, 'widget');
                        const childWidget = this.parseWidgetElem(context, childElem);
                        setParameters[index] = true;

                        if ((autoConfig.parameters[index] as WidgetAutoXMLConfigWidgetParameter).list) {
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
            const textIndex = findNextParamOfType(autoConfig.parameters, setParameters, 'text');
            if (textIndex >= 0) {
                parameters[textIndex] = textContent;
                setParameters[textIndex] = true;
            } else if (!WHITESPACE_REGEX.test(textContent)) {
                throw new Error('XML widget has a child text node, but there are no text parameters left to fill');
            }

            // check if all required parameters are set
            for (let i = 0; i < paramCount; i++) {
                if (!setParameters[i]) {
                    const param = autoConfig.parameters[i];
                    if (param.mode === 'value') {
                        if (!param.optional) {
                            throw new Error(`Parameter not set (${param.name})`);
                        }
                    } else if (param.mode === 'widget') {
                        if (!param.optional) {
                            throw new Error(`Widget parameter not set (${param.name === undefined ? 'unnamed' : param.name})`);
                        }
                    } else if (param.mode === 'layer') {
                        throw new Error(`Layer parameter not set (${param.name === undefined ? 'unnamed' : param.name})`);
                    } else {
                        if (!param.optional) {
                            throw new Error(`Text parameter not set (${param.name === undefined ? 'unnamed' : param.name})`);
                        }
                    }
                }
            }

            // instantiate widget
            let instance;
            if (options === null) {
                instance = new widgetClass(...parameters);
            } else {
                instance = new widgetClass(...parameters, options);
            }

            // map widget back to ID and save metadata
            if (id !== null) {
                context.idMap.set(id, instance);
            }

            if (meta !== null) {
                context.metaMap.set(instance, meta);
            }

            return instance;
        });
    }

    registerAutoFactory<T extends Widget = Widget>(widgetClass: (new () => T) & { autoXML: WidgetAutoXML }) {
        if (widgetClass.autoXML === null) {
            throw new Error('Widget class does not have an automatic XML factory config object set. Must be manually registered');
        }

        if (typeof widgetClass.autoXML === 'function') {
            // self-register factory
            this.registerFactory(widgetClass, widgetClass.autoXML);
        } else {
            // input mapping
            this.registerConfigFactory(widgetClass, widgetClass.autoXML);
        }
    }

    parseWidgetElem(context: XMLUIParserContext, elem: Element): Widget {
        // get factory for this element name
        const name = elem.nodeName.toLowerCase();
        const factory = this.factories.get(name);

        if (factory === undefined) {
            throw new Error(`No factory registered to name (${name})`);
        }

        // generate widget
        return factory(this, context, elem);
    }

    parseLayerElem(context: XMLUIParserContext, elem: Element): LayerInit<Widget> {
        // parse attributes
        let child, name, canExpand;
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

                child = this.parseAttribute(attr.value, context);
                if (!(child instanceof Widget)) {
                    throw new Error('Layer child must be a Widget');
                }
            } else if (attr.localName === 'name') {
                if (name !== undefined) {
                    throw new Error('Only one name can be specified per layer');
                }

                name = validateString(this.parseAttribute(attr.value, context));
            } else if (attr.localName === 'can-expand') {
                if (canExpand !== undefined) {
                    throw new Error('Only one can-expand option can be specified per layer');
                }

                canExpand = validateBoolean(this.parseAttribute(attr.value, context));
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

                child = this.parseWidgetElem(context, childElem);
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

    executeScriptNode(scriptNode: Element, scriptContext: XMLUIParserScriptContext, imports: Map<string, unknown>) {
        // concatenate all text
        let text = '';
        for (const child of scriptNode.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE) {
                text += (child as CharacterData).data;
            } else {
                throw new Error('Unexpected XML non-text node inside script node');
            }
        }

        // exec in the global scope, passing the script context and defining all
        // imports
        const params = ['context'];
        const args: Array<unknown> = [scriptContext];

        for (const [key, value] of imports) {
            params.push(key);
            args.push(value);
        }

        (new Function(...params, `"use strict"; ${String(text)}`))(...args);
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
                    if (childElem.namespaceURI === XML_NAMESPACE_OPTS) {
                        throw new Error(`Unexpected "${XML_NAMESPACE_OPTS}" namespace in XML element`);
                    }
                    if (childElem.namespaceURI === XML_NAMESPACE_META) {
                        throw new Error(`Unexpected "${XML_NAMESPACE_META}" namespace in XML element`);
                    }

                    continue;
                }

                // is this a widget or a script?
                if (childElem.localName === 'script') {
                    // script, execute it
                    if (context.scriptImports === null) {
                        throw new Error('Scripts are disabled');
                    }

                    const scriptContext: XMLUIParserScriptContext = {
                        variables: context.variableMap,
                        ids: context.idMap,
                        metadata: context.metaMap
                    };

                    this.executeScriptNode(childElem, scriptContext, context.scriptImports);
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
            idMap: new Map(),
            metaMap: new Map()
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
