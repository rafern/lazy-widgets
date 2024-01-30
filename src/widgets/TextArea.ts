import { ScrollableViewportWidget, ScrollableViewportWidgetProperties, ScrollbarMode } from './ScrollableViewportWidget.js';
import { TextInput, TextInputProperties } from './TextInput.js';
import { AxisCoupling } from '../core/AxisCoupling.js';
import { filterIDFromProperties } from '../helpers/filterIDFromProperties.js';
import { type WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { type Box } from '../state/Box.js';
import { type ValidatedBox } from '../state/ValidatedBox.js';

/**
 * A {@link ScrollableViewportWidget} with a {@link TextInput}. Meant to be used
 * as an analogue to the HTML textarea. Allows tab typing by default.
 *
 * Using uni-directional coupling with
 * {@link ScrollbarMode.Hidden | hidden scrollbars} (the default) is
 * recommended. However, if the scrollbars need to be visible, then
 * {@link ScrollbarMode.Layout | layout scrollbars} are recommended since
 * {@link ScrollbarMode.Overlay | overlay scrollbars} will hide text near the
 * borders.
 *
 * @category Widget
 */
export class TextArea extends ScrollableViewportWidget<TextInput> {
    static override autoXML: WidgetAutoXML = {
        name: 'text-area',
        inputConfig: [
            {
                mode: 'value',
                name: 'variable',
                validator: 'box',
                optional: true,
            }
        ]
    };

    constructor(variable?: ValidatedBox<string, unknown> | Box<string>, properties?: Readonly<ScrollableViewportWidgetProperties & TextInputProperties>) {
        // default properties
        properties = {
            widthCoupling: AxisCoupling.Uni,
            heightCoupling: AxisCoupling.Uni,
            scrollbarMode: ScrollbarMode.Hidden,
            typeableTab: true,
            ...properties
        };

        super(new TextInput(variable, filterIDFromProperties(properties)), properties)
    }

    /**
     * Get the {@link TextInput} of this TextArea. Equivalent to
     * {@link TextArea#child}.
     */
    get textInput() {
        return this.child;
    }
}
