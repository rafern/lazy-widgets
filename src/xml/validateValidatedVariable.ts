import { ValidatedVariable } from '../state/ValidatedVariable';

export function validateValidatedVariable(value: unknown): [value: ValidatedVariable<unknown>, stop: boolean] {
    if (!(value instanceof ValidatedVariable)) {
        throw new Error('Invalid ValidatedVariable; not a ValidatedVariable instance');
    }

    return [value, false];
}
