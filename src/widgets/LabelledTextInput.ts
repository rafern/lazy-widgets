import { Label } from './Label.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import { BaseLabelledTextInput } from './BaseLabelledTextInput.js';

import type { ValidatedVariable } from '../state/ValidatedVariable.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { LabelledTextInputProperties } from './BaseLabelledTextInput.js';

/**
 * A {@link Row} with a {@link Label}, {@link Spacing} and a {@link TextInput}.
 *
 * The TextInput is {@link ArtificialConstraint | constrained} to a width of 150
 * pixels by default. The constraints can be changed with the
 * `textInputConstraints` option.
 *
 * The TextInput also has wrapping disabled by default, and newlines filtered.
 *
 * @category Widget
 */
export class LabelledTextInput extends BaseLabelledTextInput {
    static override autoXML: WidgetAutoXML = {
        name: 'labelled-text-input',
        inputConfig: [
            {
                mode: 'text',
                name: 'text'
            },
            {
                mode: 'value',
                name: 'variable',
                validator: 'validated-variable',
                optional: true
            }
        ]
    };

    constructor(text: string, variable?: ValidatedVariable<string, unknown>, properties?: Readonly<LabelledTextInputProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);
        super(new Label(text, propertiesNoID), properties, propertiesNoID, variable);
    }
}
