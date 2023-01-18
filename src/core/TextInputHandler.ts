/**
 * A function which prompts the user for input given an already set input and
 * returns a promise containing the text typed by the user.
 *
 * @category Core
 */
 export type TextInputHandler = (initialInput: string) => Promise<string>;