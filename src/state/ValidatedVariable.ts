import { Variable } from "./Variable";

/**
 * An input validator. A function which checks whether an input is valid and
 * transforms that input.
 *
 * @returns Returns a tuple containing whether the input is valid and the transformed input. Note that if the input is not valid, then the transformed input will be a bogus value.
 * @typeParam U - The type of the input.
 * @typeParam V - The type of the output (the transformed input).
 *
 * @category State Management
 */
export type Validator<U, V> = (value: U) => [true, V] | [false, unknown];

/**
 * A callback used for when a {@link ValidatedVariable} has its value changed.
 * Functionally equivalent to {@link VariableCallback}; only used for type
 * correctness.
 *
 * @category State Management
 */
export type ValidatedVariableCallback<V, T> = (value?: V, variable?: ValidatedVariable<V, T>) => void;

/**
 * Similar to {@link Variable}, except the variable's value can optionally be
 * validated by a {@link Validator | validator function}.
 *
 * @typeParam V - The type of {@link Variable#value}.
 * @typeParam T - The transformed type of a {@link ValidatedVariable#validValue | valid value}.
 *
 * @category State Management
 */
export class ValidatedVariable<V, T = V, C extends CallableFunction = ValidatedVariableCallback<V, T>> extends Variable<V, C> {
    /** See {@link ValidatedVariable#valid}. For internal use only */
    private _valid = true;
    /** See {@link ValidatedVariable#validValue}. For internal use only */
    private _validValue?: T;
    /**
     * The validator/transformer used for this variable's value. If null, then
     * the value will always be valid and {@link ValidatedVariable#validValue}
     * will be equal to {@link Variable#value}.
     */
    readonly validator: Validator<V, T> | null;

    constructor(initialValue: V, validator: Validator<V, T> | null = null, callback?: C, callNow = true) {
        super(initialValue, callback, false);

        this.validator = validator;
        this.validate(initialValue);

        if(callback && callNow)
            this.doCallback(callback);
    }

    /** If true, then the current value is valid. */
    get valid() {
        return this._valid;
    }

    /**
     * The last valid value. If there was never a valid value, `undefined` is
     * returned.
     */
    get validValue(): T {
        return this._validValue as T;
    }

    override setValue(value: V, notify = true): boolean {
        if(this.value === value)
            return false;

        this.validate(value);

        return super.setValue(value, notify);
    }

    private validate(value: V): void {
        if(this.validator) {
            const [valid, validValueCandidate] = this.validator(value);
            // XXX _valid is set in two stages so the type system knows whether
            // valid is true or false
            this._valid = valid;

            if(valid)
                this._validValue = validValueCandidate;
        }
    }
}
