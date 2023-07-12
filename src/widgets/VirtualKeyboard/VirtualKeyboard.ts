import { KeyboardDriver } from '../../drivers/KeyboardDriver.js';
import { FlexAlignment } from '../../theme/FlexAlignment.js';
import { Alignment } from '../../theme/Alignment.js';
import { VirtualKeyRow } from './VirtualKeyRow.js';
import { Column } from '../Column.js';
import { LeaveEvent } from '../../events/LeaveEvent.js';
import { PointerPressEvent } from '../../events/PointerPressEvent.js';
import { PointerReleaseEvent } from '../../events/PointerReleaseEvent.js';
import { PointerMoveEvent } from '../../events/PointerMoveEvent.js';
import { defaultVirtualKeyboardTemplate, VirtualKeyboardTemplate } from '../../core/VirtualKeyboardTemplate.js';
import { filterIDFromProperties } from '../../helpers/filterIDFromProperties.js';
import type { FlexAlignment2D } from '../../theme/FlexAlignment2D.js';
import type { Widget, WidgetProperties } from '../Widget.js';
import type { KeyContext } from '../../core/KeyContext.js';
import type { WidgetEvent } from '../../events/WidgetEvent.js';
import type { WidgetAutoXML } from '../../xml/WidgetAutoXML.js';
/**
 * A virtual keyboard widget.
 *
 * Needs a {@link KeyboardDriver} so that key events can be queued.
 *
 * Equivalent to creating a {@link Column} of {@link VirtualKeyRow} with a shared
 * {@link KeyContext}. Key rows will be created with SpaceBetween main alignment
 * and Stretch cross alignment.
 *
 * Ignores all events except pointer events, so that the virtual keyboard never
 * gets the keyboard or tab focus.
 *
 * @category Widget
 */
export class VirtualKeyboard extends Column {
    static override autoXML: WidgetAutoXML = {
        name: 'virtual-keyboard',
        inputConfig: [
            {
                name: 'keyboard-driver',
                mode: 'value',
                validator: 'keyboard-driver',
            },
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
        ]
    };

    /**
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

        super([], properties);

        // Make context
        const keyContext = <KeyContext>{
            callback: (key: string) => {
                keyboardDriver.keyPress(
                    key,
                    keyContext.shift,
                    keyContext.ctrl,
                    keyContext.alt,
                    true,
                );
            },
            shift: false,
            ctrl: false,
            alt: false,
        };

        const propertiesNoID = filterIDFromProperties(properties);
        for(const rowTemplate of keyboardTemplate) {
            this.add(new VirtualKeyRow(
                rowTemplate, keyContext, minWidth, minHeight,
                propertiesNoID,
            ));
        }
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        // Ignore all non-pointer events
        if (event.type === PointerPressEvent.type || event.type === PointerReleaseEvent.type || event.type === PointerMoveEvent.type || event.type === LeaveEvent.type) {
            return super.handleEvent(event);
        } else {
            return null;
        }
    }
}
