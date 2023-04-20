import { XMLUIParserNode } from './XMLUIParserNode.js';

export class MetadataAttributeNode extends XMLUIParserNode {
    static override readonly type = 'metadata-attribute';
    override readonly type = MetadataAttributeNode.type;
    static override readonly typeGroup = 'metadata';
    override readonly typeGroup = MetadataAttributeNode.typeGroup;

    constructor(public name: string, public value: string, public namespace: string | null = null) {
        super();
    }
}
