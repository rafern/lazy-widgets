import { KeyboardDriver } from '../drivers/KeyboardDriver';

export function validateKeyboardDriver(value: unknown): [value: KeyboardDriver, stop: boolean] {
    if (!(value instanceof KeyboardDriver)) {
        throw new Error('Invalid KeyboardDriver; not a KeyboardDriver instance');
    }

    return [value, false];
}
