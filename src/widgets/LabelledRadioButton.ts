import { Spacing, SpacingProperties } from './Spacing.js';
import { Label } from './Label.js';
import { RadioButton } from './RadioButton.js';
import { Row } from './Row.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import { type Box } from '../state/Box.js';
import { type WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { type ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import { type LabelProperties } from './BaseLabel.js';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a
 * {@link RadioButton}.
 *
 * @category Widget
 */
export class LabelledRadioButton<V> extends Row {
    static override autoXML: WidgetAutoXML = {
        name: 'labelled-radio-button',
        inputConfig: [
            {
                mode: 'text',
                name: 'text'
            },
            {
                mode: 'value',
                name: 'variable',
                validator: 'box'
            },
            {
                mode: 'value',
                name: 'value'
            }
        ]
    };

    constructor(text: string, variable: Box<V>, value: V, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super([
            new Label(text, propertiesNoID),
            new Spacing(propertiesNoID),
            new RadioButton(variable, value, propertiesNoID),
        ], properties);
    }
}
