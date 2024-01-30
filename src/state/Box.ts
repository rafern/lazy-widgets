import { Observable } from './Observable.js';

/**
 * Generic value holder interface that can be observed.
 *
 * @typeParam V - The type of {@link Box#value}.
 *
 * @category State Management
 */
export interface Box<V> extends Observable<V> {
    /**
     * The current value.
     *
     * When the value is set via this setter, the class implementing this
     * interface should notify the observable with no group (`undefined`). Note
     * that this is just a suggestion, not a strict requirement.
     */
    value: V;
    /**
     * Sets {@link Box#value}. Does nothing if the value is already the one
     * specified.
     *
     * @param group - The observable group that this change belongs to. `undefined` by default.
     * @returns Returns true if the value was changed, false if not
     */
    setValue(value: V, group?: unknown): boolean;
}
