import { LiveLabel } from './LiveLabel.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import { BaseLabelledTextInput } from './BaseLabelledTextInput.js';

import type { ValidatedVariable } from '../state/ValidatedVariable.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { LabelledTextInputProperties } from './BaseLabelledTextInput.js';
import type { Observable } from '../state/Observable.js';

/**
 * Similar to {@link LabelledTextInput}, but a {@link LiveLabel} is used.
 *
 * @category Widget
 */
export class LiveLabelledTextInput extends BaseLabelledTextInput {
    static override autoXML: WidgetAutoXML = {
        name: 'live-labelled-text-input',
        inputConfig: [
            {
                mode: 'value',
                name: 'text-source',
                validator: 'observable'
            },
            {
                mode: 'value',
                name: 'variable',
                validator: 'validated-variable',
                optional: true
            }
        ]
    };

    constructor(textSource: Observable<string>, variable?: ValidatedVariable<string, unknown>, properties?: Readonly<LabelledTextInputProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);
        super(new LiveLabel(textSource, propertiesNoID), properties, propertiesNoID, variable);
    }
}
