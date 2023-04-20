import { OptionNode } from './OptionNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';

export class OptionsObjectNode extends OptionNode {
    static override readonly type = 'options-object';
    override readonly type = OptionsObjectNode.type;

    constructor(public name: string, public rawValue: string) {
        super();
    }

    evaluate(context: XMLUIParserContext): Record<string, unknown> {
        const options = context.parser.parseAttributeValue(this.rawValue, context);

        if (typeof options === 'object') {
            if (options === null) {
                throw new Error(`Options objects must evaluate to either an object or undefined, but was null`);
            } else {
                return options as Record<string, unknown>;
            }
        } else if (options === undefined) {
            return {};
        } else {
            throw new Error(`Options objects must evaluate to either an object or undefined, but had type "${typeof options}"`);
        }
    }
}
