import { Spacing, SpacingProperties } from './Spacing';
import { LiveLabel } from './LiveLabel';
import { Checkbox } from './Checkbox';
import { Row } from './Row';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { Variable } from '../state/Variable';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';
import type { LabelProperties } from './BaseLabel';

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
                name: 'textVariable',
                validator: 'variable'
            },
            {
                mode: 'value',
                name: 'variable',
                validator: 'variable',
                optional: true
            }
        ]
    };

    constructor(textVariable: Variable<string>, variable?: Variable<boolean>, properties?: Readonly<LabelProperties & SpacingProperties & ClickableWidgetProperties>) {
        const propertiesNoID = filterIDFromProperties(properties);

        super([
            new LiveLabel(textVariable, propertiesNoID),
            new Spacing(propertiesNoID),
            new Checkbox(variable, propertiesNoID),
        ], properties);
    }
}
