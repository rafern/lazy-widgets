import { ArgumentNode } from './ArgumentNode.js';
import { OptionsNode } from './OptionsNode.js';
import { Widget } from '../widgets/Widget.js';
import { UnnamedArgumentNode } from './UnnamedArgumentNode.js';

import type { ASTInstantiationContext } from './ASTInstantiationContext.js';
import { WidgetModifierNode } from './WidgetModifierNode.js';

export class WidgetNode extends UnnamedArgumentNode {
    static override readonly type = 'widget';
    override readonly type = WidgetNode.type;

    constructor(public widgetName: string) {
        super('widget');
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
                if (RESERVED_PARAMETER_MODES.indexOf(mode) >= 0) {
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

    override evaluate(context: ASTInstantiationContext): Widget {
        // get factory
        const parser = context.parser;
        const factoryDefinition = parser.getFactory(this.widgetName);
        if (factoryDefinition === undefined) {
            throw 'ded'; // TODO
        }

        // parse parameters and options
        const inputMapping = factoryDefinition[0];
        const paramCount = inputMapping.length;
        const parameters = new Array<unknown>(paramCount);
        const setParameters = new Array<boolean>(paramCount).fill(false);
        const setViaName = new Array<boolean>(paramCount).fill(false);
        const modifierNodes = new Array<WidgetModifierNode>();
        let options: Record<string, unknown> | undefined;
        let hadOptions = false;

        for (const child of this.children) {
            if (child.isa(OptionsNode)) {
                if (hadOptions) {
                    throw 'ded'; // TODO
                }

                options = child.evaluate(context);
                hadOptions = true;
                continue;
            } else if (ArgumentNode.derives(child)) {
                child.fillParameter(context, factoryDefinition, parameters, setParameters, setViaName);
            } else if (WidgetModifierNode.derives(child)) {
                modifierNodes.push(child);
            } else {
                // TODO how to handle unneeded nodes?
                continue;
            }
        }

        // check if all required parameters are set
        for (let i = 0; i < paramCount; i++) {
            if (!setParameters[i]) {
                const param = inputMapping[i];
                const mode = param.mode;
                if (mode === 'value' || mode === 'text') {
                    if (!param.optional) {
                        throw new Error(`Parameter "${param.name}" with mode "${mode}" is not set`);
                    }
                } else {
                    const modeConfig = parser.getParameterMode(mode);
                    if (modeConfig === undefined) {
                        throw new Error(`Unknown parameter mode "${mode}"; this is a bug, since there is an earlier check for this, please report it`);
                    }

                    if (!modeConfig[2] || !(param as { optional: boolean }).optional) {
                        throw new Error(`Required parameter "${param.name}" not set`);
                    }
                }
            }
        }

        // call factory
        parameters.push(options);
        const widget = factoryDefinition[1](...parameters);

        // apply modifiers
        for (const modifierNode of modifierNodes) {
            modifierNode.apply(context, widget);
        }

        // done
        return widget;
    }
}
