import { KeyRelease } from '../events/KeyRelease';
import type { Widget } from '../widgets/Widget';
import { KeyPress } from '../events/KeyPress';
import { FocusType } from '../core/FocusType';
import type { Driver } from '../core/Driver';
import type { Root } from '../core/Root';
import type { CaptureList } from '../core/CaptureList';

/**
 * A generic keyboard {@link Driver | driver}.
 *
 * Does nothing on its own, but provides an API for sending keyboard events to
 * registered roots.
 *
 * @category Driver
 */
export class KeyboardDriver implements Driver {
    /**
     * This list of {@link Root | Roots} that are using this driver. Used as a
     * fallback for dispatching events. Order of Roots will change; the last
     * focused (with any focus type) Root is moved to the beginning of the list.
     */
    private registeredRoots = new Array<Root>();
    /** A set containing the keys currently down. */
    private keysDown: Set<string> = new Set();
    /** The currently focused root. New keyboard events will go to this root */
    private focus: Root | null = null;

    /**
     * Changes the current {@link KeyboardDriver#focus | root focus}.
     *
     * If there was a previous root focus, that root's {@link Root#clearFocus}
     * is called with {@link FocusType#Keyboard}.
     *
     * {@link KeyboardDriver#keysDown} is cleared.
     */
    protected changeFocusedRoot(root: Root | null): void {
        if(this.focus === root) {
            return;
        }

        if(this.focus !== null) {
            this.focus.clearFocus(FocusType.Keyboard);
        }

        this.focus = root;
        this.keysDown.clear();
    }

    /**
     * Get the current {@link KeyboardDriver#focus | root focus}.
     *
     * @returns Returns {@link KeyboardDriver#focus}
     */
    getFocusedRoot(): Root | null {
        return this.focus;
    }

    /**
     * Similar to {@link KeyboardDriver#getFocusedRoot}, but can fall back to
     * the first root of {@link KeyboardDriver#registeredRoots} if
     * {@link KeyboardDriver#focus} is null.
     */
    getEffectiveFocusedRoot(): Root | null {
        if(this.focus) {
            return this.focus;
        } else if(this.registeredRoots.length > 0) {
            return this.registeredRoots[0];
        } else {
            return null;
        }
    }

    /**
     * Clear the current {@link KeyboardDriver#focus | root focus}. Calls
     * {@link KeyboardDriver#changeFocusedRoot} with null.
     */
    clearFocus(): void {
        this.changeFocusedRoot(null);
    }

    /**
     * Dispatch a new {@link KeyPress} event to the
     * {@link KeyboardDriver#getEffectiveFocusedRoot | effective focused Root}.
     *
     * @param key - Must follow the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | KeyboardEvent.key} Web API.
     * @param shift - Is shift being pressed?
     * @param ctrl - Is control being pressed?
     * @param alt - Is alt being pressed?
     * @returns Returns a list of dispatched events and whether they were captured.
     */
    keyDown(key: string, shift: boolean, ctrl: boolean, alt: boolean): CaptureList {
        this.keysDown.add(key);
        const root = this.getEffectiveFocusedRoot();
        if(root) {
            return root.dispatchEvent(new KeyPress(key, shift, ctrl, alt, null));
        }

        return [];
    }

    /**
     * Dispatch a new {@link KeyRelease} event to the
     * {@link KeyboardDriver#getEffectiveFocusedRoot | effective focused Root}.
     *
     * @param key - Must follow the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | KeyboardEvent.key} Web API.
     * @param shift - Is shift being pressed?
     * @param ctrl - Is control being pressed?
     * @param alt - Is alt being pressed?
     * @returns Returns a list of dispatched events and whether they were captured.
     */
    keyUp(key: string, shift: boolean, ctrl: boolean, alt: boolean): CaptureList {
        if(this.keysDown.delete(key)) {
            const root = this.getEffectiveFocusedRoot();
            if(root) {
                return root.dispatchEvent(new KeyRelease(key, shift, ctrl, alt, null));
            }
        }

        return [];
    }

    /**
     * Calls {@link KeyboardDriver#keyDown} followed by
     * {@link KeyboardDriver#keyUp}. If the key was already down before calling
     * ({@link KeyboardDriver#isKeyDown}), keyUp is not called.
     *
     * @param key - Must follow the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | KeyboardEvent.key} Web API.
     * @param shift - Is shift being pressed?
     * @param ctrl - Is control being pressed?
     * @param alt - Is alt being pressed?
     * @returns Returns a list of dispatched events and whether they were captured.
     */
    keyPress(key: string, shift: boolean, ctrl: boolean, alt: boolean): CaptureList {
        const wasDown = this.isKeyDown(key);
        const captured = this.keyDown(key, shift, ctrl, alt);
        if(!wasDown) {
            captured.push(...this.keyUp(key, shift, ctrl, alt));
        }

        return captured;
    }

    /**
     * Check if a key is pressed.
     *
     * @param key - Must follow the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values | KeyboardEvent.key} Web API.
     *
     * @returns Returns true if key was in {@link KeyboardDriver#keysDown}
     */
    isKeyDown(key: string): boolean {
        return this.keysDown.has(key);
    }

    /**
     * Adds enabled root to {@link KeyboardDriver#registeredRoots}.
     */
    onEnable(root: Root): void {
        if(this.registeredRoots.indexOf(root) >= 0) {
            console.warn('KeyboardDriver was already registered to the Root, but "onEnable" was called');
        } else {
            this.registeredRoots.push(root);
        }
    }

    /**
     * Removes disabled root from {@link KeyboardDriver#registeredRoots}. If the
     * root was the {@link KeyboardDriver#focus}, then
     * {@link KeyboardDriver#clearFocus | the focus is cleared }.
     */
    onDisable(root: Root): void {
        const index = this.registeredRoots.indexOf(root);
        if(index < 0) {
            console.warn('KeyboardDriver was not registered to the Root, but "onDisable" was called');
        } else {
            this.registeredRoots.splice(index, 1);
            if(root === this.focus) {
                this.clearFocus();
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    update(_root: Root): void {}

    /**
     * Does nothing if the new focus type is not a {@link FocusType.Keyboard}.
     * If the focus comes from a root which is not the
     * {@link KeyboardDriver#focus | root focus}, then the root focus is
     * {@link KeyboardDriver#changeFocusedRoot | changed to the new root}. If
     * there is no new focused widget (the root's keyboard focus was cleared),
     * then nothing happens.
     *
     * If a {@link Root} becomes focused (with any focus type, not just keyboard
     * focus), it is moved to the beginning of the
     * {@link KeyboardDriver#registeredRoots} list.
     *
     * This behaviour is confusing, however, it's required so that the keyboard
     * focus "lingers" for future tab key presses; this way, pressing tab can do
     * tab selection even when there is no widget that wants keyboard input.
     * When a focus is lingering, then it means that key events are still being
     * dispatched to the last focused root, but they don't have a target. This
     * way, most events get dropped, but tab key events are used for tab
     * selection.
     */
    onFocusChanged(root: Root, focusType: FocusType, newFocus: Widget | null): void {
        if(newFocus !== null) {
            const oldIndex = this.registeredRoots.indexOf(root);

            if (oldIndex < 0) {
                console.warn("Focus changed to Root which doesn't have this KeyboardDriver attached");
            } else if (oldIndex > 0) {
                this.registeredRoots.splice(oldIndex, 1);
                this.registeredRoots.unshift(root);
            }
        }

        if(focusType === FocusType.Keyboard && root !== this.focus && newFocus !== null) {
            this.changeFocusedRoot(root);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onFocusCapturerChanged(_root: Root, _focusType: FocusType, _oldCapturer: Widget | null, _newCapturer: Widget | null): void {}

    /**
     * Check if the currently focused root needs keyboard input. Virtual
     * keyboard should query this property to know when to show themselves.
     */
    get needsInput(): boolean {
        return this.focus !== null && this.focus.getFocus(FocusType.Keyboard) !== null;
    }
}
