import { CompoundClickHelper } from "./CompoundClickHelper.js";
import { GenericClickHelper } from "./GenericClickHelper.js";
import { PointerEvent } from "../events/PointerEvent.js";
import { PointerWheelEvent } from "../events/PointerWheelEvent.js";
import { KeyReleaseEvent } from "../events/KeyReleaseEvent.js";
import { KeyEvent } from "../events/KeyEvent.js";
import { KeyPressEvent } from "../events/KeyPressEvent.js";
import { FocusType } from "../core/FocusType.js";
import { ClickHelper } from "./ClickHelper.js";
import { ClickState } from "./ClickState.js";
import { LeaveEvent } from "../events/LeaveEvent.js";
import { PointerMoveEvent } from "../events/PointerMoveEvent.js";
import type { Widget } from "../widgets/Widget.js";
import type { TricklingEvent } from "../events/TricklingEvent.js";
import type { Root } from "../core/Root.js";
import type { Bounds } from "./Bounds.js";
/**
 * A {@link CompoundClickHelper} specialised for {@link Button}-like widgets.
 * Handles pointer clicks and enter key-presses if the widget has a keyboard
 * focus.
 *
 * {@link GenericClickHelper} methods are still available, however, calls to the
 * new methods provided by this class are preferrable; mostly they implement
 * {@link Widget} methods.
 *
 * @category Helper
 */
export class ButtonClickHelper extends CompoundClickHelper {
    /** The helper for handling pointer clicks */
    protected pointerClickHelper: ClickHelper;
    /** The helper for handling enter key presses */
    protected keyboardClickHelper: GenericClickHelper;
    /** The widget that will be auto-scrolled when keyboard focused */
    private widget: Widget;
    private pointerFocused = false;

    constructor(widget: Widget) {
        const pointerClickHelper = new ClickHelper(widget);
        const keyboardClickHelper = new GenericClickHelper(widget);
        super([pointerClickHelper, keyboardClickHelper])

        this.pointerClickHelper = pointerClickHelper;
        this.keyboardClickHelper = keyboardClickHelper;
        this.widget = widget;
    }

    /**
     * Handle focus grabbing from a {@link FocusEvent}. If keyboard focus is
     * gained, then the button is hovered via the
     * {@link ButtonClickHelper#keyboardClickHelper} click helper
     *
     * @param focusType - The focus type from the {@link FocusEvent}
     * @returns Returns true if the focus type was the keyboard focus (and therefore the button probably needs to be re-painted)
     */
    onFocusGrabbed(focusType: FocusType): boolean {
        if (focusType === FocusType.Keyboard) {
            this.keyboardClickHelper.setClickState(ClickState.Hover, true);
            this.widget.autoScroll();
            return true;
        } else if (focusType === FocusType.Pointer) {
            this.pointerFocused = true;
        }

        return false;
    }

    /**
     * Handle focus dropping from a {@link BlurEvent}. If keyboard focus is
     * dropped, then the button is released via the
     * {@link ButtonClickHelper#keyboardClickHelper} click helper
     *
     * @param focusType - The focus type from the {@link BlurEvent}
     * @returns Returns true if the focus type was the keyboard focus (and therefore the button probably needs to be re-painted)
     */
    onFocusDropped(focusType: FocusType): boolean {
        if (focusType === FocusType.Keyboard) {
            this.keyboardClickHelper.setClickState(ClickState.Released, false);
            return true;
        } else if (focusType === FocusType.Pointer) {
            this.pointerFocused = false;
        }

        return false;
    }

    /**
     * Handle event from {@link Widget#handleEvent}. Does most of the button
     * logic.
     *
     * @param event - The event from {@link Widget#handleEvent}
     * @param root - The root from {@link Widget#handleEvent}
     * @param enabled - Is the button being clicked enabled? If not, then the click state will remain unchanged, but the event will be captured
     * @param bounds - The bounding box to be used for detecting pointer clicks
     * @returns Returns a 2-tuple containing, respective, whether a click occurred, and whether the event should be captured
     */
    handleEvent(event: TricklingEvent, root: Root, enabled: boolean, bounds: Bounds): [wasClick: boolean, capture: boolean] {
        let shouldCapture = true;
        if (event instanceof KeyEvent) {
            // Discard non-enter key events

            // don't capture non-enter presses so that tab selection works
            if (event.key !== 'Enter') {
                return [false, false];
            }
        } else if (event.isa(PointerWheelEvent) || event.isa(PointerMoveEvent)) {
            shouldCapture = this.pointerFocused;
        } else if (!(event.isa(LeaveEvent) || event instanceof PointerEvent)) {
            // Discard unhandled events
            return [false, false];
        }

        // Abort if not enabled, but still absorb events
        if(!enabled) {
            return [false, shouldCapture];
        }

        // Update button state
        const clickStateAlreadyChanged = this.clickStateChanged;
        if(event.isa(KeyPressEvent)) {
            this.keyboardClickHelper.setClickState(ClickState.Hold, true);
            this.widget.autoScroll();
        } else if(event.isa(KeyReleaseEvent)) {
            this.keyboardClickHelper.setClickState(ClickState.Hover, true);
        } else {
            this.pointerClickHelper.handleClickEvent(event, root, bounds);
        }

        // Check if button was pressed and call callback if so
        return [
            !clickStateAlreadyChanged && this.clickStateChanged && this.wasClick,
            shouldCapture
        ];
    }
}
