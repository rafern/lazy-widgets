import { KeyboardDriver } from './KeyboardDriver';
import { FocusType } from '../core/FocusType';
import { Msg } from '../core/Strings';

/**
 * The set of keys that will call preventDefault if captured.
 *
 * @category Driver
 */
const PREVENT_DEFAULT_KEYS = new Set([
    'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home',
    'PageDown', 'PageUp', 'Tab', ' ',
]);

/**
 * The set of keys that will call preventDefault when holding ctrl if captured.
 *
 * @category Driver
 */
const PREVENT_DEFAULT_CTRL_KEYS = new Set([
    'a', 'A',
]);

/**
 * The set of keys that will call preventDefault, even if not captured.
 *
 * @category Driver
 */
const PREVENT_DEFAULT_FORCE_KEYS = new Set([
    'Tab'
]);

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
 * A container which has all the event listeners for a {@link Root} DOM bind to
 * a {@link DOMKeyboardDriver}; a link between a DOM element and an existing
 * Root.
 *
 * @category Driver
 */
export interface DOMKeyboardDriverBind {
    blurListen: ((this: HTMLElement, event: FocusEvent) => void) | null,
    keydownListen: ((this: HTMLElement, event: KeyboardEvent) => void) | null,
    keyupListen: ((this: HTMLElement, event: KeyboardEvent) => void) | null
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
export class DOMKeyboardDriver extends KeyboardDriver {
    /**
     * The list of HTML DOM elements bound to this keyboard driver and their
     * event listeners
     */
    private domElems: Map<HTMLElement, DOMKeyboardDriverBind> = new Map();

    /** Calls preventDefault on a keyboard event if needed. */
    maybePreventDefault(event: KeyboardEvent): void {
        if(PREVENT_DEFAULT_KEYS.has(event.key) || (PREVENT_DEFAULT_CTRL_KEYS.has(event.key) && event.ctrlKey)) {
            if(PREVENT_DEFAULT_FORCE_KEYS.has(event.key))
                event.preventDefault();
            else {
                const currentFocus = this.getFocusedRoot()?.getFocus(FocusType.Keyboard) ?? null;
                if(currentFocus !== null)
                    event.preventDefault();
            }
        }
    }

    /**
     * Bind an HTML DOM element to this keyboard driver.
     *
     * If the root was already bound,
     * {@link DOMKeyboardDriver#removeListeners} is called, replacing the old
     * listeners. Populates {@link DOMKeyboardDriver#domElems} with the new
     * bind.
     *
     * @param listenToKeys - If true, event listeners will be added to listen for keys. blur event listeners are always added no matter what.
     */
    bindDOMElem(domElem: HTMLElement, listenToKeys = true): void {
        let bind = this.domElems.get(domElem);
        if(bind !== undefined) {
            console.warn(Msg.DOM_DRIVER_REBIND);
            this.removeListeners(domElem, bind);
        }
        else {
            bind = <DOMKeyboardDriverBind>{
                blurListen: null,
                keydownListen: null,
                keyupListen: null
            };
            this.domElems.set(domElem, bind);
        }

        this.addListeners(domElem, bind, listenToKeys);
    }

    /**
     * Unbind an HTML DOM element from this keyboard driver. Removes all used
     * listeners.
     */
    unbindDOMElem(domElem: HTMLElement): void {
        const bind = this.domElems.get(domElem);
        if(bind === undefined)
            return;

        this.removeListeners(domElem, bind);
        this.domElems.delete(domElem);
    }

    /** Add pointer event listeners to DOM element. */
    private addListeners(domElem: HTMLElement, bind: DOMKeyboardDriverBind, listenToKeys = true): void {
        // Listen for keyboard events, filling event queue, and blur event for
        // clearing keyboard focus
        bind.blurListen = (event) => {
            // XXX should the HTMLElement cast be done?
            if(this.shouldClearFocus(event.relatedTarget as HTMLElement))
                this.clearFocus();
        };

        domElem.addEventListener('blur', bind.blurListen);

        if(listenToKeys) {
            bind.keydownListen = (event) => {
                this.maybePreventDefault(event);
                this.keyDown(...unpackKeyboardEvent(event));
            };

            bind.keyupListen = (event) => {
                this.maybePreventDefault(event);
                this.keyUp(...unpackKeyboardEvent(event));
            };

            domElem.addEventListener('keydown', bind.keydownListen);
            domElem.addEventListener('keyup', bind.keyupListen);
        }
    }

    /**
     * Remove event listeners from DOM element and unset tracked listeners in
     * bind.
     */
    private removeListeners(domElem: HTMLElement, bind: DOMKeyboardDriverBind): void {
        if(bind.blurListen) {
            domElem.removeEventListener('blur', bind.blurListen);
            bind.blurListen = null;
        }

        if(bind.keydownListen) {
            domElem.removeEventListener('keydown', bind.keydownListen);
            bind.keydownListen = null;
        }

        if(bind.keyupListen) {
            domElem.removeEventListener('keyup', bind.keyupListen);
            bind.keyupListen = null;
        }
    }

    /**
     * Check if the {@link KeyboardDriver#focus | root focus} should be cleared
     * given that the HTML DOM focus has been lost to another HTML DOM element
     *
     * @param newTarget - The HTML DOM element to which the focus has been lost to
     */
    shouldClearFocus(newTarget: HTMLElement | null): boolean {
        return newTarget === null || !this.domElems.has(newTarget);
    }
}
