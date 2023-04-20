import { ASTNode } from './ASTNode.js';

export class MetadataTextNode extends ASTNode {
    static override readonly type = 'metadata-text';
    override readonly type = MetadataTextNode.type;
    static override readonly typeGroup = 'metadata';
    override readonly typeGroup = MetadataTextNode.typeGroup;

    constructor(public text: string) {
        super();
    }
}
