import { ASTNode } from './ASTNode.js';

export abstract class OptionNode extends ASTNode {
    static override readonly typeGroup = 'option';
    override readonly typeGroup = OptionNode.typeGroup;

    static derives(obj: ASTNode): obj is OptionNode {
        return obj.typeGroup === this.typeGroup;
    }
}
