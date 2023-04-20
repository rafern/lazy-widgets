import { ASTNode } from './ASTNode.js';

export class MetadataCommentNode extends ASTNode {
    static override readonly type = 'metadata-comment';
    override readonly type = MetadataCommentNode.type;
    static override readonly typeGroup = 'metadata';
    override readonly typeGroup = MetadataCommentNode.typeGroup;

    constructor(public text: string) {
        super();
    }
}
