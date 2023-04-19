import { OptionNode } from './OptionNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';

export class OptionsObjectNode extends OptionNode {
    static override readonly type = 'options-object';
    override readonly type = OptionsObjectNode.type;

    constructor(public name: string, public rawValue: string) {
        super();
    }

    evaluate(context: XMLUIParserContext): Record<string, unknown> {
        // TODO
        return context.parser.parseAttributeValue(this.rawValue, context);
    }
}
