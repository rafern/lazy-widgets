import { Spacing, SpacingProperties } from './Spacing';
import { LiveLabel } from './LiveLabel';
import { RadioButton } from './RadioButton';
import { Row } from './Row';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { Variable } from '../state/Variable';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';
import type { LabelProperties } from './BaseLabel';
import type { Observable } from '../state/Observable';

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
                name: 'text-source',
                validator: 'observable'
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

    constructor(textSource: Observable<string>, variable: Variable<V>, value: V, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super([
            new LiveLabel(textSource, propertiesNoID),
            new Spacing(propertiesNoID),
            new RadioButton(variable, value, propertiesNoID),
        ], properties);
    }
}
