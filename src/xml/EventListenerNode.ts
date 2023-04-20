import { WidgetEventListener } from '../events/WidgetEventEmitter.js';
import { Widget } from '../widgets/Widget.js';
import { WidgetModifierNode } from './WidgetModifierNode.js';
import { XMLUIParserContext } from './XMLUIParserContext.js';

export class EventListenerNode extends WidgetModifierNode {
    static override readonly type = 'event-listener';
    override readonly type = EventListenerNode.type;

    constructor(public eventType: string, public rawListener: string, public once: boolean) {
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
        widget.on(this.eventType, this.evaluate(context), this.once);
    }
}
