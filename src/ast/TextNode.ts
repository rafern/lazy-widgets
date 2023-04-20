import { UnnamedArgumentNode } from './UnnamedArgumentNode.js';
import { ASTInstantiationContext } from './ASTInstantiationContext.js';

export class TextNode extends UnnamedArgumentNode {
    static override readonly type = 'text';
    override readonly type = TextNode.type;

    constructor(public text: string) {
        super('text');
    }

    override evaluate(_context: ASTInstantiationContext): string {
        return this.text;
    }
}
