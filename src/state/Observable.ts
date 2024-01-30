import type { ObservableCallback } from './ObservableCallback.js';

/**
 * An object containing a value which can be efficiently watched for changes.
 *
 * @category State Management
 */
export interface Observable<V> {
    /** The current value. */
    get value(): V;
    /**
     * Register a callback to this observable. When the value is changed, the
     * callback will be called.
     *
     * @param callNow - If true, the callback will be called once immediately after it's registered. False by default
     * @param group - The group to use when calling immediately. Only used if callNow is true, and is `undefined` by default
     */
    watch(callback: ObservableCallback<V>, callNow?: boolean, group?: unknown): this;
    /** Unregister a previously registered callback from this observable. */
    unwatch(callback: ObservableCallback<V>): this;
}
