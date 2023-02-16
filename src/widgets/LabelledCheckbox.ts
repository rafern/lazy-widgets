import { Spacing, SpacingProperties } from './Spacing';
import type { Variable } from '../state/Variable';
import { Label, LabelProperties } from './Label';
import { Checkbox } from './Checkbox';
import { Row } from './Row';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a {@link Checkbox}.
 *
 * @category Widget
 * @category Aggregate Widget
 */
export class LabelledCheckbox extends Row {
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
                validator: 'variable',
                optional: true
            }
        ],
        hasOptions: true
    };

    constructor(text: string, variable?: Variable<boolean>, properties?: Readonly<LabelProperties & SpacingProperties>) {
        super([
            new Label(text, properties),
            new Spacing(properties),
            new Checkbox(variable, properties),
        ], properties);
    }
}
