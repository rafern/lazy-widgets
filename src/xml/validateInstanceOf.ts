export function validateInstanceOf<T>(clazz: new (...args: unknown[]) => T): (value: unknown) => T {
    return (value: unknown) => {
        if (value instanceof clazz) {
            return value;
        } else {
            throw new Error('Invalid instance; not an instance of the wanted class');
        }
    }
}
