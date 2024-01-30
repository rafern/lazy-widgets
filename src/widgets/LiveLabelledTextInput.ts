import { LiveLabel } from './LiveLabel.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import { BaseLabelledTextInput } from './BaseLabelledTextInput.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { LabelledTextInputProperties } from './BaseLabelledTextInput.js';
import type { Observable } from '../state/Observable.js';
import { type Box } from '../state/Box.js';
import { type ValidatedBox } from '../state/ValidatedBox.js';

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
                validator: 'box',
                optional: true
            }
        ]
    };

    constructor(textSource: Observable<string>, variable?: ValidatedBox<string, unknown> | Box<string>, properties?: Readonly<LabelledTextInputProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);
        super(new LiveLabel(textSource, propertiesNoID), properties, propertiesNoID, variable);
    }
}
