import { TextAlignMode } from '../helpers/TextHelper';
import { LiveLabel } from './LiveLabel';
import { Alignment } from '../theme/Alignment';
import { FilledButton } from './FilledButton';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { Alignment2D } from '../theme/Alignment2D';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';
import type { LabelProperties } from './BaseLabel';
import type { Observable } from '../state/Observable';

/**
 * A {@link FilledButton} with a {@link LiveLabel}. Alignment is forced to be
 * horizontally centered and vertically stretching like in {@link TextMargin}.
 * Text-wrapping is disabled so that text is centered properly.
 *
 * @category Widget
 */
export class LiveTextButton extends FilledButton<LiveLabel> {
    static override autoXML: WidgetAutoXML = {
        name: 'live-text-button',
        inputConfig: [
            {
                mode: 'value',
                name: 'text-source',
                validator: 'observable'
            }
        ]
    };

    constructor(textSource: Observable<string>, properties?: Readonly<LabelProperties & ClickableWidgetProperties>) {
        // default properties
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Stretch,
            },
            bodyTextAlign: TextAlignMode.Center,
            wrapText: false,
            ...properties
        };

        super(new LiveLabel(textSource, filterIDFromProperties(properties)), properties);
    }
}
