import { TextAlignMode } from '../helpers/TextHelper.js';
import { LiveLabel } from './LiveLabel.js';
import { Alignment } from '../theme/Alignment.js';
import { FilledButton } from './FilledButton.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import type { Alignment2D } from '../theme/Alignment2D.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import type { LabelProperties } from './BaseLabel.js';
import type { Observable } from '../state/Observable.js';
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
