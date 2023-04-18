import { ClickState } from './ClickState.js';

/**
 * The common interface for {@link CompoundClickHelper} and
 * {@link GenericClickHelper}. All click state properties must be at least
 * gettable, and optionally settable.
 *
 * @category Helper
 */
export interface BaseClickHelper {
    /** Last click state */
    get lastClickState(): ClickState;
    /** The current click state */
    get clickState(): ClickState;
    /** Did the last click event handle result in a click state change? */
    get clickStateChanged(): boolean;
    /** Did the last click state change result in a click? */
    get wasClick(): boolean;
    /**
     * Reset the click helper to its default state, except for the
     * clickStateChanged flag, which is set to true. Only call this if
     * absolutely necessary, such as when the owner Widget is re-activated (this
     * way, hover states don't linger when a Widget is disabled).
     *
     * You may be looking for {@link BaseClickHelper#doneProcessing} instead.
     */
    reset(): void;
    /**
     * Signal to this click helper that you are done processing changes in
     * state. This simply resets the
     * {@link BaseClickHelper#clickStateChanged} flag.
     */
    doneProcessing(): void;
}
