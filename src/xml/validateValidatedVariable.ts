import { ValidatedVariable, ValidatedVariableCallback } from '../state/ValidatedVariable';

export function validateValidatedVariable<V, T = V, C extends CallableFunction = ValidatedVariableCallback<V, T>>(value: unknown): ValidatedVariable<V, T, C> {
    if (!(value instanceof ValidatedVariable)) {
        throw new Error('Invalid ValidatedVariable; not a ValidatedVariable instance');
    }

    return value;
}
