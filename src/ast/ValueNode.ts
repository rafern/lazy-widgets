import { Widget } from '../widgets/Widget.js';
import { ArgumentNode } from './ArgumentNode.js';
import { FactoryDefinition } from '../xml/BaseXMLUIParser.js';
import { WidgetXMLInputConfigWidgetParameter } from '../xml/WidgetAutoXML.js';

import type { ASTInstantiationContext } from './ASTInstantiationContext.js';

export class ValueNode extends ArgumentNode {
    static override readonly type = 'value';
    override readonly type = ValueNode.type;

    constructor(public name: string, public rawValue: string) {
        super();
    }

    override evaluate(context: ASTInstantiationContext): unknown {
        return context.parser.parseAttributeValue(this.rawValue, context);
    }

    override fillParameter(context: ASTInstantiationContext, factoryDefinition: FactoryDefinition, parameters: Array<unknown>, setParameters: Array<boolean>, setViaName: Array<boolean>): void {
        const [inputMapping, _factory, paramNames, paramValidators] = factoryDefinition;
        const idx = paramNames.get(this.name);
        if (idx === undefined) {
            throw 'ded'; // TODO
        }

        if (setParameters[idx]) {
            throw new Error(`Can't set parameter "${this.name}"; parameter was already set`);
        }

        const parser = context.parser;

        setParameters[idx] = true;
        setViaName[idx] = true;
        const arg = this.evaluate(context);
        const paramConfig = inputMapping[idx];

        if (paramConfig.mode === 'value') {
            if (arg === undefined) {
                if (!paramConfig.optional) {
                    throw new Error(`Required parameters (${paramConfig.name}) can't be undefined`);
                }
            } else {
                const validator = paramValidators.get(idx);
                if (validator === undefined) {
                    parameters[idx] = arg;
                } else {
                    parameters[idx] = validator(arg);
                }
            }
        } else if (paramConfig.mode === 'widget') {
            if (arg === undefined) {
                if (!paramConfig.optional) {
                    throw new Error(`Required parameters (${paramConfig.name}) can't be undefined`);
                }
            } else {
                const validator = (paramConfig as WidgetXMLInputConfigWidgetParameter).validator;

                if (paramConfig.list) {
                    if (!Array.isArray(arg)) {
                        throw new Error(`Parameter "${paramConfig.name}" must be an array of Widgets`);
                    }

                    if (validator) {
                        const validArg = [];
                        for (const widget of arg) {
                            validArg.push(validator(widget));
                        }

                        parameters[idx] = validArg;
                    } else {
                        parameters[idx] = arg;
                    }
                } else {
                    if (!(arg instanceof Widget)) {
                        throw new Error(`Parameter "${paramConfig.name}" must be a Widget`);
                    }

                    if (validator) {
                        parameters[idx] = validator(arg);
                    } else {
                        parameters[idx] = arg;
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

                parameters[idx] = arg;
            }
        } else {
            const paramModeConfig = parser.getParameterMode(paramConfig.mode);
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
                            validArg.push(validator(parser, context, paramConfig, value));
                        }

                        parameters[idx] = validArg;
                    } else {
                        parameters[idx] = arg;
                    }
                } else if (validator) {
                    parameters[idx] = validator(parser, context, paramConfig, arg);
                } else {
                    parameters[idx] = arg;
                }
            }
        }
    }
}
