import { Variable, VariableCallback } from '../state/Variable';

export function validateVariable<V, C extends CallableFunction = VariableCallback<V>>(value: unknown): Variable<V, C> {
    if (!(value instanceof Variable)) {
        throw new Error('Invalid Variable; not a Variable instance');
    }

    return value;
}
