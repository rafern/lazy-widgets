import { WidgetEventListener } from '../events/WidgetEventEmitter.js';
import { Widget } from '../widgets/Widget.js';
import { WidgetModifierNode } from './WidgetModifierNode.js';
import { XMLUIParserContext } from './XMLUIParserContext.js';

export class AnyEventListenerNode extends WidgetModifierNode {
    static override readonly type = 'any-event-listener';
    override readonly type = AnyEventListenerNode.type;

    constructor(public rawListener: string) {
        super();
    }

    evaluate(context: XMLUIParserContext): WidgetEventListener {
        const listener = context.parser.parseAttributeValue(this.rawListener, context);

        if (typeof listener !== 'function') {
            throw new Error('Event listener did not evaluate to a function');
        }

        return listener as WidgetEventListener;
    }

    override apply(context: XMLUIParserContext, widget: Widget): void {
        widget.onAny(this.evaluate(context));
    }
}
