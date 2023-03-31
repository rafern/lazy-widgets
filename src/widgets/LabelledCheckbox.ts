import { Spacing, SpacingProperties } from './Spacing';
import { Label, LabelProperties } from './Label';
import { Checkbox } from './Checkbox';
import { Row } from './Row';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { Variable } from '../state/Variable';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a {@link Checkbox}.
 *
 * @category Widget
 */
export class LabelledCheckbox extends Row {
    static override autoXML: WidgetAutoXML = {
        name: 'labelled-checkbox',
        inputConfig: [
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
        ]
    };

    constructor(text: string, variable?: Variable<boolean>, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super([
            new Label(text, propertiesNoID),
            new Spacing(propertiesNoID),
            new Checkbox(variable, propertiesNoID),
        ], properties);
    }
}
