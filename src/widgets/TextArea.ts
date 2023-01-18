import { ScrollableViewportWidget, ScrollableViewportWidgetProperties, ScrollbarMode } from "./ScrollableViewportWidget";
import type { ValidatedVariable } from "../state/ValidatedVariable";
import { TextInput, TextInputProperties } from "./TextInput";
import { AxisCoupling } from "../widgets/AxisCoupling";

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
 * @category Aggregate Widget
 */
export class TextArea extends ScrollableViewportWidget<TextInput> {
    constructor(variable: ValidatedVariable<string, unknown>, properties?: Readonly<ScrollableViewportWidgetProperties & TextInputProperties>) {
        // default properties
        properties = {
            widthCoupling: AxisCoupling.Uni,
            heightCoupling: AxisCoupling.Uni,
            scrollbarMode: ScrollbarMode.Hidden,
            typeableTab: true,
            ...properties
        };

        super(new TextInput(variable, properties), properties)
    }

    /**
     * Get the {@link TextInput} of this TextArea. Equivalent to
     * {@link TextArea#child}.
     */
    get textInput() {
        return this.child;
    }
}