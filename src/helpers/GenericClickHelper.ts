import { BaseClickHelper } from './BaseClickHelper.js';
import { Widget } from '../widgets/Widget.js';
import { ClickState } from './ClickState.js';
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
    override clickState: ClickState = ClickState.Released;
    override clickStateChanged = false;
    override wasClick = false;
    protected widget: Widget;

    /**
     * @param widget - The Widget aggregating this helper
     */
    constructor(widget: Widget) {
        super();
        this.widget = widget;
    }

    /**
     * Set {@link GenericClickHelper#clickState} and update
     * {@link GenericClickHelper#lastClickState} if current one differs. Updates
     * {@link GenericClickHelper#wasClick} and
     * {@link GenericClickHelper#clickStateChanged} flags.
     */
    setClickState(clickState: ClickState, inside: boolean): void {
        if(this.clickState !== clickState) {
            const lastClickState = this.clickState;
            this.clickState = clickState;

            // If last state was a hold and pointer is still inside click
            // area, this was a click
            this.wasClick = inside && lastClickState === ClickState.Hold;
            this.clickStateChanged = true;
        }
    }

    override doneProcessing() {
        this.clickStateChanged = false;
    }

    override reset(): void {
        this.clickState = ClickState.Released;
        this.clickStateChanged = true;
        this.wasClick = false;
    }
}
