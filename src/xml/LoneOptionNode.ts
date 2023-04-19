import { fromKebabCase } from '../index.js';
import { OptionNode } from './OptionNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';

export class LoneOptionNode extends OptionNode {
    static override readonly type = 'lone-option';
    override readonly type = LoneOptionNode.type;

    constructor(public name: string, public rawValue: string) {
        super();
    }

    static fromKebabCaseName(kebabName: string, rawValue: string): LoneOptionNode {
        return new LoneOptionNode(fromKebabCase(kebabName), rawValue);
    }

    evaluate(context: XMLUIParserContext): unknown {
        return context.parser.parseAttributeValue(this.rawValue, context);
    }
}
