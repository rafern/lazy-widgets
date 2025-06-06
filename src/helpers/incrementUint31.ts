/**
 * Increment a 31-bit unsigned integer, wrapping around to 0. Useful for
 * implementing presentation hashes and other wrapping counters.
 *
 * Note that this does no validation checks, and will assume that the input is a
 * valid 31-bit unsigned integer. Behaviour is undefined for any other input.
 *
 * @category Helper
 */
export function incrementUint31(x: number) {
    return x === 0x7fffffff ? 0 : (x + 1);
}
