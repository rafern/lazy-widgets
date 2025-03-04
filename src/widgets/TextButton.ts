import { TextAlignMode, WrapMode } from '../helpers/TextHelper.js';
import { Label } from './Label.js';
import { Alignment } from '../theme/Alignment.js';
import { FilledButton } from './FilledButton.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import type { Alignment2D } from '../theme/Alignment2D.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import type { LabelProperties } from './BaseLabel.js';
/**
 * A {@link FilledButton} with a {@link Label}. Alignment is forced to be
 * horizontally centered and vertically stretching. Text-wrapping is disabled so
 * that text is centered properly.
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
            wrapMode: WrapMode.Ellipsis,
            ...properties
        };

        super(new Label(text, filterIDFromProperties(properties)), properties);
    }
}
