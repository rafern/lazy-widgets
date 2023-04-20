import { ASTNode } from './ASTNode.js';

export class MetadataElementNode extends ASTNode {
    static override readonly type = 'metadata-element';
    override readonly type = MetadataElementNode.type;
    static override readonly typeGroup = 'metadata';
    override readonly typeGroup = MetadataElementNode.typeGroup;

    constructor(public name: string, public namespace: string | null = null) {
        super();
    }
}
