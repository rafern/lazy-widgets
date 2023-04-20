import { FactoryDefinition } from './BaseXMLUIParser.js';
import { XMLUIParserContext } from './XMLUIParserContext.js';
import { XMLUIParserNode } from './XMLUIParserNode.js';

export abstract class ArgumentNode extends XMLUIParserNode {
    static override readonly typeGroup = 'argument';
    override readonly typeGroup = ArgumentNode.typeGroup;

    static derives(obj: XMLUIParserNode): obj is ArgumentNode {
        return obj.typeGroup === this.typeGroup;
    }

    abstract evaluate(context: XMLUIParserContext): unknown;
    abstract fillParameter(context: XMLUIParserContext, factoryDefinition: FactoryDefinition, parameters: Array<unknown>, setParameters: Array<boolean>, setViaName: Array<boolean>): void;
}
