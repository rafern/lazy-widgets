import { KeyboardDriver } from './KeyboardDriver';
import type { KeyboardDriverGroup, KeyboardDriverGroupOptions } from './KeyboardDriver';
import type { CaptureList } from '../core/CaptureList';
import type { TabKeyHelper } from '../helpers/TabKeyHelper';
import { getTabKeyHelper } from '../helpers/TabKeyHelper';
import { TabSelectEvent } from '../events/TabSelectEvent';

/**
 * Unpack a KeyboardEvent into a 4-tuple containing the event's key and modifier
 * key state. The 4-tuple contains, respectively, the key
 * {@link https://developer.mozilla.org/docs/Web/API/KeyboardEvent/key | KeyboardEvent.key}
 * of the event, whether shift is being held, whether ctrl is being held, and
 * whether alt is being held
 *
 * @category Driver
 */
function unpackKeyboardEvent(event: KeyboardEvent): [key: string, shift: boolean, ctrl: boolean, alt: boolean] {
    return [event.key, event.shiftKey, event.ctrlKey, event.altKey];
}

/**
 * A {@link KeyboardDriverGroup} bound to a DOM element, with extra properties
 * used for cleaning up event listeners.
 *
 * @category Driver
 */
export interface DOMKeyboardDriverGroup extends KeyboardDriverGroup {
    /** The DOM element where the event listeners are added */
    domElem: HTMLElement,
    /** "focus" event listener. For cleanup only */
    focusListen: (event: FocusEvent) => void,
    /** "blue" event listener. For cleanup only */
    blurListen: (event: FocusEvent) => void,
    /** "keydown" event listener. For cleanup only */
    keydownListen: ((event: KeyboardEvent) => void) | null,
    /** "keyup" event listener. For cleanup only */
    keyupListen: ((event: KeyboardEvent) => void) | null,
    /** The original tabIndex of the DOM element. For cleanup only */
    origTabIndex: number,
    /**
     * If true, then the DOM element's tabIndex will be set to 0 if negative, so
     * that it can be selected via tab focus. Defaults to true.
     */
    selectable: boolean,
}

/**
 * Options used for creating a new {@link DOMKeyboardDriverGroup}.
 *
 * @category Driver
 */
export interface DOMKeyboardDriverGroupOptions extends KeyboardDriverGroupOptions {
    /** See {@link DOMKeyboardDriverGroup#domElem}. */
    domElem: HTMLElement;
    /**
     * If true (the default), event listeners will be added to listen for keys.
     * If false, then the group will not listen for key presses, but will still
     * keep the focsu as-is.
     */
    listenToKeys?: boolean;
    /** See {@link DOMKeyboardDriverGroup#selectable}. */
    selectable?: true;
}

/**
 * A {@link KeyboardDriver} which listens for key events from HTML DOM elements.
 *
 * Note that if a DOM element is unfocused in the DOM to an unbound DOM element,
 * the root focus is cleared. If this creates issues, other DOM elements can be
 * bound without listening for key events.
 *
 * @category Driver
 */
export class DOMKeyboardDriver extends KeyboardDriver<DOMKeyboardDriverGroup, DOMKeyboardDriverGroupOptions> {
    private tabKeyHelper: TabKeyHelper;

    constructor() {
        super();

        // Get tab helper. This will be used for checking if tab is pressed in
        // the "focus" event handler
        this.tabKeyHelper = getTabKeyHelper();
    }

    /**
     * Calls preventDefault and stopImmediatePropagation on a keyboard event if
     * needed.
     *
     * @param captureList - List of events that were **maybe** captured by a Root
     * @param event - The keyboard event that can be preventDefault'ed/stopImmediatePropagation'ed
     */
    maybePreventDefault(captureList: CaptureList, event: KeyboardEvent): void {
        let captured = false;

        for (const [_event, eventCaptured] of captureList) {
            if (eventCaptured) {
                captured = true;
                break;
            }
        }

        if(captured) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    /**
     * Check if the {@link KeyboardDriver#focus | root focus} should be cleared
     * given that the HTML DOM focus has been lost to another HTML DOM element
     *
     * @param newTarget - The HTML DOM element to which the focus has been lost to
     */
    shouldClearFocus(newTarget: HTMLElement | null): boolean {
        if (newTarget === null) {
            return true;
        }

        for (const group of this.groups) {
            // XXX even if the group is not selectable, the focus should still
            // not be cleared when a non-selectable group's DOM element is
            // focused, since it can be focused by clicking with the mouse
            if (group.domElem === newTarget) {
                return false;
            }
        }

        return true;
    }

    override createGroup(options: DOMKeyboardDriverGroupOptions): DOMKeyboardDriverGroup {
        // assert that the DOM element isn't already assigned
        const domElem = options.domElem;
        // TODO is this (listenToKeys) still useful? i no longer see a use-case
        // for this. need to investigate
        const listenToKeys = !!(options.listenToKeys ?? true);
        const selectable = !!(options.selectable ?? true);
        if (!domElem || !(domElem instanceof HTMLElement)) {
            throw new Error('DOM element is not valid');
        }

        for (const group of this.groups) {
            if (group.domElem === domElem) {
                throw new Error('DOM element is already assigned to a group');
            }
        }

        // make group
        const group = super.createGroup(options);
        group.domElem = domElem;

        // change tabIndex of DOM element
        group.origTabIndex = domElem.tabIndex;

        if (!selectable) {
            // XXX even if an html element is not focusable by default, tabindex
            // still needs to be set to -1 if it's not meant to be focusable.
            // this is because there are a lot of edge cases where the tabindex
            // is reported as -1 if it's not set, but the element is actually
            // focusable because, for example, contenteditable is true
            domElem.tabIndex = -1;
        } else if (domElem.tabIndex < 0) {
            domElem.tabIndex = 0;
        }

        // add listeners
        group.focusListen = async (focusEvent: FocusEvent) => {
            if (!selectable || group.enabledRoots.length === 0) {
                return;
            }

            // HACK only auto-send tab event if the focus event was caused by
            // pressing tab. there is no api for this, but we can monkey-patch
            // it:
            // 1. check relatedTarget. if null, then focus was caused by calling
            //    the `.focus()` method
            // 2. check if tab key is down. focus direction can be determined by
            //    checking if shift key is down
            // there is also no api for checking if a key is pressed, so we have
            // to use a global key listener in the page.
            // the keyboard state is invalid when focusing the window, so an
            // extra check is also needed for that.
            if ((focusEvent.relatedTarget && this.tabKeyHelper.pressed) || await this.tabKeyHelper.isTabInitiatedFocus()) {
                // BUG if the focus is caused by the window itself getting
                // focus, then it's impossible to tell the direction of the tab
                // since no keydown event is ever dispatched. this means that
                // tabbing into a window/iframe without pressing shift will have
                // the correct behaviour, but SHIFT-tabbing into a window will
                // not:
                // 1. the last root will be selected (correct)
                // 2. shift will be detected as not pressed (incorrect)
                // 3. the first widget will be tabselected instead of the last
                //    (incorrect)
                // a way to work around this bug would be to detect if there are
                // any elements with tabindex BEFORE the domElem, only if this
                // focus is caused by focusing the window, but this won't work
                // if the bound DOM element is the only element in the page with
                // a tabindex, and it's very expensive to query the entire DOM
                // every time the user tabs into a window/iframe

                // XXX must check enabled roots again because
                // isTabInitiatedFocus is async, to avoid data races
                const rootCount = group.enabledRoots.length;
                if (rootCount === 0) {
                    return;
                }

                const directionReversed = this.tabKeyHelper.directionReversed
                const delta = directionReversed ? -1 : 1;
                let i = directionReversed ? (rootCount - 1) : 0;

                for (; i >= 0 && i < rootCount; i += delta) {
                    const captureList = group.enabledRoots[i].dispatchEvent(new TabSelectEvent(null, directionReversed));
                    for (const [event, captured] of captureList) {
                        if (captured && event.isa(TabSelectEvent)) {
                            return;
                        }
                    }
                }
            }
        };

        group.blurListen = (event: FocusEvent) => {
            // XXX should the HTMLElement cast be done?
            if(this.shouldClearFocus(event.relatedTarget as (HTMLElement | null))) {
                this.clearFocus();
            }
        };

        domElem.addEventListener('focus', group.focusListen);
        domElem.addEventListener('blur', group.blurListen);

        if(listenToKeys) {
            group.keydownListen = (event: KeyboardEvent) => {
                this.maybePreventDefault(this.keyDown(...unpackKeyboardEvent(event), false), event);
            };

            group.keyupListen = (event: KeyboardEvent) => {
                this.maybePreventDefault(this.keyUp(...unpackKeyboardEvent(event), false), event);
            };

            domElem.addEventListener('keydown', group.keydownListen);
            domElem.addEventListener('keyup', group.keyupListen);
        } else {
            group.keydownListen = null;
            group.keyupListen = null;
        }

        // reference tab helper if this is the first group
        if (this.groups.length === 1) {
            this.tabKeyHelper.ref(this);
        }

        return group;
    }

    override deleteGroup(group: DOMKeyboardDriverGroup): void {
        // delete group
        super.deleteGroup(group);

        // unreference tab helper if there are no groups anymore
        if (this.groups.length === 0) {
            this.tabKeyHelper.unref(this);
        }

        // clean up tabIndex
        group.domElem.tabIndex = group.origTabIndex;

        // clean up listeners
        group.domElem.removeEventListener('focus', group.focusListen);
        group.domElem.removeEventListener('blur', group.blurListen);

        if(group.keydownListen) {
            group.domElem.removeEventListener('keydown', group.keydownListen);
        }

        if(group.keyupListen) {
            group.domElem.removeEventListener('keyup', group.keyupListen);
        }
    }
}
