import { KeyRelease } from '../events/KeyRelease';
import type { Widget } from '../widgets/Widget';
import { KeyPress } from '../events/KeyPress';
import { FocusType } from '../core/FocusType';
import type { Driver } from '../core/Driver';
import type { Root } from '../core/Root';
import type { CaptureList } from '../core/CaptureList';
import { KeyEvent } from '../events/KeyEvent';
import { TabSelect } from '../events/TabSelect';

/**
 * A group of Roots. When a {@link TabSelect} is not captured by a {@link Root}
 * in a group, the TabSelect is carried over to the next (or previous, depending
 * on the direction) root in the group. Although TabSelect events are carried
 * over between Roots in the same group, they are **not** automatically carried
 * over **between different groups**.
 *
 * This behaviour is useful for binding Roots to DOM elements. For example,
 * {@link DOMRoot | DOMRoots} should be placed in groups with a single DOMRoot,
 * since the DOMRoot owns its own DOM element, but Roots used for an external 3D
 * engine, where the roots share a single DOM element such as a canvas used as
 * the output for rendering, should all be in the same group.
 *
 * @category Driver
 */
export interface KeyboardDriverGroup {
    /**
     * The list of {@link Root | Roots} assigned to this group, in the order
     * they were added to this group. Not to be confused with
     * {@link KeyboardDriverGroup#accessList}.
     */
    roots: Array<Root>;
    /**
     * Similar to {@link KeyboardDriverGroup#roots}, but only contains enabled
     * {@link Root | Roots}.
     */
    enabledRoots: Array<Root>;
    /**
     * Should {@link TabSelect} events wrap-around to the other end of the group
     * if not captured by the last (or first) {@link Root}? If this is true, the
     * navigation will be trapped to this group for keyboard-only users, since
     * that will be the only way to change keyboard focus. Useful for 3D engines
     * where all Roots share the same canvas.
     */
    wrapsAround: boolean;
}

export interface KeyboardDriverGroupOptions {
    /** See {@link KeyboardDriverGroup#wrapsAround}. */
    wrapsAround: boolean;
}

/**
 * A generic keyboard {@link Driver | driver}.
 *
 * Does nothing on its own, but provides an API for sending keyboard events to
 * registered roots.
 *
 * @category Driver
 */
export class KeyboardDriver<G extends KeyboardDriverGroup = KeyboardDriverGroup, O extends KeyboardDriverGroupOptions = KeyboardDriverGroupOptions> implements Driver {
    protected readonly groups = new Array<G>();
    protected readonly groupMap = new Map<Root, G>();
    /**
     * The list of {@link Root | Roots} that are using this driver, in the order
     * of access; the last focused (with any focus type) Root is moved to the
     * beginning of the list.
     *
     * Used as a fallback for {@link KeyboardDriver#focus}.
     */
    private accessList = new Array<Root>();
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
     * the first root of {@link KeyboardDriver#accessList} if
     * {@link KeyboardDriver#focus} is null.
     */
    getEffectiveFocusedRoot(): Root | null {
        if(this.focus) {
            return this.focus;
        } else if(this.accessList.length > 0) {
            return this.accessList[0];
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
        return this.dispatchEvent(new KeyPress(key, shift, ctrl, alt, null));
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
            return this.dispatchEvent(new KeyRelease(key, shift, ctrl, alt, null));
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
     * Adds enabled root to {@link KeyboardDriver#accessList} and its respective
     * group.
     */
    onEnable(root: Root): void {
        if(this.accessList.indexOf(root) >= 0) {
            console.warn('KeyboardDriver was already registered to the Root, but "onEnable" was called');
        } else {
            // add to enabled roots list in group
            const group = this.getGroup(root);

            // XXX `enabledRoots` is a subset of `roots` with the same order.
            // this efficiently inserts an element into the subset, while
            // keeping the same order as the superset
            const roots = group.roots;
            const rootsIndex = roots.indexOf(root);
            if (rootsIndex < 0) {
                throw new Error("Root is mapped to a group, but not in the group's Root list; this is a bug, please report it");
            }

            // TODO verify this algorithm. i made it up and i can only test this
            // once the wle integration is updated, so it's probably broken
            let lastFound = -1;
            let inserted = false;
            const enabledRoots = group.enabledRoots;
            const enabledRootCount = enabledRoots.length;
            for (let i = 0; i < enabledRootCount; i++) {
                // get index of this subset root in the superset
                const otherRoot = enabledRoots[i];
                if (otherRoot === root) {
                    throw new Error('Root is already in enabledRoots set; this is a bug, please report it');
                }

                lastFound = roots.indexOf(otherRoot, lastFound + 1);

                // if the superset index is after the inserted root's superset
                // index, insert in-place
                if (rootsIndex < lastFound) {
                    enabledRoots.splice(i, 0, root);
                    inserted = true;
                    break;
                }
            }

            // no insertion spot found, meaning that the inserted root needs to
            // be placed after all the enabled roots. push to the end
            if (!inserted) {
                enabledRoots.push(root);
            }

            // add to access list
            this.accessList.push(root);
        }
    }

    /**
     * Removes disabled root from {@link KeyboardDriver#accessList} and its
     * respective group. If the root was the {@link KeyboardDriver#focus}, then
     * {@link KeyboardDriver#clearFocus | the focus is cleared }.
     */
    onDisable(root: Root): void {
        const index = this.accessList.indexOf(root);
        if(index < 0) {
            console.warn('KeyboardDriver was not registered to the Root, but "onDisable" was called');
        } else {
            // remove from enabled roots list in group
            const group = this.getGroup(root);
            const index = group.enabledRoots.indexOf(root);
            if (index < 0) {
                throw new Error("Root not found in group's enabled root list; this is a bug, please report it");
            }

            group.enabledRoots.splice(index, 1);

            // remove from access list
            this.accessList.splice(index, 1);

            // clear focus if needed
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
     * {@link KeyboardDriver#accessList} list.
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
            const oldIndex = this.accessList.indexOf(root);

            if (oldIndex < 0) {
                console.warn("Focus changed to Root which doesn't have this KeyboardDriver attached");
            } else if (oldIndex > 0) {
                this.accessList.splice(oldIndex, 1);
                this.accessList.unshift(root);
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

    private dispatchEvent(event: KeyEvent) {
        const root = this.getEffectiveFocusedRoot();
        if(root) {
            const captureList = root.dispatchEvent(event);
            const group = this.getGroup(root);
            const rootCount = group.enabledRoots.length;

            // check if there was any uncaptured TabSelect event and carry it
            // over to another root in the same group
            if (rootCount > 1 || (group.wrapsAround && rootCount > 0)) {
                const capListLen = captureList.length;
                for (let i = 0; i < capListLen; i++) {
                    const [cEvent, captured] = captureList[i];

                    if (!captured && cEvent instanceof TabSelect) {
                        let iNext = i + (cEvent.reversed ? -1 : 1);
                        if (iNext < 0 || iNext >= rootCount) {
                            if (group.wrapsAround) {
                                iNext = (iNext + rootCount) % rootCount;
                            } else {
                                break;
                            }
                        }

                        const nextRoot = group.enabledRoots[iNext];
                        captureList.splice(i, 1);
                        captureList.push(...nextRoot.dispatchEvent(new TabSelect(null, cEvent.reversed)));

                        break;
                    }
                }
            }

            return captureList;
        }

        return [];
    }

    getGroupIndex(group: G): number {
        const index = this.groups.indexOf(group);
        if (index < 0) {
            throw new Error('Group does not exist; maybe it belongs to another KeyboardDriver?');
        }

        return index;
    }

    getGroup(root: Root): G {
        const group = this.groupMap.get(root);
        if (!group) {
            throw new Error('Root is not assigned to any group in KeyboardDriver');
        }

        return group;
    }

    createGroup(options: O): G {
        const group = <G>{
            roots: new Array<Root>(),
            enabledRoots: new Array<Root>(),
            wrapsAround: !!options.wrapsAround,
        };

        this.groups.push(group);

        return group;
    }

    deleteGroup(group: G): void {
        // find group index
        const index = this.getGroupIndex(group);

        // assert that the group is not in use
        for (const oGroup of this.groupMap.values()) {
            if (group === oGroup) {
                throw new Error("Can't delete group; group is still in use");
            }
        }

        // remove group
        this.groups.splice(index, 1);
    }

    bindRoot(root: Root, group: G): void {
        // assert the root is not already bound in this driver
        if (this.groupMap.has(root)) {
            throw new Error('Root is already bound');
        }

        // assert group belongs to this driver
        this.getGroupIndex(group);

        // add root to group
        group.roots.push(root);
        this.groupMap.set(root, group);
    }

    unbindGroup(root: Root): void {
        // remove root from group
        const group = this.getGroup(root);
        this.groupMap.delete(root);
        const index = group.roots.indexOf(root);

        if (index < 0) {
            throw new Error('Root not found in group; this is a bug, please report it');
        }

        group.roots.splice(index, 1);
    }

    bindSingletRoot(root: Root, options: O): G {
        const group = this.createGroup(options);

        try {
            this.bindRoot(root, group);
        } catch(err) {
            this.deleteGroup(group);
            throw err;
        }

        return group;
    }
}
