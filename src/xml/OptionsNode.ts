import { LoneOptionNode } from './LoneOptionNode.js';
import { XMLUIParserNode } from './XMLUIParserNode.js';
import { OptionNode } from './OptionNode.js';
import { OptionsObjectNode } from './OptionsObjectNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';

export class OptionsNode extends XMLUIParserNode {
    static override readonly type = 'options';
    override readonly type = OptionsNode.type;
    static override readonly typeGroup = null;
    override readonly typeGroup = OptionsNode.typeGroup;

    evaluate(context: XMLUIParserContext): Record<string, unknown> {
        const options: Record<string, unknown> = {};

        const filteredChildren = new Array<OptionNode>();
        for (const child of this.children) {
            if (OptionNode.derives(child)) {
                filteredChildren.push(child);
            } else {
                throw 'ded'; // TODO
            }
        }

        if (filteredChildren.length === 1 && filteredChildren[0].isa(OptionsObjectNode)) {
            return filteredChildren[0].evaluate(context);
        } else {
            for (const child of filteredChildren) {
                if (child.isa(LoneOptionNode)) {
                    options[child.name] = child.evaluate(context);
                } else if (child.isa(OptionsObjectNode)) {
                    const subObj = child.evaluate(context);

                    for (const name of Object.getOwnPropertyNames(subObj)) {
                        options[name] = subObj[name];
                    }
                } else {
                    throw 'ded'; // TODO
                }
            }
        }

        return options;
    }
}
