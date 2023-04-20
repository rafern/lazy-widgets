import { WidgetNode } from './WidgetNode.js';
import { XMLUIParserNode } from './XMLUIParserNode.js';
import { ScriptNode } from './ScriptNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';
import type { Widget } from '../index.js';

export class UITreeNode extends XMLUIParserNode {
    static override readonly type = 'ui-tree';
    override readonly type = UITreeNode.type;
    static override readonly typeGroup = null;
    override readonly typeGroup = UITreeNode.typeGroup;

    constructor(public name: string) {
        super();
    }

    instantiate(context: XMLUIParserContext): Widget {
        let widget = null;
        for (const child of this.children) {
            if (child.isa(WidgetNode)) {
                if (widget !== null) {
                    // TODO error
                }

                widget = child.evaluate(context);
            } else if (child.isa(ScriptNode)) {
                child.execute(context);
            } else {
                // TODO error
            }
        }

        if (widget === null) {
            throw 'ded';
            // TODO error
        }

        return widget;
    }
}
