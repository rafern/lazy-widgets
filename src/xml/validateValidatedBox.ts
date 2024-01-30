import { type ValidatedBox } from '../state/ValidatedBox.js';
import { validateBox } from './validateBox.js';

/**
 * A validator function which checks whether an input value is a
 * {@link ValidatedBox}. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateValidatedBox(value: unknown): [value: ValidatedBox<unknown, unknown>, stop: boolean] {
    // TODO it would be nice if param validators would assert input types
    validateBox(value)[0];

    if (!('valid' in (value as object))) {
        throw new Error('Invalid ValidatedBox; no "valid" field');
    }

    if (!('validValue' in (value as object))) {
        throw new Error('Invalid ValidatedBox; no "validValue" field');
    }

    if (!('validate' in (value as object))) {
        throw new Error('Invalid ValidatedBox; no "validate" method');
    }

    return [value as ValidatedBox<unknown, unknown>, false];
}
