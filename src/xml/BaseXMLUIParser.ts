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

const RESERVED_PARAMETER_MODES = ['value', 'text', 'widget'];
const RESERVED_ELEMENT_NAMES = ['script', 'ui-tree'];

/**
 * The base lazy-widgets XML namespace. All lazy-widgets namespaces will be
 * prefixed with this. lazy-widgets elements must use this namespace.
 *
 * @category XML
 */
export const XML_NAMESPACE_BASE = 'lazy-widgets';

export type FactoryDefinition = [ inputMapping: WidgetXMLInputConfig, factory: XMLWidgetFactory, paramNames: Map<string, number>, paramValidators: Map<number, (inputValue: unknown) => unknown> ];

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
    private domParser: DOMParser;
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

    constructor() {
        // XXX this is done here instead of in the field declaration because it
        //     confuses the tree shaking eslint plugin
        this.domParser = new DOMParser();
    }

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

    /** Create a new widget instance given a config and context */
    private instantiateWidget(inputConfig: WidgetXMLInputConfig, paramNames: Map<string, number>, paramValidators: Map<number, (inputValue: unknown) => unknown>, factory: XMLWidgetFactory, factoryName: string, context: ASTInstantiationContext, elem: Element) {
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
                    throw new Error(`Can't set parameter "${attribute.localName}"; parameter does not exist in "${factoryName}" widget`);
                }

                if (setParameters[index]) {
                    throw new Error(`Can't set parameter "${attribute.localName}"; parameter was already set in "${factoryName}" widget`);
                }

                setParameters[index] = true;
                setViaName[index] = true;

                const arg = this.parseAttributeValue(attribute.value, context);
                const paramConfig = inputConfig[index];

                if (paramConfig.mode === 'value') {
                    if (arg === undefined) {
                        if (!paramConfig.optional) {
                            throw new Error(`Required parameters (${paramConfig.name}) can't be undefined in "${factoryName}" widget`);
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
                            throw new Error(`Required parameters (${paramConfig.name}) can't be undefined in "${factoryName}" widget`);
                        }
                    } else {
                        const validator = (paramConfig as WidgetXMLInputConfigWidgetParameter).validator;

                        if (paramConfig.list) {
                            if (!Array.isArray(arg)) {
                                throw new Error(`Parameter "${paramConfig.name}" must be an array of Widgets in "${factoryName}" widget`);
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
                                throw new Error(`Parameter "${paramConfig.name}" must be a Widget in "${factoryName}" widget`);
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
                        throw new Error(`Text parameters (${paramConfig.name}) can't be undefined in "${factoryName}" widget`);
                    } else {
                        if (typeof arg !== 'string') {
                            throw new Error(`Text parameters (${paramConfig.name}) must be strings in "${factoryName}" widget`);
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
                            throw new Error(`Required parameters (${paramConfig.name}) can't be undefined in "${factoryName}" widget`);
                        }
                    } else {
                        if (canBeList && paramConfig.list) {
                            if (!Array.isArray(arg)) {
                                throw new Error(`Parameter "${paramConfig.name}" must be an array in "${factoryName}" widget`);
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
                const deserializer = this.attributeNamespaceHandlers.get(namespace);
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
                throw new Error(`Unexpected document node as child of "${factoryName}" widget in XML file`);
            } else if (nodeType === Node.DOCUMENT_TYPE_NODE) {
                throw new Error(`Unexpected document type node as child of "${factoryName}" widget in XML file`);
            } else if (nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                throw new Error(`Unexpected document fragment node as child of "${factoryName}" widget in XML file`);
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
                    if (index < 0) {
                        throw new Error(`Too many parameters passed as XML child elements; tried to find next unset parameter of mode "${parameterMode}" in "${factoryName}" widget, but none found`);
                    }

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
                    if (index < 0) {
                        throw new Error(`Too many widgets passed as XML child elements for "${factoryName}" widget`);
                    }

                    const childWidget = this.parseWidgetElem(context, childElem);
                    setParameters[index] = true;

                    if ((inputConfig[index] as WidgetXMLInputConfigWidgetParameter).list) {
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
            throw new Error(`XML "${factoryName}" widget has a child text node, but there are no text parameters left to fill`);
        }

        // check if all required parameters are set
        for (let i = 0; i < paramCount; i++) {
            if (!setParameters[i]) {
                const param = inputConfig[i];
                const mode = param.mode;
                if (mode === 'value' || mode === 'text') {
                    if (!param.optional) {
                        throw new Error(`Parameter "${param.name}" with mode "${mode}" is not set in "${factoryName}" widget`);
                    }
                } else {
                    const modeConfig = this.parameterModes.get(mode);
                    if (modeConfig === undefined) {
                        throw new Error(`Unknown parameter mode "${mode}"; this is a bug, since there is an earlier check for this, please report it`);
                    }

                    if (!modeConfig[2] || !(param as { optional: boolean }).optional) {
                        throw new Error(`Required parameter "${param.name}" not set in "${factoryName}" widget`);
                    }
                }
            }
        }

        // modify parameters
        for (const modifier of this.argumentModifiers) {
            modifier(this, context, instantiationContext, parameters);
        }

        // instantiate widget
        const instance = factory(...parameters);

        // map widget back to ID
        if (instance.id !== null) {
            if (context.idMap.has(instance.id)) {
                throw new Error(`Widget ID "${instance.id}" is already taken in "${factoryName}" widget`);
            }

            context.idMap.set(instance.id, instance);
        }

        // post-init hooks
        for (const hook of this.postInitHooks) {
            hook(this, context, instantiationContext, instance);
        }

        return instance;
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
     * Register a widget factory to an element name, with a given input mapping.
     *
     * @param nameOrWidgetClass - The camelCase or PascalCase name of the widget, which will be converted to kebab-case and be used as the element name for the widget. If a widget class is passed, then the class name will be used and converted to kebab-case.
     * @param inputMapping - The input mapping for the widget factory
     * @param factory - A function which creates a new instance of a widget
     */
    registerFactory<T extends Widget = Widget>(nameOrWidgetClass: string | (new (...args: unknown[]) => T), inputMapping: WidgetXMLInputConfig, factory: XMLWidgetFactory) {
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
        const paramCount = inputMapping.length;

        for (let i = 0; i < paramCount; i++) {
            const paramGeneric = inputMapping[i];

            if (paramGeneric.mode === 'value') {
                const param = paramGeneric as WidgetXMLInputConfigValueParameter;

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
                const param = paramGeneric as WidgetXMLInputConfigTextParameter;

                if (hasTextNodeParam) {
                    throw new Error('Cannot add another "text" mode parameter; there can only be one text parameter. If you have more string parameters, add them as "value" mode parameters with a "string" validator, and only keep the most important string parameter as the "text" mode parameter');
                }

                if (param.name !== undefined) {
                    paramNames.set(param.name, i);
                }

                hasTextNodeParam = true;
            } else if (paramGeneric.mode === 'widget') {
                const param = paramGeneric as WidgetXMLInputConfigWidgetParameter;
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
                const param = paramGeneric as WidgetXMLInputConfigParameter;
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
        this.factories.set(
            factoryName,
            (context, elem) => this.instantiateWidget(
                inputMapping, paramNames, paramValidators, factory,
                factoryName as string, context, elem
            ),
        );
    }

    /**
     * Similar to {@link BaseXMLUIParser#registerFactory}, except only a widget
     * class and an input mapping need to be supplied. The widget class will be
     * used to create a new factory; the factory will call the class constructor
     * with the `new` keyword.
     *
     * @param widgetClass - The class of the widget that will be instantiated. The class name will be used for the element name, and the class constructor will be used for making the factory function.
     * @param inputMapping - The input mapping for the widget factory
     */
    registerFactoryFromClass<T extends Widget>(widgetClass: new (...args: unknown[]) => T, inputMapping: WidgetXMLInputConfig): void {
        this.registerFactory(widgetClass, inputMapping, (...args) => new widgetClass(...args));
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
     * Auto-register a factory for a given widget. Instead of passing an input
     * mapping, the input mapping is supplied in the {@link Widget.autoXML}
     * field of the widget class. If it's null, an error is thrown.
     *
     * @param widgetClass - The class to auto-register
     */
    autoRegisterFactory<T extends Widget = Widget>(widgetClass: (new (...args: unknown[]) => T) & { autoXML: WidgetAutoXML }) {
        if (widgetClass.autoXML === null) {
            throw new Error('Widget class does not have an automatic XML factory config object set. Must be manually registered');
        }

        if (Array.isArray(widgetClass.autoXML)) {
            this.registerFactoryFromClass(widgetClass, widgetClass.autoXML);
        } else {
            const config = widgetClass.autoXML;
            const nameOrClass = config.name ?? widgetClass;
            const factory = config.factory ?? ((...args) => new widgetClass(...args));
            this.registerFactory(nameOrClass, config.inputConfig, factory);
        }
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

    protected namespaceMatches(namespace: string | null): boolean {
        if (namespace === null) {
            return false;
        } else {
            return namespace === XML_NAMESPACE_BASE || namespace.startsWith(`${XML_NAMESPACE_BASE}:`);
        }
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

    protected deserializeWidget(elem: Element, parent: ASTNode): void {
        // TODO
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
        // use standard namespaces as metadata nodes
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
                } else if (this.namespaceMatches(namespace)) {
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
                } else if (this.namespaceMatches(namespace)) {
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
        // don't use standard namespaces as metadata nodes
        for (const child of node.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.ELEMENT_NODE) {
                const elem = child as Element;
                const namespace = elem.namespaceURI;

                if (this.namespaceMatches(namespace)) {
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

                if (this.namespaceMatches(namespace)) {
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
