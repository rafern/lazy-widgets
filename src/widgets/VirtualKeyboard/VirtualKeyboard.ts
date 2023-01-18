import type { KeyboardDriver } from '../../drivers/KeyboardDriver';
import type { FlexAlignment2D } from '../../theme/FlexAlignment2D';
import type { VirtualKeyRowTemplate } from './VirtualKeyRow';
import { FlexAlignment } from '../../theme/FlexAlignment';
import type { WidgetProperties } from '../Widget';
import { Alignment } from '../../theme/Alignment';
import { VirtualKeyRow } from './VirtualKeyRow';
import type { KeyContext } from './KeyContext';
import { BackspaceKey } from './BackspaceKey';
import { EscapeKey } from './EscapeKey';
import { EnterKey } from './EnterKey';
import { ShiftKey } from './ShiftKey';
import { SpaceKey } from './SpaceKey';
import { Column } from '../Column';

/**
 * A template for the keys in a {@link VirtualKeyboard}. Each member of the
 * array contains the template for a row of keys, from top to bottom.
 *
 * @category Widget
 */
export type VirtualKeyboardTemplate = Array<VirtualKeyRowTemplate>;

function EnterKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): EnterKey {
    return new EnterKey(
        keyContext, undefined, undefined, properties,
    );
}

function ShiftKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): ShiftKey {
    return new ShiftKey(
        keyContext, undefined, undefined, properties,
    );
}

function BackspaceKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): BackspaceKey {
    return new BackspaceKey(
        keyContext, undefined, undefined, properties,
    );
}

function SpaceKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): SpaceKey {
    return new SpaceKey(
        keyContext, undefined, undefined, properties,
    );
}

function EscapeKeyTemplate(keyContext: KeyContext, properties?: Readonly<WidgetProperties>): EscapeKey {
    return new EscapeKey(
        keyContext, undefined, undefined, properties,
    );
}

/**
 * The default template for the keys in a {@link VirtualKeyboard}; A QWERTY
 * keyboard with US layout.
 *
 * @category Widget
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
    [BackspaceKeyTemplate, SpaceKeyTemplate, EscapeKeyTemplate],
];

/**
 * A virtual keyboard widget.
 *
 * Needs a {@link KeyboardDriver} so that key events can be queued.
 *
 * Equivalent to creating a {@link Column} of {@link VirtualKeyRow} with a shared
 * {@link KeyContext}. Key rows will be created with SpaceBetween main alignment
 * and Stretch cross alignment.
 *
 * @category Widget
 * @category Alias Widget
 */
export class VirtualKeyboard extends Column {
    /**
     * Create a new VirtualKeyboard.
     *
     * @param keyboardTemplate - By default, the virtual keyboard template is {@link defaultVirtualKeyboardTemplate}.
     * @param minWidth - The minWidth to use when creating {@link GlyphVirtualKey | GlyphVirtualKeys}.
     * @param minHeight - The minHeight to use when creating {@link GlyphVirtualKey | GlyphVirtualKeys}.
     */
    constructor(keyboardDriver: KeyboardDriver, keyboardTemplate: VirtualKeyboardTemplate = defaultVirtualKeyboardTemplate, minWidth = 24, minHeight = 24, properties?: Readonly<WidgetProperties>) {
        properties = {
            multiContainerAlignment: <FlexAlignment2D>{
                main: FlexAlignment.SpaceBetween, cross: Alignment.Stretch,
            },
            ...properties
        };

        super(properties);

        // Make context
        const keyContext = <KeyContext>{
            callback: (key: string) => {
                keyboardDriver.keyPress(
                    key,
                    keyContext.shift,
                    keyContext.ctrl,
                    keyContext.alt,
                );
            },
            shift: false,
            ctrl: false,
            alt: false,
        };

        for(const rowTemplate of keyboardTemplate) {
            this.add(new VirtualKeyRow(
                rowTemplate, keyContext, minWidth, minHeight,
                properties,
            ));
        }
    }
}
