import { BaseLabel } from './BaseLabel';

import type { LabelProperties } from './BaseLabel';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * A widget which displays a line of text.
 *
 * Can be updated, but this is done manually via the {@link Label#text}
 * accessor.
 *
 * @category Widget
 */
export class Label extends BaseLabel {
    static override autoXML: WidgetAutoXML = {
        name: 'label',
        inputConfig: [
            {
                mode: 'text',
                name: 'text',
                optional: true
            }
        ]
    };

    /**
     * @param text - The text of the label. Has the same behaviour as setting {@link Label#text}.
     */
    constructor(text = '', properties?: Readonly<LabelProperties>) {
        super(properties);

        this.text = text;
    }

    /** The current text value. */
    set text(text: string) {
        this.textHelper.text = text;
    }

    get text(): string {
        return this.textHelper.text;
    }
}
