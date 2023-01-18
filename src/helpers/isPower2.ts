/**
 * Checks whether a given number is a power of 2 greater than 0.
 *
 * @param number - The number to check
 * @returns Returns true if the number is a power of 2 greater than 0
 * @category Helper
 */
export function isPower2(number: number): boolean {
    return (number & (number - 1)) === 0;
}