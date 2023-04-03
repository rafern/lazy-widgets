import type { Observable } from './Observable';

/**
 * A callback used for watching changes in a value of an {@link Observable}.
 *
 * @param group - The observable group that this change belongs to. Useful for selectively ignoring changes. `undefined` by default, which means that the change doesn't belong to any group and shouldn't be ignored.
 * @param source - The observable where this change originated from. This will be the last observable; if a value is transformed, the transformable observer will be the source, not the initial observable.
 * @category State Management
 */
export type ObservableCallback<V> = (source: Observable<V>, group: unknown) => void;
