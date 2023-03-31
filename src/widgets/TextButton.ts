import { TextAlignMode } from '../helpers/TextHelper';
import { Label } from './Label';
import { Alignment } from '../theme/Alignment';
import { FilledButton } from './FilledButton';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties';

import type { Alignment2D } from '../theme/Alignment2D';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties';
import type { LabelProperties } from './BaseLabel';

/**
 * A {@link FilledButton} with a {@link Label}. Alignment is forced to be
 * horizontally centered and vertically stretching like in {@link TextMargin}.
 * Text-wrapping is disabled so that text is centered properly.
 *
 * @category Widget
 */
export class TextButton extends FilledButton<Label> {
    static override autoXML: WidgetAutoXML = {
        name: 'text-button',
        inputConfig: [
            {
                mode: 'text',
                name: 'text'
            }
        ]
    };

    constructor(text: string, properties?: Readonly<LabelProperties & ClickableWidgetProperties>) {
        // default properties
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Stretch,
            },
            bodyTextAlign: TextAlignMode.Center,
            wrapText: false,
            ...properties
        };

        super(new Label(text, filterIDFromProperties(properties)), properties);
    }
}
