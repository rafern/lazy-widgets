/**
 * The result of a validator function; a tuple containing whether the input is
 * valid and the transformed input, in that order.
 *
 * Note that if the input is not valid, then the transformed input will be a
 * bogus value. It might not even be the type you expect.
 *
 * @typeParam T - The type of the output (the transformed input).
 *
 * @category State Management
 */
export type ValidationResult<T> = [true, T] | [false, unknown];