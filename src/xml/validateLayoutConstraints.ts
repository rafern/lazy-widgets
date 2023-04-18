import type { LayoutConstraints } from '../core/LayoutConstraints.js';

/**
 * A validator function which checks whether an input value is a
 * {@link LayoutConstraints}. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateLayoutConstraints(value: unknown): [value: LayoutConstraints, stop: boolean] {
    if (typeof value !== 'object') {
        throw new Error('Invalid LayoutConstraints; not an object type');
    }

    if (!Array.isArray(value)) {
        throw new Error('Invalid LayoutConstraints; Array.isArray is false');
    }

    if (value.length !== 4) {
        throw new Error(`Invalid LayoutConstraints; must have a length of 4 (has ${value.length})`);
    }

    if (isNaN(value[0])) {
        throw new Error('Invalid LayoutConstraints; minWidth (index 0) is not a number');
    }
    if (isNaN(value[1])) {
        throw new Error('Invalid LayoutConstraints; maxWidth (index 1) is not a number');
    }
    if (isNaN(value[2])) {
        throw new Error('Invalid LayoutConstraints; minHeight (index 2) is not a number');
    }
    if (isNaN(value[3])) {
        throw new Error('Invalid LayoutConstraints; maxHeight (index 3) is not a number');
    }

    return [value as LayoutConstraints, false];
}
