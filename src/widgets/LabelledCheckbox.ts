import { Spacing, SpacingProperties } from './Spacing';
import type { Variable } from '../state/Variable';
import { Label, LabelProperties } from './Label';
import { Checkbox } from './Checkbox';
import { Row } from './Row';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a {@link Checkbox}.
 *
 * @category Widget
 */
export class LabelledCheckbox extends Row {
    static override autoXML: WidgetAutoXML = [
        {
            mode: 'text',
            name: 'text'
        },
        {
            mode: 'value',
            name: 'variable',
            validator: 'variable',
            optional: true
        }
    ];

    constructor(text: string, variable?: Variable<boolean>, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        super([
            new Label(text, properties),
            new Spacing(properties),
            new Checkbox(variable, properties),
        ], properties);
    }
}
