import { LiveLabel } from './LiveLabel';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';
import { BaseLabelledTextInput } from './BaseLabelledTextInput';

import type { ValidatedVariable } from '../state/ValidatedVariable';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { LabelledTextInputProperties } from './BaseLabelledTextInput';
import type { Observable } from '../state/Observable';

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
