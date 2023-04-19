import { XMLUIParserNode } from './XMLUIParserNode.js';

export abstract class ArgumentNode extends XMLUIParserNode {
    static override readonly typeGroup = 'argument';
    override readonly typeGroup = ArgumentNode.typeGroup;

    static derives(obj: XMLUIParserNode): obj is ArgumentNode {
        return obj.typeGroup === this.typeGroup;
    }
}
