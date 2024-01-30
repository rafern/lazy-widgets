import { Spacing, SpacingProperties } from './Spacing.js';
import { LiveLabel } from './LiveLabel.js';
import { Checkbox } from './Checkbox.js';
import { Row } from './Row.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import type { LabelProperties } from './BaseLabel.js';
import type { Observable } from '../state/Observable.js';
import { type Box } from '../state/Box.js';

/**
 * A {@link Row} with a {@link LiveLabel}, {@link Spacing} and a
 * {@link Checkbox}.
 *
 * @category Widget
 */
export class LiveLabelledCheckbox extends Row {
    static override autoXML: WidgetAutoXML = {
        name: 'live-labelled-checkbox',
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

    constructor(textSource: Observable<string>, variable?: Box<boolean>, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super([
            new LiveLabel(textSource, propertiesNoID),
            new Spacing(propertiesNoID),
            new Checkbox(variable, propertiesNoID),
        ], properties);
    }
}
