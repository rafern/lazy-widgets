import { ArgumentNode } from './ArgumentNode.js';
import { XMLUIParserContext } from './XMLUIParserContext.js';
import { WidgetXMLInputConfig } from './WidgetAutoXML.js';
import { FactoryDefinition } from './BaseXMLUIParser.js';

const RESERVED_PARAMETER_MODES = ['value', 'text', 'widget', 'layer'];

export abstract class UnnamedArgumentNode extends ArgumentNode {
    constructor(readonly parameterMode: string) {
        super();
    }

    /**
     * Find the next unset parameter of a given mode.
     *
     * @param context - The parser context
     * @param inputMapping - The input mapping of the widget being built
     * @param parametersSet - A list containing which of the parameters in the input mapping are already set
     * @param mode - The parameter mode to find
     * @returns Returns the index of the next unset parameter of the wanted mode. If none are found, -1 is returned.
     */
    private findNextParamOfType(context: XMLUIParserContext, inputMapping: WidgetXMLInputConfig, parametersSet: Array<boolean>) {
        const paramCount = inputMapping.length;
        let canBeList = false;

        // TODO this reserved parameter stuff should be replaced
        if (RESERVED_PARAMETER_MODES.indexOf(this.parameterMode) >= 0) {
            canBeList = (this.parameterMode === 'widget' || this.parameterMode === 'layer');
        } else {
            const parameterModeConfig = context.parser.getParameterMode(this.parameterMode);

            if (parameterModeConfig === undefined) {
                throw new Error(`Invalid parameter mode "${this.parameterMode}"`);
            }

            canBeList = parameterModeConfig[1];
        }

        for (let i = 0; i < paramCount; i++) {
            const param = inputMapping[i];
            if (param.mode === this.parameterMode && (!parametersSet[i] || (canBeList && (param as { list: boolean }).list))) {
                return i;
            }
        }

        return -1;
    }

    override fillParameter(context: XMLUIParserContext, factoryDefinition: FactoryDefinition, parameters: Array<unknown>, setParameters: Array<boolean>, _setViaName: Array<boolean>): void {
        const parser = context.parser;
        const inputMapping = factoryDefinition[0];
        const parameterModeTuple = parser.getParameterMode(this.parameterMode);

        if (!parameterModeTuple) {
            throw new Error(`Parameter mode "${this.parameterMode}" is missing; this is a bug, please report it`);
        }

        const canBeList = parameterModeTuple[1];
        const index = this.findNextParamOfType(context, inputMapping, setParameters);
        if (index < 0) {
            throw new Error(`Too many parameters passed as XML child elements; tried to find next unset parameter of mode "${this.parameterMode}", but none found`);
        }

        const value = this.evaluate(context);
        setParameters[index] = true;

        if (canBeList && (inputMapping[index] as { list?: boolean }).list) {
            if (parameters[index] === undefined) {
                parameters[index] = [value];
            } else {
                (parameters[index] as Array<unknown>).push(value);
            }
        } else {
            parameters[index] = value;
        }
    }
}
