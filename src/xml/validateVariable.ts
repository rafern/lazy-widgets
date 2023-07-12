import { Variable } from '../state/Variable.js';
/**
 * A validator function which checks whether an input value is a
 * {@link Variable}. Doesn't stop the validator chain.
 *
 * @category XML
 */
export function validateVariable(value: unknown): [value: Variable<unknown>, stop: boolean] {
    if (!(value instanceof Variable)) {
        throw new Error('Invalid Variable; not a Variable instance');
    }

    return [value, false];
}
