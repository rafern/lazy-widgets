import { fromKebabCase } from '../index.js';
import { ArgumentNode } from './ArgumentNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';

export class ValueNode extends ArgumentNode {
    static override readonly type = 'value';
    override readonly type = ValueNode.type;

    constructor(public name: string, public rawValue: string) {
        super();
    }

    static fromKebabCaseName(kebabName: string, rawValue: string): ValueNode {
        return new ValueNode(fromKebabCase(kebabName), rawValue);
    }

    evaluate(context: XMLUIParserContext): unknown {
        return context.parser.parseAttributeValue(this.rawValue, context);
    }
}
