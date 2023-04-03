import { Spacing, SpacingProperties } from './Spacing';
import { LiveLabel } from './LiveLabel';
import { RadioButton } from './RadioButton';
import { Row } from './Row';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { Variable } from '../state/Variable';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';
import type { LabelProperties } from './BaseLabel';

/**
 * A {@link Row} with a {@link LiveLabel}, {@link Spacing} and a
 * {@link RadioButton}.
 *
 * @category Widget
 */
export class LiveLabelledRadioButton<V> extends Row {
    static override autoXML: WidgetAutoXML = {
        name: 'live-labelled-radio-button',
        inputConfig: [
            {
                mode: 'value',
                name: 'textVariable',
                validator: 'variable'
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

    constructor(textVariable: Variable<string>, variable: Variable<V>, value: V, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super([
            new LiveLabel(textVariable, propertiesNoID),
            new Spacing(propertiesNoID),
            new RadioButton(variable, value, propertiesNoID),
        ], properties);
    }
}
