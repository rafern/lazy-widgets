import { Theme } from '../theme/Theme.js';

/**
 * A validator function which checks whether an input value is a {@link Theme}.
 * Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateTheme(value: unknown): [value: Theme, stop: boolean] {
    if (!(value instanceof Theme)) {
        throw new Error('Invalid Theme; not a Theme instance');
    }

    return [value, false];
}
