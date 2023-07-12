import { ValidatedVariable } from '../state/ValidatedVariable.js';
/**
 * A validator function which checks whether an input value is a
 * {@link ValidatedVariable}. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateValidatedVariable(value: unknown): [value: ValidatedVariable<unknown>, stop: boolean] {
    if (!(value instanceof ValidatedVariable)) {
        throw new Error('Invalid ValidatedVariable; not a ValidatedVariable instance');
    }

    return [value, false];
}
