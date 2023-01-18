import { Spacing, SpacingProperties } from './Spacing';
import type { Variable } from '../state/Variable';
import { Label, LabelProperties } from './Label';
import { RadioButton } from './RadioButton';
import { Row } from './Row';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a
 * {@link RadioButton}.
 *
 * @category Widget
 * @category Aggregate Widget
 */
export class LabelledRadioButton<V> extends Row {
    constructor(text: string, variable: Variable<V>, value: V, properties?: Readonly<LabelProperties & SpacingProperties>) {
        super(properties);

        this.add([
            new Label(text, properties),
            new Spacing(properties),
            new RadioButton(variable, value, properties),
        ]);
    }
}
