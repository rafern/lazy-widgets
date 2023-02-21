import { GlyphVirtualKey } from './GlyphVirtualKey';
import type { WidgetProperties } from '../Widget';
import type { KeyContext } from '../../core/KeyContext';
import type { VirtualKey } from './VirtualKey';
import { DynMsg } from '../../core/Strings';
import { Row } from '../Row';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML';
import type { VirtualKeyRowTemplate } from '../../core/VirtualKeyboardTemplate';

/**
 * A {@link Row} of {@link VirtualKey | virtual keys}. Generates given a
 * template.
 *
 * @category Widget
 */
export class VirtualKeyRow extends Row<VirtualKey> {
    static override autoXML: WidgetAutoXML = [
        {
            name: 'row-template',
            mode: 'value',
            validator: 'array',
        },
        {
            name: 'key-context',
            mode: 'value',
            validator: 'key-context',
        },
        {
            name: 'min-width',
            mode: 'value',
            validator: 'number',
            optional: true,
        },
        {
            name: 'min-height',
            mode: 'value',
            validator: 'number',
            optional: true,
        }
    ];

    /**
     * @param rowTemplate - Template for this row of virtual keys.
     * @param keyContext - The {@link KeyContext} to be shared among all virtual keys in this row.
     * @param minWidth - The minWidth to use when creating {@link GlyphVirtualKey | GlyphVirtualKeys}.
     * @param minHeight - The minHeight to use when creating {@link GlyphVirtualKey | GlyphVirtualKeys}.
     */
    constructor(rowTemplate: VirtualKeyRowTemplate, keyContext: KeyContext, minWidth = 24, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        super([], properties);

        for(const entry of rowTemplate) {
            if(typeof entry === 'function') {
                // Entry is in template function format
                const templateFunction = entry;
                this.add(templateFunction(keyContext, properties));
            } else if(typeof entry[0] === 'string' && typeof entry[1] === 'string') {
                // Entry is in multiple glyphs format
                const glyphs = entry[0];
                const altGlyphs = entry[1];
                for(let i = 0; i < glyphs.length; i++) {
                    let altGlyph = null;
                    if(i < altGlyphs.length) {
                        altGlyph = altGlyphs[i];
                    }

                    this.add(new GlyphVirtualKey(
                        glyphs[i],
                        altGlyph,
                        keyContext,
                        minWidth,
                        minHeight,
                        properties,
                    ));
                }
            } else {
                throw new Error(DynMsg.INVALID_KB_ROW_TEMPLATE(entry));
            }
        }
    }
}
