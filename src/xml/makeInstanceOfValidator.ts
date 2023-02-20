/**
 * Creates a new validator function which checks whether an input value is an
 * instance of a given class. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function makeInstanceOfValidator<T>(clazz: new (...args: unknown[]) => T): (inputValue: unknown) => [value: T, stop: boolean] {
    return (value) => {
        if (value instanceof clazz) {
            return [value, false];
        } else {
            throw new Error('Invalid instance; not an instance of the wanted class');
        }
    }
}
