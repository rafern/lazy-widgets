import { type Box } from './Box.js';
import { type ValidationResult } from './ValidationResult.js';

/**
 * Similar to {@link Box}, except the value can optionally be validated and
 * transformed by that same validator.
 *
 * @typeParam V - The type of {@link ValidatedBox#value}.
 * @typeParam T - The transformed type of a {@link ValidatedBox#validValue | valid value}.
 *
 * @category State Management
 */
export interface ValidatedBox<V, T> extends Box<V> {
    /** If true, then the current value is valid. */
    readonly valid: boolean;
    /**
     * The last valid value, post-transformation. If there was never a valid
     * value, `undefined` is returned.
     */
    readonly validValue: T;
    /** Check if a given value is valid. Does not modify the current value. */
    validate(value: V): ValidationResult<T>;
}
