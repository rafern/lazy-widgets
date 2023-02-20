import type { KeyContext } from '../widgets/VirtualKeyboard/KeyContext';

/**
 * A validator function which checks whether an input value is a
 * {@link KeyContext}. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateKeyContext(value: unknown): [value: KeyContext, stop: boolean] {
    if (typeof value !== 'object') {
        throw new Error('Invalid KeyContext; not an object');
    }

    if (value === null) {
        throw new Error('Invalid KeyContext; null');
    }

    const kc = value as KeyContext;

    if (typeof kc.callback !== 'function') {
        throw new Error('Invalid KeyContext; callback is not a function');
    }
    if (typeof kc.shift !== 'boolean') {
        throw new Error('Invalid KeyContext; shift is not a boolean');
    }
    if (typeof kc.ctrl !== 'boolean') {
        throw new Error('Invalid KeyContext; ctrl is not a boolean');
    }
    if (typeof kc.alt !== 'boolean') {
        throw new Error('Invalid KeyContext; alt is not a boolean');
    }

    return [kc, false];
}
