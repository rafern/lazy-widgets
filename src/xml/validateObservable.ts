import { Observable } from '../state/Observable.js';
/**
 * A validator function which checks whether an input value is an observable.
 * Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateObservable(value: unknown): [value: Observable<unknown>, stop: boolean] {
    if (typeof value !== 'object') {
        throw new Error('Invalid observable; not an object type');
    }

    if (value === null) {
        throw new Error('Invalid observable; null');
    }

    if (!('value' in value)) {
        throw new Error('Invalid observable; no "value" field');
    }

    if (!('watch' in value)) {
        throw new Error('Invalid observable; no "watch" field');
    }

    if (!('unwatch' in value)) {
        throw new Error('Invalid observable; no "unwatch" field');
    }

    return [value as Observable<unknown>, false];
}
