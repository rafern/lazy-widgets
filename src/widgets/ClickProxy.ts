import { LeaveEvent } from '../events/LeaveEvent.js';
import { PointerEvent } from '../events/PointerEvent.js';
import { type TricklingEvent } from '../events/TricklingEvent.js';
import { PropagationModel, type WidgetEvent } from '../events/WidgetEvent.js';
import { ClickHelper } from '../helpers/ClickHelper.js';
import { ComplementaryClickHelper } from '../helpers/ComplementaryClickHelper.js';
import { type WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { PassthroughWidget } from './PassthroughWidget.js';
import { Widget, type WidgetProperties } from './Widget.js';

export class ClickProxy<W extends Widget = Widget> extends PassthroughWidget<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'click-proxy',
        inputConfig: [
            {
                mode: 'widget',
                name: 'child',
            },
            {
                mode: 'value',
                name: 'complementary-click-helper',
            },
        ],
    };

    /**
     * The helper used for handling pointer events. Will be attached to the
     * complementary click helper when needed.
     */
    private readonly clickHelper: ClickHelper;

    constructor(child: W, readonly complementaryClickHelper: ComplementaryClickHelper, properties?: Readonly<WidgetProperties>) {
        super(child, properties);
        this.clickHelper = new ClickHelper(this);
    }

    protected override activate(): void {
        super.activate();
        this.clickHelper.reset();
    }

    protected override deactivate(): void {
        super.deactivate();
        this.clickHelper.reset();
    }

    protected override handleAttachment(): void {
        this.complementaryClickHelper.attachClickHelper(this.clickHelper);
        super.handleAttachment();
    }

    protected override handleDetachment(): void {
        this.complementaryClickHelper.detachClickHelper(this.clickHelper);
        super.handleDetachment();
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            return super.handleEvent(event);
        }

        const tricklingEvent = event as TricklingEvent;
        if (tricklingEvent.target !== this) {
            const superCapture = super.handleEvent(event);
            if (superCapture) {
                if (event instanceof PointerEvent) {
                    // XXX simulate an unhover, since the pointer is over some
                    //     nested button now
                    this.clickHelper.handleClickEvent(new LeaveEvent(this), this.root, this.bounds);
                }

                return superCapture;
            }

            if (tricklingEvent.target !== null) {
                return null;
            }
        }

        if (!(event.isa(LeaveEvent) || event instanceof PointerEvent)) {
            return null;
        }

        this.clickHelper.handleClickEvent(tricklingEvent, this.root, this.bounds);

        return this;
    }
}
