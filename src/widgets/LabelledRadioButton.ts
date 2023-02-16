import { Spacing, SpacingProperties } from './Spacing';
import type { Variable } from '../state/Variable';
import { Label, LabelProperties } from './Label';
import { RadioButton } from './RadioButton';
import { Row } from './Row';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a
 * {@link RadioButton}.
 *
 * @category Widget
 * @category Aggregate Widget
 */
export class LabelledRadioButton<V> extends Row {
    static override autoXML: WidgetAutoXML = {
        parameters: [
            {
                mode: 'value',
                name: 'text',
                validator: 'string'
            },
            {
                mode: 'value',
                name: 'variable',
                validator: 'variable'
            },
            {
                mode: 'value',
                name: 'value'
            }
        ],
        hasOptions: true
    };

    constructor(text: string, variable: Variable<V>, value: V, properties?: Readonly<LabelProperties & SpacingProperties>) {
        super([
            new Label(text, properties),
            new Spacing(properties),
            new RadioButton(variable, value, properties),
        ], properties);
    }
}
