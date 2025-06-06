import { type ClickHelperEventType } from './ClickHelperEventType.js';
import { type ClickState } from './ClickState.js';
import { Notifier } from './Notifier.js';

/**
 * The base class for {@link CompoundClickHelper} and
 * {@link GenericClickHelper}. All click state properties must be at least
 * gettable, and optionally settable.
 *
 * @category Helper
 */
export abstract class BaseClickHelper extends Notifier<ClickHelperEventType> {
    /** The current click state */
    abstract get clickState(): ClickState;
    /**
     * Reset the click helper to its default state. Only call this if absolutely
     * necessary, such as when the owner Widget is re-activated (this way, hover
     * states don't linger when a Widget is disabled).
     */
    abstract reset(): void;
}
