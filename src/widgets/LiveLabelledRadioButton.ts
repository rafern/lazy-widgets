import { Spacing, SpacingProperties } from './Spacing.js';
import { LiveLabel } from './LiveLabel.js';
import { RadioButton } from './RadioButton.js';
import { Row } from './Row.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import type { Variable } from '../state/Variable.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import type { LabelProperties } from './BaseLabel.js';
import type { Observable } from '../state/Observable.js';
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
