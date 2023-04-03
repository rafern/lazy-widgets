import type { Observable } from './Observable';
import type { ObservableCallback } from './ObservableCallback';

// HACK: I extends Iterable<Observable<U>> | [Observable<U>] instead of just
//       extending Iterable<Observable<U>> because this forces typescript to
//       prefer tuples over arrays, which is more helpful for the transformer
//       user callback.
/**
 * An {@link Observable} which transforms a list of input Observables into a
 * single value efficiently.
 *
 * @category State Management
 */
export class ObservableTransformer<V, I extends Iterable<Observable<U>> | [Observable<U>], U = unknown> implements Observable<V> {
    private dirty = true;
    private cache!: V;
    private watcher: ObservableCallback<U> | null;
    /** The function callbacks called when the value is changed */
    private callbacks = new Array<ObservableCallback<V>>();

    /**
     * The current value.
     *
     * Evaluated when needed. Values are cached.
     */
    get value(): V {
        if (this.dirty) {
            this.cache = this.transformer(this.inputs);
            this.dirty = false;
        }

        return this.cache;
    }

    /**
     * @param inputs - The list of observables to use as inputs for this transformer.
     * @param transformer - The actual transformer function. Takes in a list of input observables, and outputs a single value.
     * @param decider - Decides whether the transformer's output value needs to be updated or not. If `undefined` (the default), then the value is always assumed to need to be updated whenever an input watcher is invoked.
     */
    constructor(readonly inputs: I, readonly transformer: (inputs: I) => V, readonly decider?: (inputs: I) => boolean) {
        this.watcher = (_source: Observable<unknown>, group?: unknown) => {
            if (this.decider === undefined || this.decider(this.inputs)) {
                this.dirty = true;

                for (const callback of this.callbacks) {
                    callback(this, group);
                }
            }
        };

        for (const input of this.inputs) {
            input.watch(this.watcher);
        }
    }

    destroy() {
        if (this.watcher === null) {
            return;
        }

        for (const input of this.inputs) {
            input.unwatch(this.watcher);
        }

        this.watcher = null;
    }

    watch(callback: ObservableCallback<V>, callNow = true, group?: unknown): this {
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

    private doCallback(callback: ObservableCallback<V>, group: unknown): void {
        try {
            callback(this, group);
        } catch(e) {
            console.error('Exception in watcher:', e);
        }
    }
}
