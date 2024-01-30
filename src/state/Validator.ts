import { type ValidationResult } from './ValidationResult.js';

/**
 * An input validator. A function which checks whether an input is valid and
 * transforms that input.
 *
 * @typeParam U - The type of the input.
 * @typeParam V - The type of the output (the transformed input).
 *
 * @category State Management
 */
export type Validator<U, V> = (value: U) => ValidationResult<V>;
