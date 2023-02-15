export function validateNullable<T>(validator: (value: unknown) => T): (value: unknown) => T | null {
    return (value: unknown) => {
        if (value === null) {
            return null;
        } else {
            return validator(value);
        }
    }
}
