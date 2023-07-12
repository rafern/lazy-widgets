import { Spacing, SpacingProperties } from './Spacing.js';
import { Label } from './Label.js';
import { Checkbox } from './Checkbox.js';
import { Row } from './Row.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import type { Variable } from '../state/Variable.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import type { LabelProperties } from './BaseLabel.js';
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
