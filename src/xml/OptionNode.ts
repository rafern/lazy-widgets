import { XMLUIParserNode } from './XMLUIParserNode.js';

export abstract class OptionNode extends XMLUIParserNode {
    static override readonly typeGroup = 'option';
    override readonly typeGroup = OptionNode.typeGroup;

    static derives(obj: XMLUIParserNode): obj is OptionNode {
        return obj.typeGroup === this.typeGroup;
    }
}
