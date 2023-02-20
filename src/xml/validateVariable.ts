import { Variable } from '../state/Variable';

export function validateVariable(value: unknown): [value: Variable<unknown>, stop: boolean] {
    if (!(value instanceof Variable)) {
        throw new Error('Invalid Variable; not a Variable instance');
    }

    return [value, false];
}
