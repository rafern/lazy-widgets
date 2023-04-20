import { XMLUIParserNode } from './XMLUIParserNode.js';

export class MetadataCommentNode extends XMLUIParserNode {
    static override readonly type = 'metadata-comment';
    override readonly type = MetadataCommentNode.type;
    static override readonly typeGroup = 'metadata';
    override readonly typeGroup = MetadataCommentNode.typeGroup;

    constructor(public text: string) {
        super();
    }
}
