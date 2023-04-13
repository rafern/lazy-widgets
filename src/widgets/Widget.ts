import { ThemeProperties } from "../theme/ThemeProperties";
import { PointerEvent } from '../events/PointerEvent';
import { AutoScrollEvent } from '../events/AutoScrollEvent';
import { TabSelectEvent } from '../events/TabSelectEvent';
import { BaseTheme } from '../theme/BaseTheme';
import { DynMsg } from '../core/Strings';
import { eventEmitterHandleEvent, eventEmitterOff, eventEmitterOffAny, eventEmitterOn, eventEmitterOnAny } from '../helpers/WidgetEventEmitter-premade-functions';
import { PropagationModel, WidgetEvent } from "../events/WidgetEvent";

import type { Viewport } from '../core/Viewport';
import type { Bounds } from '../helpers/Bounds';
import type { TricklingEvent } from '../events/TricklingEvent';
import type { Theme } from '../theme/Theme';
import type { Rect } from '../helpers/Rect';
import type { Root } from '../core/Root';
import type { WidgetEventEmitter, WidgetEventListener, WidgetEventTypedListenerMap, WidgetEventUntypedListenerList } from '../events/WidgetEventEmitter';
import type { WidgetAutoXML } from "../xml/WidgetAutoXML";

/**
 * Optional Widget constructor properties.
 *
 * @category Widget
 */
export interface WidgetProperties extends ThemeProperties {
    /** Sets {@link Widget#enabled}. */
    enabled?: boolean;
    /** Sets {@link Widget#flex}. */
    flex?: number;
    /** Sets {@link Widget#id}. */
    id?: string | null;
}

/**
 * A generic widget. All widgets extend this class. All widgets extend
 * {@link BaseTheme} so that the theme in use can be overridden.
 *
 * @category Widget
 */
export abstract class Widget extends BaseTheme implements WidgetEventEmitter {
    /**
     * Input mapping for automatically generating a widget factory for a
     * {@link BaseXMLUIParser} with {@link BaseXMLUIParser#autoRegisterFactory}.
     * If null, then {@link BaseXMLUIParser#registerFactory} must be manually
     * called by the user.
     *
     * This static property must be overridden by a concrete child class if you
     * want to provide auto-factory support.
     */
    static autoXML: WidgetAutoXML | null = null;

    /**
     * Is this widget enabled? If it isn't, it will act as if it doesn't exist,
     * but will still be present in the UI tree.
     */
    private _enabled;
    /**
     * If this is true, widget needs their layout resolved. If implementing a
     * container, propagate this up.
     */
    protected _layoutDirty = true;
    /** Width of widget in pixels. */
    protected width = 0;
    /** Height of widget in pixels. */
    protected height = 0;
    /** Absolute horizontal offset of widget in pixels. */
    protected x = 0;
    /** Absolute vertical offset of widget in pixels. */
    protected y = 0;
    /**
     * The ideal width of the widget in pixels; if non-integer widget dimensions
     * were allowed, the widget would have this size. Use this for layout
     * calculations, but never use this for painting so that subpixel issues are
     * avoided.
     */
    protected idealWidth = 0;
    /** The ideal height of the widget in pixels. See {@link Widget#width}. */
    protected idealHeight = 0;
    /**
     * The ideal absolute horizontal offset of the widget in pixels; if
     * non-integer positions were allowed, the widget would have this position.
     * Use this for layout calculations, but never use this for painting so that
     * subpixel issues are avoided.
     */
    protected idealX = 0;
    /**
     * The ideal absolute vertical offset of the widget in pixels. See
     * {@link Widget#x}.
     */
    protected idealY = 0;
    /** {@link Widget#flex} but for internal use. */
    protected _flex;
    /**
     * The {@link Root} that this widget is currently inside.
     *
     * Widgets not {@link Widget#attached} to a UI tree will have this property
     * set to null.
     */
    protected _root: Root | null = null;
    /**
     * The {@link Viewport} that this widget is currently painting to. A UI tree
     * can have multiple Viewports due to {@link ViewportWidget}, so this is not
     * equivalent to {@link Root#viewport}.
     *
     * Widgets not {@link Widget#attached} to a UI tree will have this property
     * set to null.
     */
    protected _viewport: Viewport | null = null;
    /**
     * The parent {@link Widget} of this widget.
     *
     * Widgets not {@link Widget#attached} to a UI tree will have this property
     * set to null, but root widgets will also have a null parent.
     */
    protected _parent: Widget | null = null;
    /** Can this widget be focused by pressing tab? */
    protected tabFocusable = false;
    /**
     * Is the Widget attached to a UI tree, enabled and in a UI sub-tree where
     * all ascendants are enabled?
     */
    private _active = false;
    /** Typed user listeners attached to this Widget */
    private typedListeners: WidgetEventTypedListenerMap = new Map();
    /** Untyped user listeners attached to this Widget */
    private untypedListeners: WidgetEventUntypedListenerList = [];
    /** Next user listener ID */
    private nextListener = 0;
    /** Internal field for {@link Widget#id}. */
    private _id: string | null = null;

    /**
     * How much this widget will expand relative to other widgets in a flexbox
     * container. If changed, sets {@link Widget#_layoutDirty} to true.
     */
    get flex(): number {
        return this._flex;
    }

    set flex(flex: number) {
        if(flex !== this._flex) {
            this._flex = flex;
            this._layoutDirty = true;
        }
    }

    constructor(properties?: Readonly<WidgetProperties>) {
        super(properties);

        this._enabled = properties?.enabled ?? true;
        this._flex = properties?.flex ?? 0;
        this.id = properties?.id ?? null;
    }

    /**
     * Is this widget enabled? If it isn't, it will act as if it doesn't exist.
     *
     * If getting, {@link Widget#_enabled} is returned.
     */
    set enabled(enabled: boolean) {
        if(enabled === this._enabled) {
            return;
        }

        this._enabled = enabled;
        this.updateActiveState();
    }

    get enabled(): boolean {
        return this._enabled;
    }

    /**
     * The inherited theme of this widget. Sets {@link BaseTheme#fallbackTheme}.
     */
    set inheritedTheme(theme: Theme | undefined) {
        this.fallbackTheme = theme;
    }

    get inheritedTheme(): Theme | undefined {
        return this.fallbackTheme;
    }

    /**
     * Get the resolved dimensions. Returns a 2-tuple containing
     * {@link Widget#width} and {@link Widget#height}.
     *
     * Use {@link Widget#idealDimensions} for layout calculations.
     */
    get dimensions(): [number, number] {
        return [this.width, this.height];
    }

    /**
     * Get the resolved ideal dimensions. Returns a 2-tuple containing
     * {@link Widget#idealWidth} and {@link Widget#idealHeight}.
     *
     * Use this for layout calculations, and {@link Widget#dimensions} for
     * painting.
     */
    get idealDimensions(): [number, number] {
        return [this.idealWidth, this.idealHeight];
    }

    /**
     * Get the resolved position. Returns a 2-tuple containing {@link Widget#x}
     * and {@link Widget#y}.
     *
     * Use {@link Widget#idealPosition} for layout calculations.
     */
    get position(): [number, number] {
        return [this.x, this.y];
    }

    /**
     * Get the resolved ideal position. Returns a 2-tuple containing
     * {@link Widget#idealX} and {@link Widget#idealY}.
     *
     * Use this for layout calculations, and {@link Widget#position} for
     * painting.
     */
    get idealPosition(): [number, number] {
        return [this.idealX, this.idealY];
    }

    /** Get the rectangle bounds (left, right, top, bottom) of this widget. */
    get bounds(): Bounds {
        const x = this.x;
        const y = this.y;
        return [x, x + this.width, y, y + this.height];
    }

    /** Similar to {@link Widget#bounds}, but uses ideal values */
    get idealBounds(): Bounds {
        const x = this.idealX;
        const y = this.idealY;
        return [x, x + this.idealWidth, y, y + this.idealHeight];
    }

    /** Get the rectangle (x, y, width, height) of this widget. */
    get rect(): Rect {
        return [this.x, this.y, this.width, this.height];
    }

    /** Similar to {@link Widget#rect}, but uses ideal values */
    get idealRect(): Rect {
        return [this.idealX, this.idealY, this.idealWidth, this.idealHeight];
    }

    /**
     * Check if the widget's layout is dirty. Returns
     * {@link Widget#_layoutDirty}.
     */
    get layoutDirty(): boolean {
        return this._layoutDirty;
    }

    /**
     * Check if the widget has zero width or height. If true, then
     * {@link Widget#paint} will do nothing, which usually happens when
     * containers overflow.
     */
    get dimensionless(): boolean {
        return this.width == 0 || this.height == 0;
    }

    /**
     * The unique ID of this Widget. If the Widget has no ID, this value will be
     * null. Uniqueness is tested per-UI tree; ID uniqueness is enforced when
     * the ID is changed or when the Widget is attached to a {@link Root}.
     *
     * If the ID is already taken, setting the ID will have no effect and an
     * error will be thrown.
     */
    get id(): string | null {
        return this._id;
    }

    set id(id: string | null) {
        if (id === this._id) {
            return;
        }

        // request/set id
        const oldID = this._id;
        if (id !== null && this._root) {
            this._root.requestID(id, this);
        }

        this._id = id;

        // drop id
        if (this._root && oldID !== null) {
            this._root.dropID(oldID);
        }
    }

    /**
     * Widget event handling callback. If the event is to be captured, the
     * capturer is returned, else, null.
     *
     * By default, this will do nothing and capture the event if it is targeted
     * at itself. Bubbling events will be automatically dispatched to the parent
     * or root. Sticky events will be ignored.
     *
     * If overriding, return the widget that has captured the event (could be
     * `this`, for example, or a child widget if implementing a container), or
     * null if no widget captured the event. Make sure to not capture any events
     * that you do not need, or you may have unexpected results; for example, if
     * you capture all dispatched events indiscriminately, a
     * {@link TabSelectEvent} event may be captured and result in weird
     * behaviour when the user attempts to use tab to select another widget.
     *
     * Parent widgets should dispatch {@link TricklingEvent | TricklingEvents}
     * to children. All widgets should dispatch
     * {@link BubblingEvent | BubblingEvents} to the {@link Widget#parent} or
     * {@link Widget#root}, if available. {@link StickyEvent | StickyEvents}
     * should never be dispatched to children or parents.
     *
     * Note that bubbling events captured by a Root will return null, since
     * there is no capturing **Widget**.
     *
     * Since the default handleEvent implementation already correctly handles
     * bubbling and sticky events, it's a good idea to call super.handleEvent on
     * these cases to avoid rewriting code, after transforming the event if
     * necessary.
     */
    protected handleEvent(baseEvent: WidgetEvent): Widget | null {
        if(baseEvent.propagation === PropagationModel.Trickling) {
            if ((baseEvent as TricklingEvent).target === this) {
                return this;
            } else {
                return null;
            }
        } else if(baseEvent.propagation === PropagationModel.Bubbling) {
            if (this._parent) {
                return this._parent.dispatchEvent(baseEvent);
            } else if (this._root) {
                this._root.dispatchEvent(baseEvent);
            }
        }

        return null;
    }

    /**
     * Called when an event is passed to the Widget. Must not be overridden.
     * Dispatches to user event listeners first; if a user listener captures the
     * event, then `this` is returned.
     *
     * For trickling events:
     * Checks if the target matches the Widget, unless the Widget propagates
     * events, or if the event is a {@link PointerEvent} and is in the bounds of
     * the Widget. If neither of the conditions are true, the event is not
     * captured (null is returned), else, the {@link Widget#handleEvent} method
     * is called and its result is returned.
     *
     * For bubbling or sticky events:
     * Passes the event to the handleEvent method and returns the result.
     *
     * @returns Returns the widget that captured the event or null if none captured the event.
     */
    dispatchEvent(baseEvent: WidgetEvent): Widget | null {
        // ignore event if widget is disabled
        if(!this._enabled) {
            return null;
        }

        if (baseEvent.propagation === PropagationModel.Trickling) {
            const event = baseEvent as TricklingEvent;
            // ignore event if the event is targetted but not a descendant of
            // this widget (or not this widget), or if the event is an
            // untargetted pointer event outside the bounds of the widget
            let isPointerEvent: boolean | null = null;
            if(event.target === null) {
                isPointerEvent = event instanceof PointerEvent;
                // XXX typescript is being derpy again, so we have to typecast
                //     everything to a pointer event despite having a guard
                //     right before the usage
                if(isPointerEvent) {
                    const pointerEvent = event as PointerEvent;
                    if (pointerEvent.x < this.x || pointerEvent.y < this.y || pointerEvent.x >= this.x + this.width || pointerEvent.y >= this.y + this.height) {
                        return null;
                    }
                }
            } else if(event.target !== this) {
                // XXX trace back the event target. if we are an ascendant of
                // the target, continue, otherwise, stop and don't capture. this
                // is probably going to be a bottleneck, however, we shouldn't
                // cache the "trace" of the event, since the tree can change
                // while traversing the ui tree
                let head = event.target._parent;

                while (head !== this) {
                    if (head === null) {
                        return null;
                    }

                    head = head._parent;
                }
            }

            // if this is a pointer event, mark as being hovered
            if (isPointerEvent === null) {
                isPointerEvent = event instanceof PointerEvent;
            }

            if (isPointerEvent) {
                this.root.markHovered(this);
            }

            // dispatch to user event listeners
            if (eventEmitterHandleEvent(this, this.typedListeners, this.untypedListeners, baseEvent)) {
                return this;
            }

            // handle special case for auto-scroll event
            if(event.type === AutoScrollEvent.type && (event as AutoScrollEvent).originallyRelativeTo === this) {
                return this;
            }

            // handle event
            let capturer = null;
            if(event.reversed) {
                capturer = this.handleEvent(event);
            }

            if(event.isa(TabSelectEvent)) {
                if(event.reachedRelative) {
                    if(this.tabFocusable && (capturer === this || capturer === null)) {
                        return this;
                    }
                } else if(event.relativeTo === this) {
                    event.reachedRelative = true;
                }
            }

            if(!event.reversed) {
                capturer = this.handleEvent(event);
            }

            return capturer;
        } else {
            // dispatch to user event listeners
            if (eventEmitterHandleEvent(this, this.typedListeners, this.untypedListeners, baseEvent)) {
                return this;
            }

            return this.handleEvent(baseEvent);
        }
    }

    /**
     * Generic update method which is called before layout is resolved. Does
     * nothing by default. Should be implemented.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected handlePreLayoutUpdate(): void {}

    /**
     * Generic update method which is called before layout is resolved. Calls
     * {@link Widget#handlePreLayoutUpdate} if widget is enabled. Must not be
     * overridden.
     */
    preLayoutUpdate(): void {
        if(this._enabled) {
            this.handlePreLayoutUpdate();
        }
    }

    /**
     * Resolve dimensions of this widget. Must be implemented; set
     * {@link Widget#width} and {@link Widget#height}.
     */
    protected abstract handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void;

    /**
     * Wrapper for {@link Widget#handleResolveDimensions}. Does nothing if
     * {@link Widget#_enabled} is false. If the resolved dimensions change,
     * the widget is marked as dirty. {@link Widget#_layoutDirty} is set to
     * false. If the widget is not loose and the layout has non-infinite max
     * constraints, then the widget is stretched to fit max constraints. Must
     * not be overridden.
     */
    resolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Return early if disabled; make widget dimensionless and clear layout
        // dirty flag
        if(!this._enabled) {
            this.width = 0;
            this.height = 0;
            this.idealWidth = 0;
            this.idealHeight = 0;
            this._layoutDirty = false;
            return;
        }

        // Validate constraints
        if(minWidth == Infinity) {
            throw new Error(DynMsg.INVALID_VALUE('minWidth', minWidth));
        }
        if(minWidth > maxWidth) {
            // Not throwing here because floating pointer precision errors
            // sometimes trigger this due to tight constraints
            console.warn(DynMsg.SWAPPED_MIN_MAX_DIMS(minWidth, maxWidth, 'minWidth', 'maxWidth'));
            minWidth = maxWidth;
        }
        if(minWidth < 0) {
            console.warn(DynMsg.NEGATIVE_DIMS(minWidth, 'minWidth'));
            minWidth = 0;
        }

        if(minHeight == Infinity) {
            throw new Error(DynMsg.INVALID_VALUE('minHeight', minHeight));
        }
        if(minHeight > maxHeight) {
            console.warn(DynMsg.SWAPPED_MIN_MAX_DIMS(minHeight, maxHeight, 'minHeight', 'maxHeight'));
            minHeight = maxHeight;
        }
        if(minHeight < 0) {
            console.warn(DynMsg.NEGATIVE_DIMS(minHeight, 'minHeight'));
            minHeight = 0;
        }

        // Keep track of old dimensions to compare later
        const oldWidth = this.idealWidth;
        const oldHeight = this.idealHeight;

        // Resolve dimensions
        this.handleResolveDimensions(minWidth, maxWidth, minHeight, maxHeight);

        // Validate resolved dimensions, handling overflows, underflows and
        // invalid dimensions
        if(this.idealWidth < minWidth) {
            this.idealWidth = minWidth;
            console.error(DynMsg.BROKEN_CONSTRAINTS(this.idealWidth, minWidth, true, false));
        } else if(this.idealWidth > maxWidth) {
            this.idealWidth = maxWidth;
            console.error(DynMsg.BROKEN_CONSTRAINTS(this.idealWidth, maxWidth, true, true));
        }

        if(this.idealWidth < 0 || !isFinite(this.idealWidth) || isNaN(this.idealWidth)) {
            throw new Error(DynMsg.INVALID_DIMS(true, this.idealWidth));
        }

        if(this.idealHeight < minHeight) {
            this.idealHeight = minHeight;
            console.error(DynMsg.BROKEN_CONSTRAINTS(this.idealHeight, minHeight, false, false));
        } else if(this.idealHeight > maxHeight) {
            this.idealHeight = maxHeight;
            console.error(DynMsg.BROKEN_CONSTRAINTS(this.idealHeight, maxHeight, false, true));
        }

        if(this.idealHeight < 0 || !isFinite(this.idealHeight) || isNaN(this.idealHeight)) {
            throw new Error(DynMsg.INVALID_DIMS(false, this.idealHeight));
        }

        // Clear layout dirty flag
        this._layoutDirty = false;

        // If dimensions changed (compare with tracked old dimensions), then
        // mark as dirty
        if(oldWidth !== this.idealWidth || oldHeight !== this.idealHeight) {
            // FIXME this is being called too much, investigate why. my guess is
            // that this gets called too much because layout resolution is done
            // in 2 stages to measure the minimum space requirements
            this.markWholeAsDirty();
        }
    }

    /**
     * Like {@link Widget#resolveDimensions} but for widgets at the top of the
     * widget tree (the child of the {@link Root}). This retries dimension
     * resolving if there is at least one unconstrained axis so that flex layout
     * works even in infinite layout.
     */
    resolveDimensionsAsTop(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        this.resolveDimensions(minWidth, maxWidth, minHeight, maxHeight);

        // Resolve dimensions again, now with maximum constraints. This is so
        // that widgets that depend on max constraints, such as containers that
        // handle flexbox layout, work properly. Only do this if constraints
        // don't already have maximum dimensions.
        if(maxWidth === Infinity || maxHeight === Infinity) {
            this.resolveDimensions(
                minWidth,
                maxWidth === Infinity ? this.idealWidth : maxWidth,
                minHeight,
                maxHeight === Infinity ? this.idealHeight : maxHeight,
            );
        }
    }

    /**
     * Set the ideal position of this widget ({@link Widget#idealX} and
     * {@link Widget#idealY}). Does not set any flags of the widget.
     *
     * Can be overridden, but `super.resolvePosition` must always be called, and
     * the arguments must be preserved. Container widgets should override this
     * method such that `resolvePosition` is called for each child of the
     * container.
     */
    resolvePosition(x: number, y: number): void {
        // Set position
        this.idealX = x;
        this.idealY = y;
    }

    /**
     * Sets {@link Widget#x}, {@link Widget#y}, {@link Widget#width} and
     * {@link Widget#y} from {@link Widget#idealX}, {@link Widget#idealY},
     * {@link Widget#idealWidth} and {@link Widget#idealHeight} by rounding
     * them. If the final values have changed, {@link Widget#markWholeAsDirty}
     * is called.
     *
     * Can be overridden, but `super.finalizeBounds` must still be called; if
     * you have parts of the widget that can be pre-calculated when the layout
     * is known, such as the length and offset of a {@link Checkbox},
     * then this is the perfect method to override, since it's only called after
     * the layout is resolved to final (non-ideal) values, is only called if
     * needed (unlike {@link postLayoutUpdate}, which is always called after the
     * layout phase) and can be used to compare old and new positions and
     * dimensions.
     *
     * Abstract container widgets such as {@link Parent} must always override
     * this and call `finalizeBounds` on each child widget.
     */
    finalizeBounds(): void {
        // Round bounds
        const [scaleX, scaleY] = this.viewport.effectiveScale;
        const newX = Math.floor(this.idealX * scaleX) / scaleX;
        const newY = Math.floor(this.idealY * scaleY) / scaleY;
        const newWidth = Math.ceil((this.idealX + this.idealWidth) * scaleX) / scaleX - newX;
        const newHeight = Math.ceil((this.idealY + this.idealHeight) * scaleY) / scaleY - newY;

        // Mark as dirty if bounds have changed (with old bounds)
        const changedBounds = newX !== this.x || newY !== this.y || newWidth !== this.width || newHeight !== this.height;
        if(changedBounds) {
            this.markWholeAsDirty();
        }

        // Set final bounds
        this.x = newX;
        this.y = newY;
        this.width = newWidth;
        this.height = newHeight;

        // Mark as dirty if bounds have changed (with new bounds)
        if (changedBounds) {
            this.markWholeAsDirty();
        }
    }

    /**
     * Generic update method which is called after layout is resolved. Does
     * nothing by default. Should be implemented.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected handlePostLayoutUpdate(): void {}

    /**
     * Generic update method which is called after layout is resolved. Calls
     * {@link Widget#handlePostLayoutUpdate} if widget is enabled. Must not be
     * overridden.
     */
    postLayoutUpdate(): void {
        if(this._enabled) {
            this.handlePostLayoutUpdate();
        }
    }

    /**
     * Widget painting callback. Should be overridden; does nothing by default.
     * Do painting logic here when extending Widget.
     *
     * It's safe to repaint the whole widget even if only a part of the widget
     * is damaged, since the painting is automatically clipped to the damage
     * regions, however, it's preferred to only repaint the damaged parts for
     * performance reasons.
     *
     * All passed dirty rectangles intersect the widget, have an area greater
     * than 0, and are clamped to the widget bounds.
     *
     * The painting logic of this widget can modify the rendering context in a
     * way that changes rendering for its children, however, the context must be
     * kept clean for the parent of this widget; operations like clipping for
     * children are OK, but make sure to restore the context to a state with no
     * clipping when the painting logic is finished. This does not apply to some
     * basic context properties such as fillStyle or strokeStyle; you are
     * expected to set these on every handlePainting, do not assume the state of
     * these properties.
     *
     * @param dirtyRects - The damaged regions that need to be re-painted, as a list of dirty rectangles
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    protected handlePainting(dirtyRects: Array<Rect>): void {}

    /**
     * Called when the Widget needs to be re-painted and the Root is being
     * rendered. Does nothing if none of the dirty rectangles intersect the
     * widget or the widget is {@link Widget#dimensionless}, else, calls the
     * {@link Widget#handlePainting} method. Must not be overridden.
     *
     * @param dirtyRects - The damaged regions that need to be re-painted, as a list of dirty rectangles
     */
    paint(dirtyRects: Array<Rect>): void {
        // TODO in-place clamping to reduce GC?
        if(this.dimensionless || dirtyRects.length === 0) {
            return;
        }

        const widgetRight = this.x + this.width;
        const widgetBottom = this.y + this.height;

        const effectiveDirtyRects: Array<Rect> = [];
        for (const rect of dirtyRects) {
            // check if damage intersects widget
            const origLeft = rect[0];
            if (origLeft >= widgetRight) {
                continue;
            }

            const origRight = origLeft + rect[2];
            if (origRight <= this.x) {
                continue;
            }

            const origTop = rect[1];
            if (origTop >= widgetBottom) {
                continue;
            }

            const origBottom = origTop + rect[3];
            if (origBottom <= this.y) {
                continue;
            }

            // clamp damage region
            const left = Math.max(origLeft, this.x);
            const top = Math.max(origTop, this.y);
            const right = Math.min(origRight, widgetRight);
            const bottom = Math.min(origBottom, widgetBottom);

            effectiveDirtyRects.push([ left, top, right - left, bottom - top ]);
        }

        if (effectiveDirtyRects.length === 0) {
            return;
        }

        if(this._enabled) {
            this.handlePainting(effectiveDirtyRects);
        }
    }

    /**
     * Check if this Widget is attached to a UI tree. If not, then this Widget
     * must not be used. Must not be overridden.
     */
    get attached(): boolean {
        return this._root !== null;
    }

    /**
     * Similar to {@link Widget#_root}, but throws an error if the widget is not
     * {@link Widget#attached}.
     */
    get root(): Root {
        if(!this.attached) {
            throw new Error(DynMsg.DETACHED_WIDGET('root'));
        }

        // XXX attached makes sure that _root is not null, but typescript
        // doesn't detect this. force the type system to treat it as non-null
        return this._root as Root;
    }

    /**
     * Similar to {@link Widget#_viewport}, but throws an error if the widget is
     * not {@link Widget#attached}.
     */
    get viewport(): Viewport {
        if(!this.attached) {
            throw new Error(DynMsg.DETACHED_WIDGET('viewport'));
        }

        // XXX attached makes sure that _root is not null, but typescript
        // doesn't detect this. force the type system to treat it as non-null
        return this._viewport as Viewport;
    }

    /**
     * Similar to {@link Widget#_parent}, but throws an error if the widget is
     * not {@link Widget#attached}.
     */
    get parent(): Widget | null {
        if(!this.attached) {
            throw new Error(DynMsg.DETACHED_WIDGET('parent'));
        }

        return this._parent;
    }

    /**
     * Called when the Widget is attached to a UI tree. Should only be
     * overridden by container widgets to attach children or for resource
     * management, but `super.attach` must still be called.
     *
     * If the widget is already in a UI tree (already has a {@link parent} or is
     * the {@link Root#child | root Widget}, both checked via
     * {@link Widget#attached}), then this method will throw an exception; a
     * Widget cannot be in multiple UI trees.
     *
     * @param root - The {@link Root} of the UI tree
     * @param viewport - The {@link Viewport} in this part of the UI tree. A UI tree can have multiple nested Viewports due to {@link ViewportWidget}
     * @param parent - The new parent of this Widget. If `null`, then this Widget has no parent and is the {@link Root#child | root Widget}
     */
    attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        if (this.attached) {
            throw new Error(DynMsg.INVALID_ATTACHMENT(true));
        }

        if (this._id !== null) {
            root.requestID(this._id, this);
        }

        this._root = root;
        this._viewport = viewport;
        this._parent = parent;
        this.updateActiveState();
    }

    /**
     * Called when the Widget is detached from a UI tree. Should only be
     * overridden by container widgets to detach children or for resource
     * management, but `super.detach` must still be called.
     *
     * Sets {@link Widget#_root}, {@link Widget#_viewport} and
     * {@link Widget#_parent} to null.
     *
     * Drops all foci set to this Widget.
     *
     * If the widget was not in a UI tree, then an exception is thrown.
     */
    detach(): void {
        if (!this.attached) {
            throw new Error(DynMsg.INVALID_ATTACHMENT(false));
        }

        const root = this._root as Root;

        if (this._id !== null) {
            root.dropID(this._id);
        }

        root.dropFoci(this);
        root.clearPointerStylesFromWidget(this);
        this._root = null;
        this._viewport = null;
        this._parent = null;
        this.updateActiveState();
    }

    /**
     * Public getter for {@link Widget#_active}. Can only be updated by calling
     * {@link Widget#updateActiveState}, although this should never be done
     * manually; only done automatically by container Widgets and Roots.
     */
    get active() {
        return this._active;
    }

    /**
     * Update the {@link Widget#active} state of the Widget. If the active state
     * changes from `false` to `true`, then {@link Widget#activate} is called.
     * If the active state changes from `true` to `false`, then
     * {@link Widget#deactivate} is called.
     *
     * Container Widgets must override this so that the active state of each
     * child is updated, but `super.updateActiveState` must still be called.
     * Each child's active state must only be updated if the container's active
     * state changed; this is indicated by the return value of this method.
     *
     * @returns Returns true if the active state changed.
     */
    updateActiveState(): boolean {
        const oldActive = this._active;
        this._active = false;
        if(this._enabled && this.attached) {
            if(this._parent === null) {
                // XXX typescript doesn't know that attached implies that _root
                // is not null, hence the type cast
                this._active = (this._root as Root).enabled;
            } else {
                this._active = this._parent.active;
            }
        }

        if(!oldActive && this._active) {
            this.activate();
            return true;
        } else if(oldActive && !this._active) {
            this.deactivate();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Called after the Widget is attached to a UI tree, its parent is
     * {@link Widget#active} (or {@link Root} is enabled if this is the top
     * Widget), and the Widget itself is enabled; only called when all of the
     * previous conditions are fulfilled, not when one of the conditions is
     * fulfilled. Should be overridden for resource management, but
     * `super.activate` must be called.
     *
     * Must not be propagated to children by container Widgets. This is already
     * done automatically by {@link Widget#updateActiveState}.
     *
     * Marks {@link Widget#layoutDirty} as true, and marks the whole widget as
     * dirty.
     */
    protected activate(): void {
        this.markWholeAsDirty();
        this._layoutDirty = true;
    }

    /**
     * Called when the Widget is no longer {@link Widget#active}. Should be
     * overridden for resource management, but `super.deactivate` must be
     * called.
     *
     * Must not be propagated to children by container Widgets. This is already
     * done automatically by {@link Widget#updateActiveState}.
     *
     * Marks {@link Widget#layoutDirty} as true and drops all foci set to this
     * Widget if the Widget is attached.
     */
    protected deactivate(): void {
        this._layoutDirty = true;

        if(this.attached) {
            (this._root as Root).dropFoci(this);
            (this._root as Root).clearPointerStylesFromWidget(this);
        }
    }

    /**
     * {@link AutoScrollEvent | Auto-scroll} to this widget. Uses the whole
     * widget as the {@link AutoScrollEvent#bounds | auto-scroll bounds}.
     */
    autoScroll(): void {
        this.root.dispatchEvent(new AutoScrollEvent(this, [0, this.idealWidth, 0, this.idealHeight]));
    }

    /**
     * Propagate a dirty rectangle from a child widget to the parent.
     *
     * Should be overridden by Widgets that transform their children, to correct
     * the position and dimensions of the dirty rectangle.
     */
    propagateDirtyRect(rect: Rect): void {
        this.markAsDirty(rect);
    }

    /**
     * Mark a part of this widget as dirty. The dirty rectangle will be
     * propagated via ascendant widgets until it reaches a CanvasViewport.
     *
     * If the widget is not active, then this method call is ignored.
     *
     * Must not be overridden; you probably want to override
     * {@link Widget#propagateDirtyRect} instead.
     */
    protected markAsDirty(rect: Rect): void {
        if (!this._active) {
            return;
        }

        if (this._parent) {
            this._parent.propagateDirtyRect(rect);
        } else if (this._viewport) {
            this._viewport.markDirtyRect(rect);
        } else {
            console.warn('Could not mark rectangle as dirty; Widget is in invalid state (_active is true, but _parent and _viewport are null)');
        }
    }

    /**
     * Mark the entire widget as dirty. Conveniance method that calls
     * {@link Widget#markAsDirty}.
     */
    protected markWholeAsDirty(): void {
        this.markAsDirty([this.x, this.y, this.width, this.height]);
    }

    /**
     * Query the position and dimensions of a rectangle as if it were in the
     * same coordinate origin as an ascendant widget (or the root). Call this
     * from a child widget.
     *
     * Useful for reversing transformations made by ascendant widgets.
     *
     * Must be overridden by widgets that transform children or that have a
     * different coordinate origin.
     */
    queryRect(rect: Rect, relativeTo: Widget | null = null): Rect {
        if (relativeTo === this) {
            return rect;
        } else if (this._parent === null) {
            if (relativeTo !== null) {
                throw new Error("Can't query rectangle relative to this widget; relative widget is not an ascendant of the starting widget");
            }

            return rect;
        } else {
            return this._parent.queryRect(rect, relativeTo);
        }
    }

    /**
     * Query the position and dimensions of a rectangle as if it were in the
     * same coordinate origin as an ascendant widget (or the root).
     *
     * Useful for reversing transformations made by ascendant widgets.
     *
     * Must not be overridden.
     */
    queryRectFromHere(rect: Rect, relativeTo: Widget | null = null): Rect {
        if (this._parent === null) {
            if (relativeTo !== null) {
                throw new Error("Can't query rectangle relative to this widget; relative widget is not an ascendant of the starting widget");
            }

            return rect;
        } else {
            return this._parent.queryRect(rect, relativeTo);
        }
    }

    /**
     * Query the position of a point as if it were in the same coordinate origin
     * as an ascendant widget (or the root). Call this from a child widget.
     *
     * Useful for reversing transformations made by ascendant widgets.
     *
     * Must be overridden by widgets that transform children or that have a
     * different coordinate origin.
     */
    queryPoint(x: number, y: number, relativeTo: Widget | null = null): [x: number, y: number] {
        if (relativeTo === this) {
            return [x, y];
        } else if (this._parent === null) {
            if (relativeTo !== null) {
                throw new Error("Can't query point relative to this widget; relative widget is not an ascendant of the starting widget");
            }

            return [x, y];
        } else {
            return this._parent.queryPoint(x, y, relativeTo);
        }
    }

    /**
     * Query the position of a point as if it were in the same coordinate origin
     * as an ascendant widget (or the root).
     *
     * Useful for reversing transformations made by ascendant widgets.
     *
     * Must not be overridden.
     */
    queryPointFromHere(x: number, y: number, relativeTo: Widget | null = null): [x: number, y: number] {
        if (this._parent === null) {
            if (relativeTo !== null) {
                throw new Error("Can't query point relative to this widget; relative widget is not an ascendant of the starting widget");
            }

            return [x, y];
        } else {
            return this._parent.queryPoint(x, y, relativeTo);
        }
    }

    /**
     * Listen to a specific event with a user listener. Only events that pass
     * through this widget will be listened. Chainable.
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
     * Similar to {@link Widget#on}, but any event type invokes the
     * user-provided callback, the listener can't be invoked only once, and the
     * listener is called with a lower priority than specific event listeners.
     * Chainable.
     *
     * @param listener - The user-provided callback that will be invoked when a event is listened
     */
    onAny(listener: WidgetEventListener): this {
        eventEmitterOnAny(this.nextListener, this.untypedListeners, listener);
        this.nextListener++;
        return this;
    }

    /**
     * Remove an event listeners added with {@link Widget#on}. Not chainable.
     *
     * @param eventType - The {@link WidgetEvent#"type"} to stop listening to
     * @param listener - The user-provided callback that was used in {@link Widget#on}
     * @param once - Was the listener only meant to be invoked once? Must match what was used in {@link Widget#on}
     */
    off(eventType: string, listener: WidgetEventListener, once = false): boolean {
        return eventEmitterOff(this.typedListeners, eventType, listener, once);
    }

    /**
     * Remove an event listeners added with {@link Widget#onAny}. Not chainable.
     *
     * @param listener - The user-provided callback that was used in {@link Widget#onAny}
     */
    offAny(listener: WidgetEventListener): boolean {
        return eventEmitterOffAny(this.untypedListeners, listener);
    }

    /**
     * Request a pointer style from the currently attached {@link Root}.
     * Convenience method, which just calls {@link Root#requestPointerStyle}
     * with `this` as the Widget.
     */
    protected requestPointerStyle(pointerStyle: string, source?: unknown): void {
        this.root.requestPointerStyle(this, pointerStyle, source)
    }

    /**
     * Clear the pointer style from the currently attached {@link Root}.
     * Convenience method, which just calls {@link Root#clearPointerStyle} with
     * `this` as the Widget.
     */
    protected clearPointerStyle(source?: unknown): void {
        this.root.clearPointerStyle(this, source);
    }
}
