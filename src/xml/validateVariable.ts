import { Variable } from '../state/Variable.js';
/**
 * A validator function which checks whether an input value is a
 * {@link Variable}. Doesn't stop the validator chain.
 *
 * @deprecated This will be removed in the future. Please use {@link validateBox} instead
 * @category XML
 */
export function validateVariable(value: unknown): [value: Variable<unknown>, stop: boolean] {
    if (!(value instanceof Variable)) {
        throw new Error('Invalid Variable; not a Variable instance');
    }

    return [value, false];
}
