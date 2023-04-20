import { FactoryDefinition } from '../xml/BaseXMLUIParser.js';
import { ASTInstantiationContext } from './ASTInstantiationContext.js';
import { ASTNode } from './ASTNode.js';

export abstract class ArgumentNode extends ASTNode {
    static override readonly typeGroup = 'argument';
    override readonly typeGroup = ArgumentNode.typeGroup;

    static derives(obj: ASTNode): obj is ArgumentNode {
        return obj.typeGroup === this.typeGroup;
    }

    abstract evaluate(context: ASTInstantiationContext): unknown;
    abstract fillParameter(context: ASTInstantiationContext, factoryDefinition: FactoryDefinition, parameters: Array<unknown>, setParameters: Array<boolean>, setViaName: Array<boolean>): void;
}
