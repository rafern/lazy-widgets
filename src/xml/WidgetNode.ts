import { fromKebabCase } from '../helpers/fromKebabCase.js';
import { ArgumentNode } from './ArgumentNode.js';

import type { XMLUIParserContext } from './XMLUIParserContext.js';
import type { Widget } from '../widgets/Widget.js';

export class WidgetNode extends ArgumentNode {
    static override readonly type = 'widget';
    override readonly type = WidgetNode.type;

    constructor(public widgetType: string) {
        super();
    }

    static fromKebabCaseWidgetType(kebabWidgetType: string): WidgetNode {
        return new WidgetNode(fromKebabCase(kebabWidgetType));
    }

    instantiate(context: XMLUIParserContext): Widget {
        // TODO
    }
}
