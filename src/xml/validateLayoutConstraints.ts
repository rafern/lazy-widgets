import type { LayoutConstraints } from '../core/LayoutConstraints';

export function validateKeyContext(value: unknown): LayoutConstraints {
    if (typeof value !== 'object') {
        throw new Error('Invalid LayoutConstraints; not an object type');
    }

    if (!Array.isArray(value)) {
        throw new Error('Invalid LayoutConstraints; Array.isArray is false');
    }

    if (value.length !== 4) {
        throw new Error(`Invalid LayoutConstraints; must have a length of 4 (has ${value.length})`);
    }

    const lc = value as LayoutConstraints;

    if (isNaN(lc[0])) {
        throw new Error('Invalid LayoutConstraints; minWidth (index 0) is not a number');
    }
    if (isNaN(lc[1])) {
        throw new Error('Invalid LayoutConstraints; maxWidth (index 1) is not a number');
    }
    if (isNaN(lc[2])) {
        throw new Error('Invalid LayoutConstraints; minHeight (index 2) is not a number');
    }
    if (isNaN(lc[3])) {
        throw new Error('Invalid LayoutConstraints; maxHeight (index 3) is not a number');
    }

    return lc;
}
