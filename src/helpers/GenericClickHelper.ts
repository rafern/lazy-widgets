import { BaseClickHelper } from './BaseClickHelper';
import { Widget } from '../widgets/Widget';
import { ClickState } from './ClickState';

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
export class GenericClickHelper implements BaseClickHelper {
    lastClickState: ClickState = ClickState.Released;
    clickState: ClickState = ClickState.Released;
    clickStateChanged = false;
    wasClick = false;
    protected widget: Widget;

    /**
     * Create a new GenericClickHelper
     *
     * @param widget - The Widget aggregating this helper
     */
    constructor(widget: Widget) {
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
            this.lastClickState = this.clickState;
            this.clickState = clickState;

            // If last state was a hold and pointer is still inside click
            // area, this was a click
            this.wasClick = inside && this.lastClickState === ClickState.Hold;
            this.clickStateChanged = true;
        }
        else
            this.clickStateChanged = false;
    }

    reset(): void {
        this.lastClickState = ClickState.Released;
        this.clickState = ClickState.Released;
        this.clickStateChanged = false;
        this.wasClick = false;
    }
}