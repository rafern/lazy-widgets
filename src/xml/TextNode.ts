import { ArgumentNode } from './ArgumentNode.js';

export class TextNode extends ArgumentNode {
    static override readonly type = 'text';
    override readonly type = TextNode.type;

    constructor(public text: string) {
        super();
    }
}
