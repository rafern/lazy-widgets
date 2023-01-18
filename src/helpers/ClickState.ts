/**
 * The current state of a {@link BaseClickHelper}
 *
 * @category Helper
 */
export enum ClickState {
    /** No pointer is hovering over this clickable widget */
    Released = 0,
    /** A pointer is hovering over this clickable widget */
    Hover = 1,
    /** A pointer's button is being held down over this clickable widget */
    Hold = 2,
}