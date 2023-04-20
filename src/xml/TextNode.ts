import { UnnamedArgumentNode } from './UnnamedArgumentNode.js';
import { XMLUIParserContext } from './XMLUIParserContext.js';

export class TextNode extends UnnamedArgumentNode {
    static override readonly type = 'text';
    override readonly type = TextNode.type;

    constructor(public text: string) {
        super('text');
    }

    override evaluate(_context: XMLUIParserContext): string {
        return this.text;
    }
}
