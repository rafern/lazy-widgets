import { Spacing, SpacingProperties } from './Spacing';
import type { Variable } from '../state/Variable';
import { Label, LabelProperties } from './Label';
import { Checkbox } from './Checkbox';
import { Row } from './Row';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a {@link Checkbox}.
 *
 * @category Widget
 * @category Aggregate Widget
 */
export class LabelledCheckbox extends Row {
    constructor(text: string, variable?: Variable<boolean>, properties?: Readonly<LabelProperties & SpacingProperties>) {
        super(properties);

        this.add([
            new Label(text, properties),
            new Spacing(properties),
            new Checkbox(variable, properties),
        ]);
    }
}
