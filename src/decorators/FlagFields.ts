import { DynMsg } from "../core/Strings.js";
/**
 * A decorator for a public field which sets calls a callback if the property's
 * value is changed.
 *
 * @typeParam V - The type of the field being watched
 * @param callback - The callback to call if the value changes. `this` is bound.
 * @category Decorator
 */
export function watchField<V>(callback: (oldValue: V) => void): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function(target: Object, propertyKey: string | symbol): void {
        const curValues = new WeakMap();
        Object.defineProperty(target, propertyKey, {
            set: function(value) {
                const oldValue = curValues.get(this);
                if(value !== oldValue) {
                    curValues.set(this, value);
                    callback.call(this, oldValue);
                }
            },
            get: function() {
                return curValues.get(this);
            },
            enumerable: true,
            configurable: true,
        });
    }
}

/**
 * A {@link watchField} which sets a given flag to true.
 *
 * @param flagKey - The key of the flag property to set to true
 * @category Decorator
 */
export function flagField(flagKey: string | symbol): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return watchField(function(this: Object, _oldValue) {
        (this as Record<string | symbol, unknown>)[flagKey] = true;
    });
}

/**
 * A {@link watchField} which calls a method named `markWholeAsDirty` with no
 * arguments. It's recommended to only use this on {@link Widget} and its
 * subclasses, although technically you can use it in any class so long as it
 * has a `markWholeAsDirty` method.
 *
 * @category Decorator
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const damageField = watchField(function(this: Object, _oldValue) {
    Object.getPrototypeOf(this).markWholeAsDirty.apply(this);
});

/**
 * A {@link flagField} where the flag key is `_layoutDirty`.
 *
 * @category Decorator
 */
export const layoutField = flagField('_layoutDirty');

/**
 * A {@link watchField} which sets a given array of flags to true.
 *
 * @param flagKeys - An array containing the keys of each flag property to set to true
 * @category Decorator
 */
export function multiFlagField(flagKeys: Array<string | symbol>): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return watchField(function(this: Object, _oldValue) {
        for(const flagKey of flagKeys) {
            (this as Record<string | symbol, unknown>)[flagKey] = true;
        }
    });
}

/**
 * Similar to {@link watchField}, but for array fields, like tuples. Getting the
 * property returns a shallow copy of the tuple, setting the value uses a
 * shallow copy of the input value if the current value is not an array. If both
 * the new value and the current value are arrays, then the current value's
 * members are updated; no shallow copy is created.
 *
 * @param callback - The callback to call if the value changes. `this` is bound.
 * @param allowNonArrays - Allow values which are not arrays to be used?
 * @category Decorator
 */
export function watchArrayField(callback: () => void, allowNonArrays = false): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function(target: Object, propertyKey: string | symbol): void {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const curValues = new WeakMap<Object, unknown | Array<unknown>>();
        Object.defineProperty(target, propertyKey, {
            set: function(value: unknown | Array<unknown>) {
                if(Array.isArray(value)) {
                    const curTuple = curValues.get(this);
                    if(Array.isArray(curTuple)) {
                        if(value.length !== curTuple.length) {
                            curTuple.length = value.length;
                            for(let i = 0; i < value.length; i++) {
                                curTuple[i] = value[i];
                            }

                            callback.call(this);
                        } else {
                            for(let i = 0; i < value.length; i++) {
                                if(curTuple[i] !== value[i]) {
                                    for(let j = 0; j < value.length; j++) {
                                        curTuple[j] = value[j];
                                    }

                                    callback.call(this);

                                    return;
                                }
                            }
                        }
                    } else {
                        curValues.set(this, [...value]);
                        callback.call(this);
                    }
                } else {
                    if(allowNonArrays) {
                        curValues.set(this, value);
                        callback.call(this);
                    } else {
                        throw new Error(DynMsg.NON_ARRAY_VALUE(propertyKey, value));
                    }
                }
            },
            get: function() {
                const curTuple = curValues.get(this);
                if(!Array.isArray(curTuple)) {
                    return curTuple;
                }

                return [...curTuple];
            },
            enumerable: true,
            configurable: true,
        });
    }
}

/**
 * A {@link watchArrayField} which sets a given flag to true.
 *
 * @param flagKey - The key of the flag property to set to true
 * @param allowNonArrays - Allow values which are not arrays to be used?
 * @category Decorator
 */
export function flagArrayField(flagKey: string, allowNonArrays = false): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return watchArrayField(function(this: Object) {
        (this as Record<string | symbol, unknown>)[flagKey] = true;
    }, allowNonArrays);
}

/**
 * A mix between {@link damageField} and {@link watchArrayField}.
 *
 * @param allowNonArrays - Allow values which are not arrays to be used?
 * @category Decorator
 */
export function damageArrayField(allowNonArrays = false): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return watchArrayField(function(this: Object) {
        Object.getPrototypeOf(this).markWholeAsDirty.apply(this);
    }, allowNonArrays);
}

/**
 * A {@link flagArrayField} where the flag key is `_layoutDirty`.
 *
 * @param allowNonArrays - Allow values which are not arrays to be used?
 * @category Decorator
 */
export function layoutArrayField(allowNonArrays = false): PropertyDecorator {
    return flagArrayField('_layoutDirty', allowNonArrays);
}

/**
 * A {@link watchArrayField} which sets a given array of flags to true.
 *
 * @param flagKeys - An array containing the keys of each flag property to set to true
 * @param allowNonArrays - Allow values which are not arrays to be used?
 * @category Decorator
 */
export function multiFlagArrayField(flagKeys: Array<string>, allowNonArrays = false): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return watchArrayField(function(this: Object) {
        for(const flagKey of flagKeys) {
            (this as Record<string | symbol, unknown>)[flagKey] = true;
        }
    }, allowNonArrays);
}

/**
 * A {@link watchArrayField} where the '_layoutDirty' flag is set, and a damage
 * method is called in the same way as {@link damageField}.
 *
 * @param allowNonArrays - Allow values which are not arrays to be used?
 * @category Decorator
 */
export function damageLayoutArrayField(allowNonArrays = false): PropertyDecorator {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return watchArrayField(function(this: Object) {
        (this as Record<string | symbol, unknown>)._layoutDirty = true;
        Object.getPrototypeOf(this).markWholeAsDirty.apply(this);
    }, allowNonArrays);
}
