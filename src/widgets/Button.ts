import { ButtonClickHelper } from '../helpers/ButtonClickHelper';
import type { Widget, WidgetProperties } from './Widget';
import type { FocusType } from '../core/FocusType';
import { BaseContainer } from './BaseContainer';
import type { Event } from '../events/Event';

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
    /** The helper used for handling pointer clicks and enter presses */
    protected clickHelper: ButtonClickHelper;
    /**
     * The callback for clicking this button. If null, the button is not
     * clickable but will still absorb events.
     */
    callback: (() => void) | null;

    /** Create a new Button. */
    constructor(child: W, callback: (() => void) | null, properties?: Readonly<WidgetProperties>) {
        super(child, false, properties);

        this.clickHelper = new ButtonClickHelper(this);
        this.callback = callback;
        this.tabFocusable = true;
    }

    /**
     * Click the button. If there is a callback, then the callback will be
     * called
     */
    click(): void {
        if(this.callback !== null) {
            try {
                this.callback();
            }
            catch(e) {
                console.error('Exception in Icon callback:', e);
            }
        }
    }

    protected override activate(): void {
        super.activate();
        this.clickHelper.reset();
    }

    override onFocusGrabbed(focusType: FocusType): void {
        this.clickHelper.onFocusGrabbed(focusType);
    }

    override onFocusDropped(focusType: FocusType): void {
        this.clickHelper.onFocusDropped(focusType);
    }

    protected override handleEvent(event: Event): Widget | null {
        const [wasClick, capture] = this.clickHelper.handleEvent(
            event, this.root, this.callback !== null, this.bounds
        );

        if(wasClick)
            this.click();

        return capture ? this : null;
    }
}
