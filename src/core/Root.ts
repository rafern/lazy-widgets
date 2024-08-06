import { DynMsg, groupedStackTrace } from './Strings.js';
import { PointerEvent } from '../events/PointerEvent.js';
import { CanvasViewport } from './CanvasViewport.js';
import { TabSelectEvent } from '../events/TabSelectEvent.js';
import { KeyPressEvent } from '../events/KeyPressEvent.js';
import { FocusType } from './FocusType.js';
import { LeaveEvent } from '../events/LeaveEvent.js';
import { Theme } from '../theme/Theme.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { TricklingEvent } from '../events/TricklingEvent.js';
import { eventEmitterHandleEvent, eventEmitterOff, eventEmitterOffAny, eventEmitterOn, eventEmitterOnAny } from '../helpers/WidgetEventEmitter-premade-functions.js';
import { FocusEvent } from '../events/FocusEvent.js';
import { BlurEvent } from '../events/BlurEvent.js';
import { PointerMoveEvent } from '../events/PointerMoveEvent.js';
import type { PointerStyleHandler } from './PointerStyleHandler.js';
import type { LayoutConstraints } from './LayoutConstraints.js';
import { TextInputHandlerEventType, type TextInputHandler, type TextInputHandlerEventData, type TextInputHandlerListener } from './TextInputHandler.js';
import type { Widget } from '../widgets/Widget.js';
import type { Driver } from './Driver.js';
import type { CaptureList } from './CaptureList.js';
import type { WidgetEventEmitter, WidgetEventListener, WidgetEventTypedListenerMap, WidgetEventUntypedListenerList } from '../events/WidgetEventEmitter.js';
import { LeaveRootEvent } from '../events/LeaveRootEvent.js';
import { type Rect } from '../helpers/Rect.js';
/**
 * Allowed cursor styles and in order of priority; lower indices have higher
 * priority
 */
export const ALLOWED_CURSOR_STYLES = [
    'wait',
    'not-allowed',
    'no-drop',
    'copy',
    'alias',
    'move',
    'grabbing',
    'pointer',
    'text',
    'vertical-text',
    'cell',
    'crosshair',
    'col-resize',
    'row-resize',
    'grab',
    'nesw-resize',
    'nwse-resize',
    'ne-resize',
    'nw-resize',
    'se-resize',
    'sw-resize',
    'ew-resize',
    'ns-resize',
    'n-resize',
    'e-resize',
    's-resize',
    'w-resize',
    'progress',
    'context-menu',
    'help',
    'zoom-in',
    'zoom-out',
    'all-scroll',
    'none',
    'default',
    'auto'
];

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
    /**
     * Sets {@link CanvasViewport#preventAtlasBleeding} in the internal viewport
     * ({@link Root#viewport}).
     */
    preventAtlasBleeding?: boolean;
    /** The starting width of the {@link Root#viewport}'s canvas. */
    canvasStartingWidth?: number;
    /** The starting height of the {@link Root#viewport}'s canvas. */
    canvasStartingHeight?: number;
    /** The starting layout constraints of the Root. */
    constraints?: LayoutConstraints;
    /** Sets {@link Root#maxCanvasWidth}. */
    maxCanvasWidth?: number;
    /** Sets {@link Root#maxCanvasHeight}. */
    maxCanvasHeight?: number;
}

/**
 * A Root is the parent of all widgets, but not a widget itself. It contains a
 * single child and manages dimensions and input handling
 *
 * @category Core
 */
export class Root implements WidgetEventEmitter {
    /** Typed user listeners attached to this Root */
    private typedListeners: WidgetEventTypedListenerMap = new Map();
    /** Untyped user listeners attached to this Root */
    private untypedListeners: WidgetEventUntypedListenerList = [];
    /** Next user listener ID */
    private nextListener = 0;
    /** A one-way map from an ID to a descendant Widget. Internal use only. */
    private idMap = new Map<string, Widget>();
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
     * For internal use only. Current value of {@link Root#pointerStyleHandler}.
     */
    protected _pointerStyleHandler: PointerStyleHandler | null = null;
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
     * Text input handler constructor for environments where getting keyboard
     * input is hard, such as mobile and WebXR. If not null, widgets that need
     * text may call this to get strings and cursor positions as text is typed.
     *
     * See {@link Root#getTextInput}
     */
    textInputHandler: (new (listener: TextInputHandlerListener) => TextInputHandler) | null = null;
    /** See {@link Root#currentTextInputHandler}. For internal use only. */
    private _currentTextInputHandler: TextInputHandler | null = null;
    /**
     * Has the warning for poorly captured TabSelectEvent events been issued?
     */
    private static badTabCaptureWarned = false;
    /**
     * The list of widgets that were hovered in the last check. Will be swapped
     * with {@link Root#hoveredWidgets} every time a pointer event is
     * dispatched. For internal use only.
     */
    private lastHoveredWidgets = new Set<Widget>();
    /**
     * The list of widgets that are currently hovered. Will be swapped with
     * {@link Root#lastHoveredWidgets} every time a pointer event is dispatched.
     * For internal use only.
     */
    private hoveredWidgets = new Set<Widget>();
    /**
     * The list of widgets that had a pointer focus but dropped it while
     * processing an event. For internal use only.
     */
    private droppedPointerFoci = new Set<Widget>();
    /**
     * Currently requested pointer styles. The list is ordered, where higher
     * priority pointer styles have a lower index than lower priority pointer
     * styles; the highest priority pointer style is always at index 0. For
     * internal use only.
     */
    private requestedPointerStyles = new Array<string>();
    /**
     * Helper list for {@link requestedPointerStyles} which contains the
     * respective requesters. For internal use only.
     */
    private requestedPointerStyleSources = new Array<unknown>();
    /**
     * Helper list for {@link requestedPointerStyles} which contains the
     * respective requesters' widget. For internal use only.
     */
    private requestedPointerStyleWidgets = new Array<unknown>();
    /**
     * For internal use only. Returns true if the child widget has been detached
     * from the root.
     */
    private hasDetached: () => boolean;

    constructor(child: Widget, properties?: Readonly<RootProperties>) {
        this.hasDetached = () => !this.child.attached;
        this.viewport = Root.makeViewport(child, properties);
        this.pointerStyleHandler = properties?.pointerStyleHandler ?? null;
        this.child.inheritedTheme = properties?.theme ?? new Theme();
        this.child.attach(this, this.viewport, null);

        if (properties?.constraints) {
            this.viewport.constraints = properties.constraints;
        }

        if (properties?.maxCanvasWidth !== undefined) {
            this.viewport.maxCanvasWidth = properties.maxCanvasWidth;
        }

        if (properties?.maxCanvasHeight !== undefined) {
            this.viewport.maxCanvasHeight = properties.maxCanvasHeight;
        }
    }

    /**
     * For internal use only. Sets the pointer style to 'default' if there is a
     * pointer style handler.
     */
    private dropPointerStyleHandler() {
        if (this._pointerStyleHandler) {
            this._pointerStyleHandler('default');
        }
    }

    /**
     * For internal use only. Sets the pointer style to the highest priority
     * requested pointer style if there is a pointer style handler, and if there
     * is a requested pointer style.
     */
    private restorePointerStyleHandler() {
        if (this._pointerStyleHandler !== null) {
            const pointerStyle = this.requestedPointerStyles[0];
            if (pointerStyle !== undefined) {
                this._pointerStyleHandler(pointerStyle);
            }
        }
    }

    /**
     * Pointer style handler, decides how to show the given pointer style.
     * Normally a function which sets the CSS cursor style of the Root's canvas
     */
    get pointerStyleHandler(): PointerStyleHandler | null {
        return this._pointerStyleHandler;
    }

    set pointerStyleHandler(pointerStyleHandler: PointerStyleHandler | null) {
        if (this._pointerStyleHandler === pointerStyleHandler) {
            return;
        }

        this.dropPointerStyleHandler();
        this._pointerStyleHandler = pointerStyleHandler;
        this.restorePointerStyleHandler();
    }

    /**
     * Creates a new CanvasViewport instance for a new Root. Normally it
     * wouldn't make sense to separate this from the constructor, but this makes
     * viewport creation hookable, allowing for the creation of debug overlay
     * viewports.
     *
     * @internal
     * @returns Returns a new CanvasViewport (or child class instance) for the Root
     */
    static makeViewport(child: Widget, properties?: Readonly<RootProperties>): CanvasViewport {
        return new CanvasViewport(child, properties?.resolution, properties?.preventBleeding, properties?.preventAtlasBleeding, properties?.canvasStartingWidth, properties?.canvasStartingHeight);
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
     * pointer style will be reset and all {@link Root#_foci | foci} will be
     * cleared ({@link Root#clearFocus}).
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
                for(const driver of this.drivers) {
                    driver.onEnable(this);
                }

                this.restorePointerStyleHandler();
            } else {
                for(const driver of this.drivers) {
                    driver.onDisable(this);
                }

                this.dropPointerStyleHandler();

                for(const focus of this._foci.keys()) {
                    this.clearFocus(focus);
                }
            }

            // Update active state of child widget. This will propagate to
            // grandchildren, etc...
            this.child.updateActiveState();
        }
    }


    /**
     * The {@link Root#viewport}'s {@link CanvasViewport#canvas | canvas}. The
     * canvas must not be modified directly; consider it output-only.
     */
    get canvas(): HTMLCanvasElement | OffscreenCanvas {
        return this.viewport.canvas;
    }

    /**
     * The text input handler that is currently in use. `null` if none in use.
     *
     * See {@link Root#textInputHandler}.
     */
    get currentTextInputHandler(): TextInputHandler | null {
        return this._currentTextInputHandler;
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
        if(!this.enabled) {
            return false;
        }

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
     * @returns Returns a list of dirty rectangles in the texture's coordinates, or null if the child widget was not repainted. Use this to tell an external 3D library whether to update a mesh's texture or not, and where to update the mesh's texture.
     */
    paint(): null | Array<Rect> {
        // Don't do anything if Root is disabled
        if(!this.enabled) {
            return null;
        }

        return this.viewport.paintToInternal();
    }

    /**
     * Dispatches a {@link WidgetEvent} to this root's {@link Root#child} by
     * calling {@link Widget#dispatchEvent}. Updates
     * {@link Root#_fociCapturers | foci capturers} and notifies
     * {@link Root#drivers} by calling {@link Driver#onFocusCapturerChanged} if
     * the capturer changes. Does nothing if root is disabled.
     *
     * Note that if an event with a focus is dispatched and no widget captures
     * the event due to the widget not existing anymore or being disabled, the
     * focus type of the event will be cleared in the root with
     * {@link Root#clearFocus}.
     *
     * Dispatching a single event can result in a chain of dispatched events.
     * These extra events will be returned.
     *
     * @returns Returns a list of dispatched events and whether they were captured.
     */
    dispatchEvent(baseEvent: WidgetEvent): CaptureList {
        // Ignore event if Root is disabled
        if(!this.enabled) {
            return [[baseEvent, false]];
        }

        // Dispatch to user event listeners
        if (eventEmitterHandleEvent(this, this.typedListeners, this.untypedListeners, baseEvent, this.hasDetached)) {
            return [[baseEvent, true]];
        }

        // Cancel if a user event listener destroyed this root
        if (!this.child.attached) {
            return [[baseEvent, false]];
        }

        // Don't do anything else if event is not a trickling event; can't
        // bubble up because we're at the root already, and can't do anything
        // with a sticky event since that's meant to be handled by users
        // XXX with the exception of leave-root events, see below...
        if (baseEvent.propagation !== PropagationModel.Trickling) {
            const captureList: CaptureList = [[baseEvent, false]];

            // Special case for leave-root event; try to dispatch leave events
            // to all hovered widgets
            if (baseEvent.isa(LeaveRootEvent)) {
                for (const widget of this.lastHoveredWidgets) {
                    const leaveEvent = new LeaveEvent(widget);
                    captureList.push([
                        leaveEvent,
                        this.child.dispatchEvent(leaveEvent) !== null
                    ]);

                    // Cancel if an event listener destroyed this root
                    if (!this.child.attached) {
                        return captureList;
                    }
                }

                this.lastHoveredWidgets.clear();
            }

            return captureList;
        }

        // Event is a trickling event
        let event = baseEvent as TricklingEvent;

        // If event is focusable and is missing a target...
        const originalEvent = event;
        if(event.focusType !== null && event.target === null) {
            // Ignore event if it needs a focus but there is no component
            // focused in the needed focus
            let focus = this._foci.get(event.focusType);
            if(typeof focus === 'undefined') {
                focus = null;
            }

            if(event.needsFocus && focus === null) {
                // special case for tab key with no currently focused widget;
                // try to do tab selection. does not apply to virtual tab
                // presses
                if(event.isa(KeyPressEvent) && !event.virtual && event.key === 'Tab') {
                    return [
                        [event, false],
                        ...this.dispatchEvent(new TabSelectEvent(this.getFocus(FocusType.Tab), event.shift))
                    ];
                } else {
                    return [[event, false]];
                }
            }

            // Set event target
            event = event.cloneWithTarget(focus);
        }

        // Pass event down to internal Container
        let captured = this.child.dispatchEvent(event);
        const captureList: CaptureList = [[originalEvent, captured !== null]];

        // Cancel if an event listener destroyed this root
        if (!this.child.attached) {
            return captureList;
        }

        if(captured === null) {
            if(event.isa(KeyPressEvent)) {
                if(event.key === 'Tab' && !event.virtual) {
                    // special case for tab key; try to do tab selection. does
                    // not apply to virtual tab presses
                    captureList.push(
                        ...this.dispatchEvent(new TabSelectEvent(this.getFocus(FocusType.Tab), event.shift))
                    );

                    // Cancel if an event listener destroyed this root
                    if (!this.child.attached) {
                        return captureList;
                    }
                } else if(event.key === 'Escape') {
                    // special case for escape key; clear keyboard focus
                    this.clearFocus(FocusType.Keyboard);
                }
            }

            // If this was a tab selection relative to a widget, but the widget
            // was not found, try again but with no relative widget. This
            // happens when a removed widget still has tab focus
            if(event.isa(TabSelectEvent) && event.relativeTo !== null) {
                event = new TabSelectEvent(null, event.reversed);
                captured = this.child.dispatchEvent(event);

                // Cancel if an event listener destroyed this root
                if (!this.child.attached) {
                    return captureList;
                }
            }
        }

        if(event.isa(TabSelectEvent)) {
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

        // Special case: when the pointer focus changes, dispatch a leave event
        // to the last capturer
        let pointerFocusDropped = false;
        if(this.droppedPointerFoci.size > 0) {
            for (const droppedFocus of this.droppedPointerFoci) {
                const leaveEvent = new LeaveEvent(droppedFocus);
                captureList.push([
                    leaveEvent,
                    this.child.dispatchEvent(leaveEvent) !== null
                ]);

                // Cancel if an event listener destroyed this root
                if (!this.child.attached) {
                    return captureList;
                }
            }

            this.droppedPointerFoci.clear();
            pointerFocusDropped = true;
        }

        // Check which widgets are no longer hovered, and dispatch leave events
        let oldCapturer: Widget | null | undefined;
        if (event instanceof PointerEvent) {
            // Special case: when the pointer focus is dropped while a pointer
            // event is processed, dispatch a new move event in case the pointer
            // is now hovering a different widget but the new widget doesn't
            // know this
            if (pointerFocusDropped) {
                // XXX typescript is bad with type guards so we have to do an
                //     explicit cast
                const origEvent = event as PointerEvent;
                const moveEvent = new PointerMoveEvent(origEvent.x, origEvent.y, origEvent.shift, origEvent.ctrl, origEvent.alt, null, null);
                captureList.push([
                    moveEvent,
                    this.child.dispatchEvent(moveEvent) !== null
                ]);

                // Cancel if an event listener destroyed this root
                if (!this.child.attached) {
                    return captureList;
                }
            }

            for (const widget of this.lastHoveredWidgets) {
                if (!this.hoveredWidgets.has(widget)) {
                    const leaveEvent = new LeaveEvent(widget);
                    captureList.push([
                        leaveEvent,
                        this.child.dispatchEvent(leaveEvent) !== null
                    ]);

                    // Cancel if an event listener destroyed this root
                    if (!this.child.attached) {
                        return captureList;
                    }
                }
            }

            // swap sets so that:
            // - current hover becomes last hover
            // - we don't have to allocate a new set, preventing some
            //   unnecessary allocations
            const tmp = this.hoveredWidgets;
            this.hoveredWidgets = this.lastHoveredWidgets;
            this.lastHoveredWidgets = tmp;
            this.hoveredWidgets.clear();
        }

        // Update focus capturer if it changed
        if(event.focusType === null) {
            return captureList;
        }

        if (oldCapturer === undefined) {
            oldCapturer = this.getFocusCapturer(event.focusType);
        }

        if(oldCapturer === captured) {
            return captureList;
        }

        this._fociCapturers.set(event.focusType, captured);
        for(const driver of this.drivers) {
            driver.onFocusCapturerChanged(this, event.focusType, oldCapturer, captured);
        }

        return captureList;
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
        if(!this.enabled) {
            return;
        }

        // Update drivers
        for(const driver of this.drivers) {
            driver.update(this);
        }

        // Pre-layout update child
        this.child.preLayoutUpdate();
    }


    /**
     * Do a post-layout update; calls {@link Root#child}'s
     * {@link Widget#postLayoutUpdate}. Does nothing if root is disabled.
     *
     * Call this before calling {@link Root#paint} and after calling
     * {@link Root#resolveLayout}
     */
    postLayoutUpdate(): void {
        // Skip if UI is disabled
        if(!this.enabled) {
            return;
        }

        // Post-layout update child
        this.child.postLayoutUpdate();
    }

    /**
     * Internal method similar to {@link requestFocus}, except only a specific
     * focus is given; no partner foci are added.
     */
    private giveFocus(focusType: FocusType, widget: Widget): Widget | null {
        const currentFocus = this._foci.get(focusType);
        if(widget === currentFocus) {
            return widget;
        }

        const capturer = widget.dispatchEvent(new FocusEvent(focusType));

        this.clearFocus(focusType);
        this._foci.set(focusType, capturer);

        for(const driver of this.drivers) {
            driver.onFocusChanged(this, focusType, capturer);
        }

        return capturer;
    }

    /**
     * Sets the current {@link Root#_foci | focus} of a given type to a given
     * widget. If the focus changes, {@link Root#clearFocus} is called and
     * {@link Root#drivers} are notified by calling
     * {@link Driver#onFocusChanged}.
     *
     * If the target widget doesn't capture the dispatched {@link FocusEvent},
     * then the focus is not changed.
     */
    requestFocus(focusType: FocusType, widget: Widget): void {
        if(widget !== null) {
            // Replace focus if current focus is not the desired one
            const capturer = this.giveFocus(focusType, widget);
            if (capturer) {
                // special cases for keyboard and tab foci, since they are
                // usually together. a focus that is implied by another focus is
                // called a partner focus
                let partnerFocus = null;
                if(focusType === FocusType.Keyboard) {
                    partnerFocus = FocusType.Tab;
                }
                if(focusType === FocusType.Tab) {
                    partnerFocus = FocusType.Keyboard;
                }

                if(partnerFocus !== null) {
                    this.giveFocus(partnerFocus, capturer);
                }
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
        if(widget === currentFocus) {
            this.clearFocus(focusType);
        }
    }

    /**
     * Clears all the {@link Root#_foci | foci} that are set to a given Widget.
     * Achieved by calling {@link Root#dropFocus}
     */
    dropFoci(widget: Widget): void {
        for(const focusType of this._foci.keys()) {
            this.dropFocus(focusType, widget);
        }
    }

    /**
     * Clears the current {@link Root#_foci | focus} of a given type. If there
     * was a focus set, {@link Root#drivers} are notified by calling
     * {@link Driver#onFocusChanged}.
     */
    clearFocus(focusType: FocusType): void {
        const currentFocus = this._foci.get(focusType);
        if(currentFocus) {
            currentFocus.dispatchEvent(new BlurEvent(focusType));

            this._foci.set(focusType, null);
            for(const driver of this.drivers) {
                driver.onFocusChanged(this, focusType, null);
            }

            if (focusType === FocusType.Pointer) {
                this.droppedPointerFoci.add(currentFocus);
            }

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
        if(this.drivers.has(driver)) {
            return;
        }

        this.drivers.add(driver);
        if(this._enabled && driver.onEnable) {
            driver.onEnable(this);
        }
    }

    /**
     * Unregisters a {@link Driver} from the root, removing it from the
     * {@link Root#drivers} list and calling {@link Driver#onDisable}. If the
     * driver was not registered, nothing happens.
     */
    unregisterDriver(driver: Driver): void {
        // If driver is registered, unregister it
        if(!this.drivers.delete(driver)) {
            return;
        }

        if(this._enabled && driver.onDisable) {
            driver.onDisable(this);
        }
    }

    /**
     * Unregisters all {@link Root#drivers} from the root, by calling
     * {@link Root#unregisterDriver}.
     */
    clearDrivers(): void {
        // Unregister all drivers
        for(const driver of this.drivers) {
            this.unregisterDriver(driver);
        }
    }

    /**
     * Handle initialization of a text input handler. You probably don't need to
     * implement this method, unless you do something with the HTML elements
     * returned by the input handler (such as listening to focus or blur
     * events).
     */
    protected handleTextInputHandlerShow(_handler: TextInputHandler) {}

    /**
     * Dispose all resources associated with text input handler. You probably
     * don't need to implement this method, unless you do something with the
     * HTML elements returned by the input handler (such as listening to focus
     * or blur events).
     */
    protected handleTextInputHandlerDismiss(_handler: TextInputHandler) {}

    /**
     * Instantiate a text input handler. Used for mobile or WebXR where keyboard
     * events are hard to get. Note that this will replace the current handler
     * if there is any.
     *
     * @returns If {@link Root#textInputHandler} is set, returns a new instance, otherwise, returns null.
     */
    getTextInput(listener: TextInputHandlerListener, initialInput = '', selectStart?: number, selectEnd?: number): TextInputHandler | null {
        if(this.textInputHandler === null) {
            return null;
        }

        if (selectStart === undefined) {
            selectStart = initialInput.length;
        }

        if (selectEnd === undefined) {
            selectEnd = selectStart;
        }

        if (this._currentTextInputHandler) {
            this._currentTextInputHandler.dismiss();
        }

        const handler = new this.textInputHandler((...eventData: TextInputHandlerEventData) => {
            if (eventData[0] === TextInputHandlerEventType.Dismiss) {
                this.handleTextInputHandlerDismiss(handler);
                this._currentTextInputHandler = null;
            }

            listener(...eventData);
        });
        this._currentTextInputHandler = handler;
        this.handleTextInputHandlerShow(handler);

        return this._currentTextInputHandler;
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
     * {@link CanvasViewport#preventAtlasBleeding} property.
     */
    get preventAtlasBleeding(): boolean {
        return this.viewport.preventAtlasBleeding;
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

    /**
     * Listen to a specific event with a user listener. Chainable.
     *
     * Only events that pass through the Root will be listened; all trickling
     * events that start at the root will be listened, sticky events will only
     * be listened if they are dispatched at the Root, and bubbling events will
     * only be listened if none of the child widgets capture the event.
     *
     * @param eventType - The {@link WidgetEvent#"type"} to listen to
     * @param listener - The user-provided callback that will be invoked when the event is listened
     * @param once - Should the listener only be invoked once? False by default
     */
    on(eventType: string, listener: WidgetEventListener, once = false): this {
        eventEmitterOn(this.nextListener, this.typedListeners, eventType, listener, once);
        this.nextListener++;
        return this;
    }

    /**
     * Similar to {@link Root#on}, but any event type invokes the user-provided
     * callback, the listener can't be invoked only once, and the listener is
     * called with a lower priority than specific event listeners. Chainable.
     *
     * @param listener - The user-provided callback that will be invoked when a event is listened
     */
    onAny(listener: WidgetEventListener): this {
        eventEmitterOnAny(this.nextListener, this.untypedListeners, listener);
        this.nextListener++;
        return this;
    }

    /**
     * Remove an event listeners added with {@link Root#on}. Not chainable.
     *
     * @param eventType - The {@link WidgetEvent#"type"} to stop listening to
     * @param listener - The user-provided callback that was used in {@link Root#on}
     * @param once - Was the listener only meant to be invoked once? Must match what was used in {@link Root#on}
     */
    off(eventType: string, listener: WidgetEventListener, once = false): boolean {
        return eventEmitterOff(this.typedListeners, eventType, listener, once);
    }

    /**
     * Remove an event listeners added with {@link Root#onAny}. Not chainable.
     *
     * @param listener - The user-provided callback that was used in {@link Root#onAny}
     */
    offAny(listener: WidgetEventListener): boolean {
        return eventEmitterOffAny(this.untypedListeners, listener);
    }

    /**
     * Request that a specific ID is assigned to a specific {@link Widget} that
     * is attached to this Root. Must not be called manually; Widget will
     * automatically manage its ID when needed.
     *
     * @param id - The wanted ID
     * @param widget - The widget that the ID will be assigned to
     */
    requestID(id: string, widget: Widget): void {
        if (this.idMap.has(id)) {
            throw new Error(`Can't request Widget ID "${id}"; already taken`);
        }

        this.idMap.set(id, widget);
    }

    /**
     * Stop assigning a specific widget ID. Must not be called manually.
     *
     * @param id - The ID to stop assigning
     */
    dropID(id: string): void {
        this.idMap.delete(id);
    }

    /**
     * Get the widget that an ID is assigned to. If no widget is assigned to a
     * given ID, an error is thrown.
     *
     * @param id - The ID of the wanted {@link Widget}
     */
    getWidgetByID(id: string): Widget {
        const widget = this.idMap.get(id);
        if (widget === undefined) {
            throw new Error(`There is no descendant Widget with an ID "${id}" attached to this Root`);
        }

        return widget;
    }

    /**
     * Mark a widget as hovered (received a pointer event since the last check).
     * Widgets will call this method automatically, there is no need to manually
     * call this.
     */
    markHovered(widget: Widget): void {
        this.hoveredWidgets.add(widget);
    }

    private indexOfPointerStyle(widget: Widget, source: unknown): number {
        let startIdx = 0;
        let idx: number;

        while ((idx = this.requestedPointerStyleWidgets.indexOf(widget, startIdx)) !== -1) {
            if (this.requestedPointerStyleSources[idx] === source) {
                return idx;
            }

            startIdx = idx + 1;
        }

        return -1;
    }

    /**
     * Request a pointer style. If the pointer style has a lower priority than
     * the current pointer style, it won't be displayed, but will still be
     * queued up in case the higher-priority style is cleared.
     */
    requestPointerStyle(widget: Widget, pointerStyle: string, source?: unknown): void {
        // remove old pointer style requested by source (unless it's the same or
        // missing)
        let needsUpdate = false;
        const oldStyle = this.requestedPointerStyles[0];
        const oldIdx = this.indexOfPointerStyle(widget, source);
        if (oldIdx !== -1) {
            if (this.requestedPointerStyles[oldIdx] === pointerStyle) {
                // already requested
                return;
            }

            this.requestedPointerStyles.splice(oldIdx, 1);
            this.requestedPointerStyleWidgets.splice(oldIdx, 1);
            this.requestedPointerStyleSources.splice(oldIdx, 1);

            if (oldIdx === 0 && oldStyle !== this.requestedPointerStyles[0]) {
                needsUpdate = true;
            }
        }

        // get priority of wanted pointer style
        const priority = ALLOWED_CURSOR_STYLES.indexOf(pointerStyle);
        if (priority === -1) {
            console.warn(`Ignored disallowed/invalid pointer style: "${pointerStyle}"`);
        } else {
            // insert into list before first index with lower priority (lower number
            // means higher priority)
            const len = this.requestedPointerStyles.length;
            let i = 0;
            while (i < len) {
                const oStyle = this.requestedPointerStyles[i];
                const oPriority = ALLOWED_CURSOR_STYLES.indexOf(oStyle);

                if (oPriority > priority) {
                    // lower priority, insert before this index
                    break;
                } else {
                    // higher priority, skip indices until a different pointer style
                    // is found
                    i++;
                    for (; i < len; i++) {
                        if (this.requestedPointerStyles[i] !== oStyle) {
                            break;
                        }
                    }
                }
            }

            this.requestedPointerStyles.splice(i, 0, pointerStyle);
            this.requestedPointerStyleWidgets.splice(i, 0, widget);
            this.requestedPointerStyleSources.splice(i, 0, source);

            if (i === 0 && oldStyle !== this.requestedPointerStyles[0]) {
                needsUpdate = true;
            }
        }

        // update pointer style
        if (needsUpdate && this._enabled && this._pointerStyleHandler) {
            this._pointerStyleHandler(pointerStyle);
        }
    }

    /**
     * Stop requesting a pointer style.
     */
    clearPointerStyle(widget: Widget, source?: unknown): void {
        // remove pointer style requested by source
        const idx = this.indexOfPointerStyle(widget, source);
        if (idx !== -1) {
            const oldStyle = this.requestedPointerStyles[0];

            this.requestedPointerStyles.splice(idx, 1);
            this.requestedPointerStyleWidgets.splice(idx, 1);
            this.requestedPointerStyleSources.splice(idx, 1);

            const newStyle = this.requestedPointerStyles[0];
            if (this._enabled && this._pointerStyleHandler && idx === 0 && oldStyle !== newStyle) {
                this._pointerStyleHandler(newStyle ?? 'default');
            }
        }
    }

    /**
     * Stop requesting all pointer styles from a specific widget.
     */
    clearPointerStylesFromWidget(widget: Widget): void {
        const oldStyle = this.requestedPointerStyles[0];

        // eslint-disable-next-line no-constant-condition
        let idx: number;
        let hadZeroIdx = false;
        while ((idx = this.requestedPointerStyleWidgets.indexOf(widget)) !== -1) {
            this.requestedPointerStyles.splice(idx, 1);
            this.requestedPointerStyleWidgets.splice(idx, 1);
            this.requestedPointerStyleSources.splice(idx, 1);

            if (idx === 0) {
                hadZeroIdx = true;
            }
        }

        const newStyle = this.requestedPointerStyles[0];
        if (this._enabled && this._pointerStyleHandler && hadZeroIdx && oldStyle !== newStyle) {
            this._pointerStyleHandler(newStyle ?? 'default');
        }
    }
}
