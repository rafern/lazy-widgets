import { Theme } from '../theme/Theme';

export function validateTheme(value: unknown): Theme {
    if (!(value instanceof Theme)) {
        throw new Error('Invalid Theme; not a Theme instance');
    }

    return value;
}
