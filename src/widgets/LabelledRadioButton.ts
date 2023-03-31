import { Spacing, SpacingProperties } from './Spacing';
import { Label } from './Label';
import { RadioButton } from './RadioButton';
import { Row } from './Row';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { Variable } from '../state/Variable';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';
import type { LabelProperties } from './BaseLabel';

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
                validator: 'variable'
            },
            {
                mode: 'value',
                name: 'value'
            }
        ]
    };

    constructor(text: string, variable: Variable<V>, value: V, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super([
            new Label(text, propertiesNoID),
            new Spacing(propertiesNoID),
            new RadioButton(variable, value, propertiesNoID),
        ], properties);
    }
}
