import { BlurEvent } from '../events/BlurEvent.js';
import { FocusEvent } from '../events/FocusEvent.js';
import { LeaveEvent } from '../events/LeaveEvent.js';
import { PointerEvent } from '../events/PointerEvent.js';
import { type TricklingEvent } from '../events/TricklingEvent.js';
import { PropagationModel, type WidgetEvent } from '../events/WidgetEvent.js';
import { ClickHelper } from '../helpers/ClickHelper.js';
import { ClickState } from '../helpers/ClickState.js';
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
        this.complementaryClickHelper.ref();
    }

    protected override deactivate(): void {
        this.complementaryClickHelper.unref();
        super.deactivate();
    }

    protected override handleAttachment(): void {
        this.complementaryClickHelper.addClickHelper(this.clickHelper);
        super.handleAttachment();
    }

    protected override handleDetachment(): void {
        this.complementaryClickHelper.removeClickHelper(this.clickHelper);
        super.handleDetachment();
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        // FIXME if you have a nested button or clickproxy, and they both share
        //       a compoundclickhelper, the hover state can't be transferred
        //       perfectly; there's a single event which causes the state to
        //       transition to a released state, instead of hover. i couldn't
        //       find a fix for this
        if (event.propagation !== PropagationModel.Trickling) {
            if (event.isa(FocusEvent)) {
                return this;
            } else if (event.isa(BlurEvent)) {
                return this;
            } else {
                return super.handleEvent(event);
            }
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
