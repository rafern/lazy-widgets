import { type Box } from '../state/Box.js';
import { validateObservable } from './validateObservable.js';

/**
 * A validator function which checks whether an input value is a {@link Box}.
 * Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateBox(value: unknown): [value: Box<unknown>, stop: boolean] {
    // TODO it would be nice if param validators would assert input types
    validateObservable(value)[0];

    if (!('setValue' in (value as object))) {
        throw new Error('Invalid Box; no "setValue" method');
    }

    return [value as Box<unknown>, false];
}
