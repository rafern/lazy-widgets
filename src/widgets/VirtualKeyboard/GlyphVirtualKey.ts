import { VirtualKey } from './VirtualKey.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
import type { WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
/**
 * A {@link VirtualKey} which emits key presses for a given glyph (character),
 * handling alternative versions of the glyph when shift is held down, such as
 * uppercase variants, or exclamation marks for ones.
 *
 * For other specific keys, see {@link BasicVirtualKey}.
 *
 * @category Widget
 */
export class GlyphVirtualKey extends VirtualKey {
    static override autoXML: WidgetAutoXML = {
        name: 'glyph-virtual-key',
        inputConfig: [
            {
                mode: 'text',
                name: 'glyph'
            },
            {
                name: 'alt-glyph',
                mode: 'value',
                validator: 'nullable:string',
            },
            {
                name: 'key-context',
                mode: 'value',
                validator: 'key-context',
            },
        ]
    };

    readonly glyph: string;
    readonly altGlyph: string;
    readonly keyContext: Readonly<KeyContext>;

    /**
     * @param glyph - The glyph to emit/show when shift is not held.
     * @param altGlyph - The alternative glyph to emit/show when shift is held. Will be equal to glyph if set to null.
     * @param keyContext - The {@link KeyContext} shared by other keys to tell when shift is being held in a virtual keyboard.
     */
    constructor(glyph: string, altGlyph: string | null, keyContext: Readonly<KeyContext>, properties?: Readonly<WidgetProperties>) {
        super(
            '', () => keyContext.callback(this.currentGlyph), properties,
        );

        this.glyph = glyph;
        this.altGlyph = altGlyph === null ? glyph : altGlyph;
        this.keyContext = keyContext;
        this.child.text = this.currentGlyph;
    }

    override handlePreLayoutUpdate(): void {
        this.child.text = this.currentGlyph;

        super.handlePreLayoutUpdate();
    }

    get currentGlyph() {
        if(this.keyContext.shift) {
            return this.altGlyph;
        } else {
            return this.glyph;
        }
    }
}
