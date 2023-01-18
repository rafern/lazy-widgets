/**
 * Rounds a given number up or down to a power of 2. Useful for working with
 * textures.
 *
 * @param number - The number to round
 * @param roundUp - If true, rounds the number to the smallest power of 2 greater
 * or equal to the input, else, rounds the number to the greatest power of 2
 * smaller or equal to the input.
 *
 * @returns Returns the rounded number
 *
 * @category Helper
 */
export function roundToPower2(number: number, roundUp = true): number {
    const roundFun = roundUp ? Math.ceil : Math.floor;
    return Math.pow(2, roundFun(Math.log2(number)));
}