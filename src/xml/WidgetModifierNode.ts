import { Widget } from '../widgets/Widget.js';
import { XMLUIParserContext } from './XMLUIParserContext.js';
import { XMLUIParserNode } from './XMLUIParserNode.js';

export abstract class WidgetModifierNode extends XMLUIParserNode {
    static override readonly typeGroup = 'widget-modifier';
    override readonly typeGroup = WidgetModifierNode.typeGroup;

    static derives(obj: XMLUIParserNode): obj is WidgetModifierNode {
        return obj.typeGroup === this.typeGroup;
    }

    abstract apply(context: XMLUIParserContext, widget: Widget): void;
}
