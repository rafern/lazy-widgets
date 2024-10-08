import { BackspaceKey } from '../widgets/VirtualKeyboard/BackspaceKey.js';
import { EnterKey } from '../widgets/VirtualKeyboard/EnterKey.js';
import { EscapeKey } from '../widgets/VirtualKeyboard/EscapeKey.js';
import { ShiftKey } from '../widgets/VirtualKeyboard/ShiftKey.js';
import { SpaceKey } from '../widgets/VirtualKeyboard/SpaceKey.js';
import { TabKey } from '../widgets/VirtualKeyboard/TabKey.js';
import { VirtualKey } from '../widgets/VirtualKeyboard/VirtualKey.js';
import type { WidgetProperties } from '../widgets/Widget.js';
import type { KeyContext } from './KeyContext.js';
/**
 * A template for a single virtual keyboard key. A function that, when called
 * given a {@link KeyContext} and theme override, returns a {@link VirtualKey}
 * which can be used as a virtual keyboard key widget.
 *
 * Example:
 * ```typescript
 * const template: VirtualKeyTemplate = (keyContext, properties) => new BackspaceKey(keyContext, properties);
 * ```
 *
 * @category Core
 */
export type VirtualKeyTemplate = (keyContext: KeyContext, properties?: Readonly<WidgetProperties>) => VirtualKey;

/**
 * A template for multiple {@link GlyphVirtualKey} virtual keyboard keys. A
 * 2-tuple of strings, where each string has the same length. Each character of
 * the string represents a glyph to add to a keyboard row. The first string of
 * the tuple has the regular glyphs, while the second string string of the tuple
 * has the alternative glyphs.
 *
 * Example:
 * ```typescript
 * const template: GlyphVirtualKeysTemplate = ['qwertyuiop', 'QWERTYUIOP'];
 * ```
 *
 * @category Core
 */
export type GlyphVirtualKeysTemplate = [string, string];

/**
 * A template for a single row of virtual keyboard keys. An array of
 * {@link GlyphVirtualKeysTemplate} and {@link VirtualKeyTemplate}.
 *
 * Example:
 * ```typescript
 * const backspaceTemplate: VirtualKeyTemplate = (keyContext, themeProperties) => new BackspaceKey(keyContext, themeProperties);
 * const rowTemplate: VirtualKeyRowTemplate = [['`1234567890-=', '~!@#$%^&*()_+'], backspaceTemplate];
 * ```
 *
 * @category Core
 */
export type VirtualKeyRowTemplate = Array<GlyphVirtualKeysTemplate | VirtualKeyTemplate>;

/**
 * A template for the keys in a {@link VirtualKeyboard}. Each member of the
 * array contains the template for a row of keys, from top to bottom.
 *
 * @category Core
 */
export type VirtualKeyboardTemplate = Array<VirtualKeyRowTemplate>;

function EnterKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): EnterKey {
    return new EnterKey(
        keyContext, properties,
    );
}

function ShiftKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): ShiftKey {
    return new ShiftKey(
        keyContext, properties,
    );
}

function BackspaceKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): BackspaceKey {
    return new BackspaceKey(
        keyContext, properties,
    );
}

function SpaceKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): SpaceKey {
    return new SpaceKey(
        keyContext, properties,
    );
}

function EscapeKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): EscapeKey {
    return new EscapeKey(
        keyContext, properties,
    );
}

function TabKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): TabKey {
    return new TabKey(
        keyContext, properties,
    );
}

/**
 * The default template for the keys in a {@link VirtualKeyboard}; A QWERTY
 * keyboard with US layout.
 *
 * @category Core
 */
export const defaultVirtualKeyboardTemplate: VirtualKeyboardTemplate = [
    // First row
    [['`1234567890-=', '~!@#$%^&*()_+']],
    // Second row
    [['qwertyuiop[]\\', 'QWERTYUIOP{}|']],
    // Third row
    [['asdfghjkl;\'', 'ASDFGHJKL:"'], EnterKeyTemplate],
    // Fourth row
    [ShiftKeyTemplate, ['zxcvbnm,./', 'ZXCVBNM<>?']],
    // Fifth row
    [BackspaceKeyTemplate, SpaceKeyTemplate, TabKeyTemplate, EscapeKeyTemplate],
];
