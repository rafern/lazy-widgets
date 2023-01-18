import type { PointerStyleHandler } from './PointerStyleHandler';
import type { LayoutConstraints } from './LayoutConstraints';
import type { TextInputHandler } from './TextInputHandler';
import { DynMsg, groupedStackTrace } from './Strings';
import { PointerEvent } from '../events/PointerEvent';
import { PointerWheel } from '../events/PointerWheel';
import { CanvasViewport } from './CanvasViewport';
import type { Widget } from '../widgets/Widget';
import { TabSelect } from '../events/TabSelect';
import { KeyPress } from '../events/KeyPress';
import type { Event } from '../events/Event';
import { FocusType } from './FocusType';
import { Leave } from '../events/Leave';
import type { Driver } from './Driver';
import { Theme } from '../theme/Theme';

/**
 * Optional Root constructor properties.
 *
 * @category Core
 */
export interface RootProperties {
    /** Sets {@link Root#pointerStyleHandler}. */
    pointerStyleHandler?: PointerStyleHandler | null;
    /** Sets {@link Root#child}'s {@link Widget#inheritedTheme}. */
    theme?: Theme;
    /** Sets {@link Root#resolution}. */
    resolution?: number;
    /** Sets {@link Root#preventBleeding}. */
    preventBleeding?: boolean;
    /** The starting width of the {@link Root#viewport}'s canvas. */
    canvasStartingWidth?: number;
    /** The starting height of the {@link Root#viewport}'s canvas. */
    canvasStartingHeight?: number;
    /** The starting layout constraints of the Root. */
    constraints?: LayoutConstraints;
}

/**
 * A Root is the parent of all widgets, but not a widget itself. It contains a
 * single child and manages dimensions and input handling
 *
 * @category Core
 */
export class Root {
    /** The internal viewport. Manages drawing */
    protected viewport: CanvasViewport;
    /** The list of drivers registered to this root */
    protected drivers: Set<Driver> = new Set();
    /**
     * Is the Root enabled? For internal use only.
     *
     * See {@link Root#enabled}
     */
    protected _enabled = true;
    /**
     * The pointer style this root wants. Will be set on
     * {@link Root#postLayoutUpdate} by {@link Root#pointerStyleHandler}
     */
    pointerStyle = 'default';
    /**
     * The actual current pointer style.
     *
     * For internal use only.
     *
     * See {@link Root#pointerStyle}
     */
    protected _currentPointerStyle = 'default';
    /**
     * Pointer style handler, decides how to show the given pointer style.
     * Normally a function which sets the CSS cursor style of the Root's canvas
     */
    pointerStyleHandler: PointerStyleHandler | null;
    /**
     * Current component foci (event targets for each focus type).
     *
     * For internal use only.
     *
     * See {@link Root#requestFocus}, {@link Root#dropFocus},
     * {@link Root#clearFocus} and {@link Root#getFocus}
     */
    protected _foci: Map<FocusType, Widget | null> = new Map([
        [FocusType.Keyboard, null],
        [FocusType.Pointer, null],
        [FocusType.Tab, null],
    ]);
    /**
     * Last capturer of each component focus (event targets for each focus
     * type).
     *
     * For internal use only.
     *
     * See {@link Root#getFocusCapturer}
     */
    protected _fociCapturers: Map<FocusType, Widget | null> = new Map([
        [FocusType.Keyboard, null],
        [FocusType.Pointer, null],
        [FocusType.Tab, null],
    ]);
    /**
     * Handler for mobile-friendly text input. If not null, widgets that need
     * text may call this to get a string.
     *
     * See {@link Root#hasMobileTextInput}, {@link Root#usingMobileTextInput}
     * and {@link Root#getTextInput}
     */
    textInputHandler: TextInputHandler | null = null;
    /**
     * Is the mobile-friendly text input in use?
     *
     * For internal use only.
     *
     * See {@link Root#hasMobileTextInput}, {@link Root#usingMobileTextInput}
     * and {@link Root#getTextInput}
     */
    protected _mobileTextInUse = false;
    /** Has the warning for poorly captured TabSelect events been issued? */
    private static badTabCaptureWarned = false;

    /**
     * Creates a new Root.
     *
     * Sets {@link Root#child}, {@link Root#pointerStyleHandler} and
     * {@link Root#child}'s {@link Widget#inheritedTheme | inherited theme}.
     */
    constructor(child: Widget, properties?: Readonly<RootProperties>) {
        this.viewport = new CanvasViewport(child, properties?.resolution, properties?.preventBleeding, properties?.canvasStartingWidth, properties?.canvasStartingHeight);
        this.pointerStyleHandler = properties?.pointerStyleHandler ?? null;
        this.child.inheritedTheme = properties?.theme ?? new Theme();
        this.child.attach(this, this.viewport, null);

        if(properties?.constraints)
            this.viewport.constraints = properties.constraints;
    }

    /** The {@link Root#viewport}'s {@link Viewport#constraints | constraints} */
    get constraints(): LayoutConstraints {
        return this.viewport.constraints;
    }

    set constraints(constraints: LayoutConstraints) {
        this.viewport.constraints = constraints;
    }

    /**
     * The {@link Root#viewport}'s
     * {@link CanvasViewport#canvasDimensions | canvasDimensions}
     */
    get canvasDimensions(): [number, number] {
        return this.viewport.canvasDimensions;
    }

    /**
     * The {@link Root#child}'s {@link Widget#dimensions | dimensions}
     */
    get dimensions(): [number, number] {
        return this.child.dimensions;
    }

    /**
     * Is this root enabled? If not enabled, painting, updating or resolving
     * layout will do nothing. {@link Root#drivers | Drivers} will also be
     * notified by calling {@link Driver#onEnable} or {@link Driver#onDisable},
     * pointer style will be reset ({@link Root#updatePointerStyle} called with
     * 'default') and all {@link Root#_foci | foci} will be cleared
     * ({@link Root#clearFocus}).
     *
     * See {@link Root#_enabled}
     */
    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(newEnabled: boolean) {
        const oldEnabled = this._enabled;

        if(oldEnabled !== newEnabled) {
            this._enabled = newEnabled;

            // Call driver hooks, reset pointer style and release foci if UI
            // disabled
            if(newEnabled) {
                for(const driver of this.drivers)
                    driver.onEnable(this);
            }
            else {
                for(const driver of this.drivers)
                    driver.onDisable(this);

                this.updatePointerStyle('default');

                for(const focus of this._foci.keys())
                    this.clearFocus(focus);
            }

            // Update active state of child widget. This will propagate to
            // grandchildren, etc...
            this.child.updateActiveState();
        }
    }


    /**
     * The {@link Root#viewport}'s {@link CanvasViewport#canvas | canvas}
     */
    get canvas(): HTMLCanvasElement {
        return this.viewport.canvas;
    }

    /**
     * Resolve the layout of this root. Does nothing if root is disabled.
     *
     * Calls {@link Root#viewport}'s {@link Viewport#resolveLayout} with
     * {@link Root#child}
     *
     * Call this before calling {@link Root#postLayoutUpdate} and after calling
     * {@link Root#preLayoutUpdate}
     *
     * @returns Returns true if the viewport was resized or re-scaled
     */
    resolveLayout(): boolean {
        // Don't do anything if Root is disabled
        if(!this.enabled)
            return false;

        return this.viewport.resolveLayout();
    }

    /**
     * Paint this root's next frame if needed. Does nothing if root is disabled.
     *
     * Calls {@link Root#viewport}'s {@link Viewport#paint} with
     * {@link Root#child}.
     *
     * Call this after calling {@link Root#postLayoutUpdate}.
     *
     * @returns Returns whether the child was dirty or not. Use this to tell an external 3D library whether to update a mesh's texture or not.
     */
    paint(): boolean {
        // Don't do anything if Root is disabled
        if(!this.enabled)
            return false;

        return this.viewport.paintToInternal(false);
    }

    /**
     * Dispatches an {@link Event} to this root's {@link Root#child} by calling
     * {@link Widget#dispatchEvent}. Updates
     * {@link Root#_fociCapturers | foci capturers} and notifies
     * {@link Root#drivers} by calling {@link Driver#onFocusCapturerChanged} if
     * the capturer changes. Does nothing if root is disabled.
     *
     * Note that if an event with a focus is dispatched and no widget captures
     * the event due to the widget not existing anymore or being disabled, the
     * focus type of the event will be cleared in the root with
     * {@link Root#clearFocus}.
     *
     * @returns Returns true if the event was captured
     */
    dispatchEvent(event: Event): boolean {
        // Ignore event if Root is disabled
        if(!this.enabled)
            return false;

        // If event is focusable and is missing a target...
        if(event.focusType !== null && event.target === null) {
            // Ignore event if it needs a focus but there is no component
            // focused in the needed focus
            let focus = this._foci.get(event.focusType);
            if(typeof focus === 'undefined')
                focus = null;

            if(event.needsFocus && focus === null) {
                // special case for tab key with no currently focused widget;
                // try to do tab selection
                if(event instanceof KeyPress && event.key === 'Tab')
                    this.dispatchEvent(new TabSelect(this.getFocus(FocusType.Tab), event.shift));

                return false;
            }

            // Set event target
            event = event.cloneWithTarget(focus);
        }

        // Clear pointer style. This will be set by children if neccessary
        if((event instanceof PointerEvent && !(event instanceof PointerWheel)) || event instanceof Leave)
            this.pointerStyle = 'default';

        // Pass event down to internal Container
        let captured = this.child.dispatchEvent(event);
        if(captured === null) {
            if(event instanceof KeyPress) {
                if(event.key === 'Tab') {
                    // special case for tab key; try to do tab selection
                    this.dispatchEvent(new TabSelect(this.getFocus(FocusType.Tab), event.shift));
                }
                else if(event.key === 'Escape') {
                    // special case for escape key; clear keyboard focus
                    this.clearFocus(FocusType.Keyboard);
                }
            }

            // If this was a tab selection relative to a widget, but the widget
            // was not found, try again but with no relative widget. This
            // happens when a removed widget still has tab focus
            if(event instanceof TabSelect && event.relativeTo !== null) {
                event = new TabSelect(null, event.reversed);
                captured = this.child.dispatchEvent(event);
            }
        }

        if(event instanceof TabSelect) {
            if(event.reachedRelative && captured === null) {
                // If the tab selection failed even though the relative widget
                // was reached, then the end of the search was likely reached.
                // Try to start from the beginning again
                captured = this.child.dispatchEvent(event);
            }

            if(captured) {
                if(!event.reachedRelative && !Root.badTabCaptureWarned) {
                    Root.badTabCaptureWarned = true;
                    console.warn(DynMsg.OVERCAPTURING_WIDGET(captured));
                    groupedStackTrace();
                }

                // Request tab focus if tab select event was captured
                this.requestFocus(FocusType.Tab, captured);
            }
        }

        // Update focus capturer if it changed
        if(event.focusType === null)
            return captured !== null;

        const oldCapturer = this.getFocusCapturer(event.focusType);
        if(oldCapturer === captured)
            return captured !== null;

        // Special case: when the pointer focus capturer changes, dispatch a
        // leave event to the last capturer
        if(event.focusType === FocusType.Pointer && oldCapturer !== null)
            this.child.dispatchEvent(new Leave(oldCapturer));

        this._fociCapturers.set(event.focusType, captured);
        for(const driver of this.drivers)
            driver.onFocusCapturerChanged(this, event.focusType, oldCapturer, captured);

        return captured !== null;
    }

    /**
     * Do a pre-layout update; calls {@link Root#drivers}' {@link Driver#update}
     * and {@link Root#child}'s {@link Widget#preLayoutUpdate}. Does nothing if
     * root is disabled.
     *
     * Call this before calling {@link Root#resolveLayout}
     */
    preLayoutUpdate(): void {
        // Skip if UI is disabled
        if(!this.enabled)
            return;

        // Update drivers
        for(const driver of this.drivers)
            driver.update(this);

        // Pre-layout update child
        this.child.preLayoutUpdate();
    }


    /**
     * Do a post-layout update; calls {@link Root#child}'s
     * {@link Widget#postLayoutUpdate} and {@link Root#updatePointerStyle}. Does
     * nothing if root is disabled.
     *
     * Call this before calling {@link Root#paint} and after calling
     * {@link Root#resolveLayout}
     */
    postLayoutUpdate(): void {
        // Skip if UI is disabled
        if(!this.enabled)
            return;

        // Post-layout update child
        this.child.postLayoutUpdate();

        // Update pointer style
        this.updatePointerStyle();
    }

    /**
     * Calls {@link Root#pointerStyleHandler} if the {@link Root#pointerStyle}
     * has changed (checked by comparing with
     * {@link Root#_currentPointerStyle}). Also updates
     * {@link Root#_currentPointerStyle}. Can also be optionally supplied a new
     * pointer style.
     */
    updatePointerStyle(newStyle: string | null = null): void {
        if(newStyle !== null)
            this.pointerStyle = newStyle;

        if(this.pointerStyle !== this._currentPointerStyle) {
            this._currentPointerStyle = this.pointerStyle;
            if(this.pointerStyleHandler !== null)
                this.pointerStyleHandler(this._currentPointerStyle);
        }
    }

    /**
     * Sets the current {@link Root#_foci | focus} of a given type to a given
     * widget. If the focus changes, {@link Root#clearFocus} is called and
     * {@link Root#drivers} are notified by calling
     * {@link Driver#onFocusChanged}.
     */
    requestFocus(focusType: FocusType, widget: Widget): void {
        if(widget !== null) {
            // Replace focus if current focus is not the desired one
            const currentFocus = this._foci.get(focusType);
            if(widget !== currentFocus) {
                this.clearFocus(focusType);
                this._foci.set(focusType, widget);
                widget.onFocusGrabbed(focusType);
                for(const driver of this.drivers)
                    driver.onFocusChanged(this, focusType, widget);
            }

            // special cases for keyboard and tab foci, since they are
            // usually together. a focus that is implied by another focus is
            // called a partner focus
            let partnerFocus = null;
            if(focusType === FocusType.Keyboard)
                partnerFocus = FocusType.Tab;
            if(focusType === FocusType.Tab)
                partnerFocus = FocusType.Keyboard;

            if(partnerFocus !== null && widget !== this._foci.get(partnerFocus)) {
                this.clearFocus(partnerFocus);
                this._foci.set(partnerFocus, widget);
                widget.onFocusGrabbed(partnerFocus);
                for(const driver of this.drivers)
                    driver.onFocusChanged(this, partnerFocus, widget);
            }
        }
    }

    /**
     * Clears the current {@link Root#_foci | focus} of a given type if it is
     * currently set to a given widget. Achieved by calling
     * {@link Root#clearFocus}.
     */
    dropFocus(focusType: FocusType, widget: Widget): void {
        // NOTE: Use this instead of clearFocus if your intent is to make sure a
        // SPECIFIC COMPONENT is no longer focused, NOT ANY COMPONENT
        const currentFocus = this._foci.get(focusType);
        if(widget === currentFocus)
            this.clearFocus(focusType);
    }

    /**
     * Clears all the {@link Root#_foci | foci} that are set to a given Widget.
     * Achieved by calling {@link Root#dropFocus}
     */
    dropFoci(widget: Widget): void {
        for(const focusType of this._foci.keys())
            this.dropFocus(focusType, widget);
    }

    /**
     * Clears the current {@link Root#_foci | focus} of a given type. If there
     * was a focus set, {@link Root#drivers} are notified by calling
     * {@link Driver#onFocusChanged}.
     */
    clearFocus(focusType: FocusType): void {
        const currentFocus = this._foci.get(focusType);
        if(currentFocus) {
            currentFocus.onFocusDropped(focusType);

            this._foci.set(focusType, null);
            for(const driver of this.drivers)
                driver.onFocusChanged(this, focusType, null);

            // XXX no special case for clearing keyboard/tab focus. keyboard
            // implies tab and vice-versa, but lack of keyboard does not imply
            // lack of tab and vice-versa
        }
    }

    /**
     * Gets the current {@link Root#_foci | focus} of a given type.
     */
    getFocus(focusType: FocusType): Widget | null {
        return this._foci.get(focusType) ?? null;
    }

    /**
     * Gets the last {@link Root#_fociCapturers | focus capturer} of a given
     * type.
     */
    getFocusCapturer(focusType: FocusType): Widget | null {
        return this._fociCapturers.get(focusType) ?? null;
    }

    /**
     * Registers a {@link Driver} to the root, adding it to the
     * {@link Root#drivers} list and calling {@link Driver#onEnable}. If the
     * driver was already registered, nothing happens.
     */
    registerDriver(driver: Driver): void {
        // If driver is not registered, register it
        if(this.drivers.has(driver))
            return;

        this.drivers.add(driver);
        if(this._enabled && driver.onEnable)
            driver.onEnable(this);
    }

    /**
     * Unregisters a {@link Driver} from the root, removing it from the
     * {@link Root#drivers} list and calling {@link Driver#onDisable}. If the
     * driver was not registered, nothing happens.
     */
    unregisterDriver(driver: Driver): void {
        // If driver is registered, unregister it
        if(!this.drivers.delete(driver))
            return;

        if(this._enabled && driver.onDisable)
            driver.onDisable(this);
    }

    /**
     * Unregisters all {@link Root#drivers} from the root, by calling
     * {@link Root#unregisterDriver}.
     */
    clearDrivers(): void {
        // Unregister all drivers
        for(const driver of this.drivers)
            this.unregisterDriver(driver);
    }

    /**
     * Can {@link Root#getTextInput} be called? True if
     * {@link Root#textInputHandler} is not null and
     * {@link Root#usingMobileTextInput} is false.
     */
    get hasMobileTextInput(): boolean {
        return this.textInputHandler !== null && !this._mobileTextInUse;
    }

    /**
     * Is {@link Root#getTextInput} in use?
     *
     * See {@link Root#_mobileTextInUse}.
     */
    get usingMobileTextInput(): boolean {
        return this._mobileTextInUse;
    }

    /**
     * Get text input from the user. Used for mobile where keyboard events are
     * hard to get.
     *
     * @returns If this is already in use ({@link Root#usingMobileTextInput}), returns null, else, returns a string typed by the user.
     */
    async getTextInput(initialInput = ''): Promise<string | null> {
        // Only get if text input is currently available
        // XXX even though this if statement is equivalent to
        // hasMobileTextInput, typescript type inference is bad and only works
        // if its done this way, else it thinks that textInputHandler may be
        // null and throws an error when compiling
        if(this.textInputHandler !== null && !this._mobileTextInUse) {
            // Flag text input as in-use
            this._mobileTextInUse = true;

            // Get input from handler
            const newInput = await this.textInputHandler(initialInput);

            // Flag text input as not in-use
            this._mobileTextInUse = false;

            // Return new value
            return newInput;
        }

        return null;
    }

    /**
     * Shortcut for {@link Root#viewport}'s {@link CanvasViewport#resolution}
     * property.
     *
     * Note that, although the resolution is part of the {@link CanvasViewport}
     * API, widgets will treat the resolution property as being per-Root, not
     * per-Viewport (hence the lack of a Viewport.resolution property). The
     * resolution property is part of the CanvasViewport class so that
     * CanvasViewport is not circularly dependent on the Root class.
     */
    get resolution(): number {
        return this.viewport.resolution;
    }

    set resolution(resolution: number) {
        this.viewport.resolution = resolution;
    }

    /**
     * Shortcut for {@link Root#viewport}'s
     * {@link CanvasViewport#preventBleeding} property.
     */
    get preventBleeding(): boolean {
        return this.viewport.preventBleeding;
    }

    set preventBleeding(preventBleeding: boolean) {
        this.viewport.preventBleeding = preventBleeding;
    }

    /**
     * Shortcut for {@link Root#viewport}'s
     * {@link CanvasViewport#maxCanvasWidth} property
     */
    get maxCanvasWidth(): number {
        return this.viewport.maxCanvasWidth;
    }

    set maxCanvasWidth(maxCanvasWidth: number) {
        this.viewport.maxCanvasWidth = maxCanvasWidth;
    }

    /**
     * Shortcut for {@link Root#viewport}'s
     * {@link CanvasViewport#maxCanvasHeight} property
     */
    get maxCanvasHeight(): number {
        return this.viewport.maxCanvasHeight;
    }

    set maxCanvasHeight(maxCanvasHeight: number) {
        this.viewport.maxCanvasHeight = maxCanvasHeight;
    }

    /**
     * Get the scale used for the {@link Root#viewport}. The horizontal and/or
     * vertical scale may not be 1 if {@link Root#maxCanvasWidth} or
     * {@link Root#maxCanvasHeight} are exceeded.
     *
     * Note that this is only valid after resolving {@link Root#child}'s layout.
     *
     * Equivalent to getting {@link Viewport#effectiveScale} on
     * {@link Root#viewport}.
     */
    get effectiveScale(): [scaleX: number, scaleY: number] {
        return this.viewport.effectiveScale;
    }

    /**
     * The root widget of this UI tree. Equivalent to getting
     * {@link Root#viewport}.{@link Viewport#child}.
     */
    get child(): Widget {
        return this.viewport.child;
    }

    /**
     * Destroy this Root. Disables the Root, clears all drivers, detaches the
     * {@link Root#child} Widget and resets {@link Root#textInputHandler}.
     *
     * Root must not be used after calling this method. Doing so will cause
     * exceptions to be thrown. There is no way to un-destroy a destroyed Root.
     *
     * Call this if you are no longer going to use this Root.
     */
    destroy(): void {
        this.enabled = false;
        this.clearDrivers();
        this.child.detach();
        this.textInputHandler = null;
    }
}
