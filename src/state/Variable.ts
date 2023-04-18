import type { Observable } from './Observable.js';
import type { ObservableCallback } from './ObservableCallback.js';

/**
 * An aggregate helper class for widgets that contain a variable with a
 * specified type which is intended to be controlled by the user.
 *
 * Useful for implementing widgets such as sliders, checkboxes, text input,
 * etc...
 *
 * @typeParam V - The type of {@link Variable#value}.
 *
 * @category State Management
 */
export class Variable<V> implements Observable<V> {
    /** The current value, for internal use. */
    private _value: V;
    /** The function callbacks called when the value is changed */
    private callbacks = new Array<ObservableCallback<V>>();

    /**
     * @param initialValue - The initial value of this variable. Sets {@link Variable#_value}.
     */
    constructor(initialValue: V) {
        this._value = initialValue;
    }

    /**
     * The current value.
     *
     * If setting, {@link Variable#setValue} is called with no group.
     */
    get value(): V {
        return this._value;
    }

    set value(value: V) {
        this.setValue(value);
    }

    watch(callback: ObservableCallback<V>, callNow = false, group?: unknown): this {
        this.callbacks.push(callback);

        if(callNow) {
            this.doCallback(callback, group);
        }

        return this;
    }

    unwatch(callback: ObservableCallback<V>): this {
        const i = this.callbacks.indexOf(callback);

        if (i === -1) {
            console.warn('unwatch called, but watcher was not registered');
        } else {
            this.callbacks.splice(i, 1);
        }

        return this;
    }

    /**
     * Sets {@link Variable#_value}. Does nothing if the value is already the
     * one specified.
     *
     * @param group - The observable group that this change belongs to. `undefined` by default.
     * @returns Returns true if the value was changed, false if not
     */
    setValue(value: V, group?: unknown): boolean {
        if(this._value === value) {
            return false;
        }

        this._value = value;

        for(const callback of this.callbacks) {
            this.doCallback(callback, group);
        }

        return true;
    }

    private doCallback(callback: ObservableCallback<V>, group: unknown): void {
        try {
            callback(this, group);
        } catch(e) {
            console.error('Exception in watcher:', e);
        }
    }
}
