import { ConcurrentCollection } from './ConcurrentCollection.js';

/**
 * A listener callback for a {@link Notifier}.
 *
 * @category Helper
 */
export type Listener<E> = (event: E) => void;

/**
 * A base class that can be listened to, and dispatch events.
 *
 * @category Helper
 */
export abstract class Notifier<E> {
    protected readonly listeners = new ConcurrentCollection<Listener<E>>();

    /** Listen to events from this helper. Duplicate listeners allowed. */
    addEventListener(listener: Listener<E>): void {
        this.listeners.add(listener);
    }

    /**
     * Stop listening to events from this helper. If a duplicate listener is
     * removed, only one is removed.
     *
     * @returns True if a listener was removed, false otherwise.
     */
    removeEventListener(listener: Listener<E>): boolean {
        return this.listeners.removeByValue(listener);
    }

    /**
     * Dispatch an event to a specific listener. Listener does not have to be
     * added
     */
    protected dispatchToListener(event: E, listener: Listener<E>): void {
        try {
            listener(event);
        } catch(err) {
            console.error(err);
        }
    }

    /** Dispatch an event to all listeners. */
    protected dispatchEvent(event: E) {
        this.listeners.forEach(this.dispatchToListener.bind(this, event));
    }
}
