import { type ClickHelperEventListener } from './ClickHelperEventListener.js';
import { ClickHelperEventType } from './ClickHelperEventType.js';
import { type ClickState } from './ClickState.js';
import { ConcurrentCollection } from './ConcurrentCollection.js';

/**
 * The base class for {@link CompoundClickHelper} and
 * {@link GenericClickHelper}. All click state properties must be at least
 * gettable, and optionally settable.
 *
 * @category Helper
 */
export abstract class BaseClickHelper {
    private readonly listeners = new ConcurrentCollection<ClickHelperEventListener>();

    /** Listen to events from this helper. Duplicate listeners allowed. */
    addEventListener(listener: ClickHelperEventListener): void {
        this.listeners.add(listener);
    }

    /**
     * Stop listening to events from this helper. If a duplicate listener is
     * removed, only one is removed.
     *
     * @returns True if a listener was removed, false otherwise.
     */
    removeEventListener(listener: ClickHelperEventListener): boolean {
        return this.listeners.removeByValue(listener);
    }

    private dispatchToListener(eventType: ClickHelperEventType, listener: ClickHelperEventListener): void {
        try {
            listener(eventType);
        } catch(err) {
            console.error(err);
        }
    }

    /** Dispatch an event to all listeners. */
    protected dispatchEvent(eventType: ClickHelperEventType) {
        this.listeners.forEach(this.dispatchToListener.bind(this, eventType));
    }

    /** The current click state */
    abstract get clickState(): ClickState;
    /**
     * Reset the click helper to its default state. Only call this if absolutely
     * necessary, such as when the owner Widget is re-activated (this way, hover
     * states don't linger when a Widget is disabled).
     */
    abstract reset(): void;
}
