import type { Alignment2D } from '../theme/Alignment2D';
import { TextAlignMode } from '../helpers/TextHelper';
import { Label, LabelProperties } from './Label';
import { Alignment } from '../theme/Alignment';
import { FilledButton } from './FilledButton';

/**
 * A {@link FilledButton} with a {@link Label}. Alignment is forced to be
 * horizontally centered and vertically stretching like in {@link TextMargin}.
 * Text-wrapping is disabled so that text is centered properly.
 *
 * @category Widget
 * @category Aggregate Widget
 */
export class TextButton extends FilledButton<Label> {
    /** Create a new TextButton. */
    constructor(text: string, callback: (() => void) | null = null, properties?: Readonly<LabelProperties>) {
        // default properties
        properties = {
            containerAlignment: <Alignment2D>{
                horizontal: Alignment.Center, vertical: Alignment.Stretch,
            },
            bodyTextAlign: TextAlignMode.Center,
            wrapText: false,
            ...properties
        };

        super(new Label(text, properties), callback, properties);
    }
}
