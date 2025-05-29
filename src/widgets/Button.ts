import { ButtonClickHelper } from '../helpers/ButtonClickHelper.js';
import { BaseContainer } from './BaseContainer.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import { ClickEvent } from '../events/ClickEvent.js';
import { FocusEvent } from '../events/FocusEvent.js';
import { BlurEvent } from '../events/BlurEvent.js';
import type { Widget } from './Widget.js';
import type { TricklingEvent } from '../events/TricklingEvent.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { PointerEvent } from '../events/PointerEvent.js';
import { LeaveEvent } from '../events/LeaveEvent.js';
import { ClickHelperEventType } from '../helpers/ClickHelperEventType.js';
import { type ClickHelperEventListener } from '../helpers/ClickHelperEventListener.js';
/**
 * A {@link BaseContainer} which can be {@link ClickHelper | clicked} as a
 * button. Since the button grabs all events, no events are propagated to the
 * child.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class Button<W extends Widget = Widget> extends BaseContainer<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'button',
        inputConfig: SingleParentXMLInputConfig
    };

    /** The helper used for handling pointer clicks and enter presses */
    protected clickHelper: ButtonClickHelper;
    /** See {@link Button#clickable} */
    private _clickable: boolean;
    private _handleClickHelperEvent: ClickHelperEventListener;

    constructor(child: W, properties?: Readonly<ClickableWidgetProperties>) {
        super(child, properties);

        this._clickable = properties?.clickable ?? true;
        this.clickHelper = new ButtonClickHelper(this, properties?.complementaryClickHelper);
        this.tabFocusable = true;
        this._handleClickHelperEvent = this.handleClickHelperEvent.bind(this);
    }

    /**
     * Click the button. If the button is {@link Button#clickable}, then a
     * {@link ClickEvent} will be fired.
     */
    click(): void {
        this.dispatchEvent(new ClickEvent(this));
    }

    protected handleClickHelperEvent(event: ClickHelperEventType): void {
        if (event === ClickHelperEventType.Clicked) {
            this.click();
        }
    }

    protected override activate(): void {
        super.activate();
        this.clickHelper.reset();
        this.clickHelper.ref();
        this.clickHelper.addEventListener(this._handleClickHelperEvent);
    }

    protected override deactivate(): void {
        this.clickHelper.unref();
        this.clickHelper.removeEventListener(this._handleClickHelperEvent);
        super.deactivate();
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            if (event.isa(FocusEvent)) {
                this.clickHelper.onFocusGrabbed(event.focusType);
                return this;
            } else if (event.isa(BlurEvent)) {
                this.clickHelper.onFocusDropped(event.focusType);
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
                    this.clickHelper.handleEvent(
                        new LeaveEvent(this), this.root,
                        this._clickable, this.bounds,
                    );
                }

                return superCapture;
            }

            if (tricklingEvent.target !== null) {
                return null;
            }
        }

        return this.clickHelper.handleEvent(
            tricklingEvent, this.root, this._clickable, this.bounds
        ) ? this : null;
    }

    /**
     * Is the button clickable? True by default. Used for disabling the button
     * without hiding it.
     */
    get clickable() {
        return this._clickable;
    }

    set clickable(clickable: boolean) {
        if(this._clickable === clickable) {
            return;
        }

        this._clickable = clickable;
        this.clickHelper.reset();
        this.markWholeAsDirty();
    }
}
