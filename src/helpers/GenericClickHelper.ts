import { BaseClickHelper } from './BaseClickHelper.js';
import { type Widget } from '../widgets/Widget.js';
import { ClickState } from './ClickState.js';
import { ClickHelperEventType } from './ClickHelperEventType.js';

/**
 * An aggregate helper class for widgets that can be clicked, in the general
 * sense that the widget is/has a button or is clickable. This does not mean
 * that the widget is only clickable with a pointer; it could also be "clicked"
 * with a keyboard.
 *
 * Keeps its current click state as well as its last click state, and whether
 * the last click state change resulted in an actual click.
 *
 * @category Helper
 */
export class GenericClickHelper extends BaseClickHelper {
    private _clickState: ClickState = ClickState.Released;
    protected widget: Widget;

    /**
     * @param widget - The Widget aggregating this helper
     */
    constructor(widget: Widget) {
        super();
        this.widget = widget;
    }

    /**
     * Sets {@link GenericClickHelper#clickState} and dispatches events if
     * current one differs.
     */
    setClickState(clickState: ClickState, inside: boolean): void {
        const lastClickState = this._clickState;
        if(lastClickState === clickState) {
            return;
        }

        this._clickState = clickState;
        // If last state was a hold and pointer is still inside click area, this
        // was a click
        const wasClick = inside && lastClickState === ClickState.Hold;

        this.dispatchEvent(ClickHelperEventType.StateChanged);
        if (wasClick) {
            this.dispatchEvent(ClickHelperEventType.Clicked);
        }
    }

    override get clickState(): ClickState {
        return this._clickState;
    }

    override reset(): void {
        if (this._clickState !== ClickState.Released) {
            this._clickState = ClickState.Released;
            this.dispatchEvent(ClickHelperEventType.StateChanged);
        }
    }
}
