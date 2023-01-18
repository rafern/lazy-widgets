import { CompoundClickHelper } from "./CompoundClickHelper";
import { GenericClickHelper } from "./GenericClickHelper";
import { PointerEvent } from "../events/PointerEvent";
import { PointerWheel } from "../events/PointerWheel";
import { KeyRelease } from "../events/KeyRelease";
import type { Widget } from "../widgets/Widget";
import { KeyEvent } from "../events/KeyEvent";
import { KeyPress } from "../events/KeyPress";
import { FocusType } from "../core/FocusType";
import type { Event } from "../events/Event";
import { ClickHelper } from "./ClickHelper";
import { ClickState } from "./ClickState";
import type { Root } from "../core/Root";
import { Leave } from "../events/Leave";
import type { Bounds } from "./Bounds";

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

    constructor(widget: Widget) {
        const pointerClickHelper = new ClickHelper(widget);
        const keyboardClickHelper = new GenericClickHelper(widget);
        super([pointerClickHelper, keyboardClickHelper])

        this.pointerClickHelper = pointerClickHelper;
        this.keyboardClickHelper = keyboardClickHelper;
        this.widget = widget;
    }

    /**
     * Handle focus grabbing from {@link Widget#onFocusGrabbed}. If keyboard
     * focus is gained, then the button is hovered via the
     * {@link ButtonClickHelper#keyboardClickHelper} click helper
     *
     * @param focusType - The focus type from {@link Widget#onFocusGrabbed}
     * @returns Returns true if the focus type was the keyboard focus (and therefore the button probably needs to be re-painted)
     */
    onFocusGrabbed(focusType: FocusType): boolean {
        if(focusType === FocusType.Keyboard) {
            this.keyboardClickHelper.setClickState(ClickState.Hover, true);
            this.widget.autoScroll();
            return true;
        }

        return false;
    }

    /**
     * Handle focus dropping from {@link Widget#onFocusDropped}. If keyboard
     * focus is dropped, then the button is released via the
     * {@link ButtonClickHelper#keyboardClickHelper} click helper
     *
     * @param focusType - The focus type from {@link Widget#onFocusDropped}
     * @returns Returns true if the focus type was the keyboard focus (and therefore the button probably needs to be re-painted)
     */
    onFocusDropped(focusType: FocusType): boolean {
        if(focusType === FocusType.Keyboard) {
            this.keyboardClickHelper.setClickState(ClickState.Released, false);
            return true;
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
    handleEvent(event: Event, root: Root, enabled: boolean, bounds: Bounds): [wasClick: boolean, capture: boolean] {
        if(event instanceof PointerWheel) {
            // Ignore wheel events
            return [false, false];
        }
        else if(event instanceof KeyEvent) {
            // Discard non-enter key events

            // don't capture non-enter presses so that tab selection works
            if(event.key !== 'Enter')
                return [false, false];
        }
        else if(!(event instanceof PointerEvent || event instanceof Leave)) {
            // Discard unhandled events
            return [false, false];
        }

        // Abort if not enabled, but still absorb events
        if(!enabled) {
            this.pointerClickHelper.clickStateChanged = false;
            this.keyboardClickHelper.clickStateChanged = false;
            return [false, true];
        }

        // Update button state
        if(event instanceof KeyPress) {
            this.pointerClickHelper.clickStateChanged = false;
            this.keyboardClickHelper.setClickState(ClickState.Hold, true);
            this.widget.autoScroll();
        }
        else if(event instanceof KeyRelease) {
            this.pointerClickHelper.clickStateChanged = false;
            this.keyboardClickHelper.setClickState(ClickState.Hover, true);
        }
        else {
            this.keyboardClickHelper.clickStateChanged = false;
            this.pointerClickHelper.handleClickEvent(event, root, bounds);
        }

        // Check if button was pressed and call callback if so
        return [
            this.clickStateChanged && this.wasClick,
            true
        ];
    }
}