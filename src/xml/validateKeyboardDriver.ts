import { KeyboardDriver } from '../drivers/KeyboardDriver.js';
/**
 * A validator function which checks whether an input value is a
 * {@link KeyboardDriver}. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateKeyboardDriver(value: unknown): [value: KeyboardDriver, stop: boolean] {
    if (!(value instanceof KeyboardDriver)) {
        throw new Error('Invalid KeyboardDriver; not a KeyboardDriver instance');
    }

    return [value, false];
}
