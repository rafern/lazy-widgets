import { type ValidatedBox } from './ValidatedBox.js';
import { type ValidationResult } from './ValidationResult.js';
import { type Validator } from './Validator.js';
import { Variable } from './Variable.js';

/**
 * Similar to {@link Variable}, except the variable's value can optionally be
 * validated by a {@link Validator | validator function}.
 *
 * @typeParam V - The type of {@link Variable#value}.
 * @typeParam T - The transformed type of a {@link ValidatedVariable#validValue | valid value}.
 *
 * @category State Management
 */
export class ValidatedVariable<V, T = V> extends Variable<V> implements ValidatedBox<V, T> {
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

    constructor(initialValue: V, validator: Validator<V, T> | null = null) {
        super(initialValue);

        this.validator = validator;
        this.validateAndSet(initialValue);
    }

    get valid() {
        return this._valid;
    }

    get validValue(): T {
        return this._validValue as T;
    }

    override setValue(value: V, group?: unknown): boolean {
        if(this.value === value) {
            return false;
        }

        this.validateAndSet(value);

        return super.setValue(value, group);
    }

    validate(value: V): ValidationResult<T> {
        if (this.validator) {
            return this.validator(value);
        } else {
            // XXX we have to assume that the user provided the right type
            return [true, value as unknown as T];
        }
    }

    private validateAndSet(value: V): void {
        const [valid, validValueCandidate] = this.validate(value);
        // XXX _valid is set in two stages so the type system knows whether
        // valid is true or false
        this._valid = valid;

        if(valid) {
            this._validValue = validValueCandidate;
        }
    }
}
