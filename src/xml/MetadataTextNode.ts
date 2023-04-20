import { XMLUIParserNode } from './XMLUIParserNode.js';

export class MetadataTextNode extends XMLUIParserNode {
    static override readonly type = 'metadata-text';
    override readonly type = MetadataTextNode.type;
    static override readonly typeGroup = 'metadata';
    override readonly typeGroup = MetadataTextNode.typeGroup;

    constructor(public text: string) {
        super();
    }
}
