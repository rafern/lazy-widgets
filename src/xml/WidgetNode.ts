import { ArgumentNode } from './ArgumentNode.js';
import { OptionsNode } from './OptionsNode.js';
import { Widget } from '../widgets/Widget.js';
import { UnnamedArgumentNode } from './UnnamedArgumentNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';
import { WidgetModifierNode } from './WidgetModifierNode.js';

export class WidgetNode extends UnnamedArgumentNode {
    static override readonly type = 'widget';
    override readonly type = WidgetNode.type;

    constructor(public widgetName: string) {
        super('widget');
    }

    override evaluate(context: XMLUIParserContext): Widget {
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
