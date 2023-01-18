import { getPointerEventNormPos } from '../helpers/getPointerEventNormPos';
import { parseDOMDeltaMode } from '../events/PointerWheel';
import { PointerDriver } from './PointerDriver';
import type { Root } from '../core/Root';
import { Msg } from '../core/Strings';

/**
 * A container which has all the event listeners for a {@link Root} DOM bind to
 * a {@link DOMPointerDriver}; a link between a DOM element and an existing
 * Root.
 *
 * @category Driver
 */
export interface DOMPointerDriverBind {
    domElem: HTMLElement,
    pointerListen: ((this: HTMLElement, event: PointerEvent) => void) | null,
    pointerleaveListen: ((this: HTMLElement, event: PointerEvent) => void) | null,
    wheelListen: ((this: HTMLElement, event: WheelEvent) => void) | null,
    contextMenuListen: ((this: HTMLElement, event: MouseEvent) => void) | null
}

/**
 * Unpack a MouseEvent into a 3-tuple containing the event's modifier key state.
 * The 3-tuple contains, respectively, whether shift is being held, whether ctrl
 * is being held, and whether alt is being held.
 *
 * @category Driver
 */
function unpackModifiers(event: MouseEvent): [shift: boolean, ctrl: boolean, alt: boolean] {
    return [event.shiftKey, event.ctrlKey, event.altKey];
}

/**
 * A {@link PointerDriver} which listens for pointer events from HTML DOM
 * elements. Each HTML DOM element is bound to a specific root, which synergizes
 * well with DOMRoot.
 *
 * @category Driver
 */
export class DOMPointerDriver extends PointerDriver {
    /** The HTML DOM element and listeners that each root is bound to */
    private domElems: WeakMap<Root, DOMPointerDriverBind> = new WeakMap();
    /** The mapping between each DOM pointer ID and canvas-ui pointer ID */
    private pointers: Map<number, number> = new Map();
    /**
     * The pointer ID of the mouse. Registered in constructor. This is needed
     * due to wheel events not being part of the DOM PointerEvent interface and
     * therefore not having a pointerID field. This is also safe because there
     * can only be one mouse.
     */
    private mousePointerID: number;

    /**
     * Create a new DOMPointerDriver.
     *
     * Automatically registers a pointer to be used by the mouse.
     */
    constructor() {
        super();

        this.mousePointerID = this.registerPointer(false);
    }

    /**
     * Bind an HTML DOM element to a specific root.
     *
     * If the root was already bound,
     * {@link DOMPointerDriver#removeListeners} is called, replacing the old
     * listeners. Populates {@link DOMPointerDriver#domElems} with the new bind.
     * Calls {@link DOMPointerDriver#addListeners} if root is enabled.
     */
    bindDOMElem(root: Root, domElem: HTMLElement): void {
        let rootBind = this.domElems.get(root);
        if(rootBind !== undefined) {
            console.warn(Msg.DOM_DRIVER_REBIND);
            this.removeListeners(rootBind);
        }
        else {
            rootBind = <DOMPointerDriverBind>{
                domElem,
                pointerListen: null,
                pointerleaveListen: null,
                wheelListen: null,
                contextMenuListen: null,
            };
            this.domElems.set(root, rootBind);
            domElem.style.touchAction = 'none';
        }

        if(root.enabled)
            this.addListeners(root, rootBind);
    }

    /**
     * Unbind a HTML DOM element from this pointer driver that is bound to a
     * given Root. Removes all used listeners.
     */
    unbindDOMElem(root: Root): void {
        const rootBind = this.domElems.get(root);
        if(rootBind === undefined)
            return;

        this.removeListeners(rootBind);
        this.domElems.delete(root);
    }

    /**
     * Get the canvas-ui pointer ID of a given event. If the event has a pointer
     * which hasn't been registered yet, then it is registered automatically
     */
    private getPointerID(event: PointerEvent): number {
        let pointerID = this.pointers.get(event.pointerId);

        if(pointerID === undefined) {
            const isMouse = event.pointerType === 'mouse';
            if(isMouse)
                pointerID = this.mousePointerID;
            else
                pointerID = this.registerPointer(true);

            this.pointers.set(event.pointerId, pointerID);
        }

        return pointerID;
    }

    /** Add pointer event listeners to root's DOM element. */
    private addListeners(root: Root, rootBind: DOMPointerDriverBind): void {
        // Make listeners for mouse events, queueing events. Add them to the
        // root DOM bind so they can be removed later when needed
        const domElem = rootBind.domElem;
        if(rootBind.pointerListen === null) {
            rootBind.pointerListen = (event: PointerEvent) => {
                this.movePointer(
                    root, this.getPointerID(event),
                    ...getPointerEventNormPos(event, domElem),
                    event.buttons,
                    ...unpackModifiers(event),
                );
            }

            domElem.addEventListener('pointermove', rootBind.pointerListen);
            domElem.addEventListener('pointerdown', rootBind.pointerListen);
            domElem.addEventListener('pointerup', rootBind.pointerListen);
        }

        if(rootBind.pointerleaveListen === null) {
            rootBind.pointerleaveListen = (event: PointerEvent) => {
                this.leavePointer(root, this.getPointerID(event));
            }

            domElem.addEventListener('pointerleave', rootBind.pointerleaveListen);
        }

        if(rootBind.wheelListen === null) {
            rootBind.wheelListen = (event: WheelEvent) => {
                const deltaMode = parseDOMDeltaMode(event.deltaMode);
                if(deltaMode === null)
                    return;

                this.wheelPointer(
                    root, this.mousePointerID,
                    ...getPointerEventNormPos(event, domElem),
                    event.deltaX, event.deltaY, event.deltaZ, deltaMode,
                    ...unpackModifiers(event),
                );

                event.preventDefault();
            }

            domElem.addEventListener('wheel', rootBind.wheelListen, { passive: false });
        }

        if(rootBind.contextMenuListen === null) {
            rootBind.contextMenuListen = (event: MouseEvent) => {
                // Prevent right-click from opening context menu
                event.preventDefault();
            }

            domElem.addEventListener('contextmenu', rootBind.contextMenuListen);
        }
    }

    /**
     * Remove pointer event listeners from root's DOM element and unset tracked
     * listeners in root's bind.
     */
    private removeListeners(rootBind: DOMPointerDriverBind): void {
        if(rootBind.pointerListen !== null) {
            rootBind.domElem.removeEventListener('pointermove', rootBind.pointerListen);
            rootBind.domElem.removeEventListener('pointerdown', rootBind.pointerListen);
            rootBind.domElem.removeEventListener('pointerup', rootBind.pointerListen);
            rootBind.pointerListen = null;
        }
        if(rootBind.pointerleaveListen !== null) {
            rootBind.domElem.removeEventListener('pointerleave', rootBind.pointerleaveListen);
            rootBind.pointerleaveListen = null;
        }
        if(rootBind.wheelListen !== null) {
            rootBind.domElem.removeEventListener('wheel', rootBind.wheelListen);
            rootBind.wheelListen = null;
        }
        if(rootBind.contextMenuListen !== null) {
            rootBind.domElem.removeEventListener('contextmenu', rootBind.contextMenuListen);
            rootBind.contextMenuListen = null;
        }
    }

    /**
     * Calls {@link PointerDriver#onEnable} and
     * {@link DOMPointerDriver#addListeners} to each bound root.
     */
    override onEnable(root: Root): void {
        super.onEnable(root);

        // Add event listeners for pointer when root is enabled, if the root is
        // bound to a DOM element
        const rootBind = this.domElems.get(root);
        if(rootBind !== undefined)
            this.addListeners(root, rootBind);
    }

    /**
     * Calls {@link PointerDriver#onDisable} and
     * {@link DOMPointerDriver#removeListeners} to each bound root.
     */
    override onDisable(root: Root): void {
        super.onDisable(root);

        // Remove event listeners for pointer when root is disabled, if the root
        // is bound to a DOM element
        const rootBind = this.domElems.get(root);
        if(rootBind !== undefined)
            this.removeListeners(rootBind);
    }
}