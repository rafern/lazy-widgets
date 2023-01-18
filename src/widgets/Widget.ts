import { ThemeProperties } from "../theme/ThemeProperties";
import { PointerEvent } from '../events/PointerEvent';
import { AutoScroll } from '../events/AutoScroll';
import type { Viewport } from '../core/Viewport';
import { TabSelect } from '../events/TabSelect';
import type { Bounds } from '../helpers/Bounds';
import { BaseTheme } from '../theme/BaseTheme';
import { FocusType } from '../core/FocusType';
import type { Event } from '../events/Event';
import type { Theme } from '../theme/Theme';
import type { Rect } from '../helpers/Rect';
import type { Root } from '../core/Root';
import { DynMsg } from '../core/Strings';

const twoPi = Math.PI * 2;

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
}

/**
 * A generic widget. All widgets extend this class. All widgets extend
 * {@link BaseTheme} so that the theme in use can be overridden.
 *
 * @category Widget
 */
export abstract class Widget extends BaseTheme {
    /**
     * Is this widget enabled? If it isn't, it will act as if it doesn't exist,
     * but will still be present in the UI tree.
     */
    private _enabled;
    /** Widget will only be painted if dirty is true. */
    protected _dirty = true;
    /**
     * If this is true, widget needs their layout resolved. If implementing a
     * container, propagate this up.
     */
    protected _layoutDirty = true;
    /**
     * Widget will have its background automatically cleared when painting if
     * needsClear is true. The background fill style used is
     * {@link BaseTheme#canvasFill}.
     */
    readonly needsClear: boolean;
    /**
     * Widget will get targetted events even if the target is not itself if it
     * this is true. Useful for implementing container widgets.
     */
    readonly propagatesEvents: boolean;
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

    /** Create a new Widget. */
    constructor(needsClear: boolean, propagatesEvents: boolean, properties?: Readonly<WidgetProperties>) {
        super(properties);

        this.needsClear = needsClear;
        this.propagatesEvents = propagatesEvents;

        this._enabled = properties?.enabled ?? true;
        this._flex = properties?.flex ?? 0;
    }

    /**
     * Is this widget enabled? If it isn't, it will act as if it doesn't exist.
     *
     * If getting, {@link Widget#_enabled} is returned.
     */
    set enabled(enabled: boolean) {
        if(enabled === this._enabled)
            return;

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

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(this.needsClear && (property === null || property === 'canvasFill'))
            this._dirty = true;
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
     * Check if the widget is dirty. Returns {@link Widget#_dirty}, as long as
     * {@link Widget#dimensionless} is not true.
     */
    get dirty(): boolean {
        return this._dirty && !this.dimensionless;
    }

    /**
     * Check if the widget's layout is dirty. Returns
     * {@link Widget#_layoutDirty}.
     */
    get layoutDirty(): boolean {
        return this._layoutDirty;
    }

    /**
     * Check if the widget has zero width or height.
     *
     * If true, {@link Widget#paint} will do nothing and {@link Widget#dirty}
     * will be false even if {@link Widget#_dirty} is true.
     *
     * Usually becomes true when containers overflow.
     */
    get dimensionless(): boolean {
        return this.width == 0 || this.height == 0;
    }

    /**
     * Called when a focus type has been grabbed by this Widget. Does nothing by
     * default. Can be overridden.
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    onFocusGrabbed(focusType: FocusType): void {}

    /**
     * Called when a focus type owned by this Widget has been dropped. Does
     * nothing by default. Can be overridden.
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    onFocusDropped(focusType: FocusType): void {}

    /**
     * Widget event handling callback. If the event is to be captured, the
     * capturer is returned, else, null.
     *
     * By default, this will do nothing and capture the event if it is targetted
     * at itself.
     *
     * If overriding, return the widget that has captured the event (could be
     * `this`, for example, or a child widget if implementing a container), or
     * null if no widget captured the event. Make sure to not capture any events
     * that you do not need, or you may have unexpected results; for example, if
     * you capture all dispatched events indiscriminately, a {@link TabSelect}
     * event may be captured and result in weird behaviour when the user
     * attempts to use tab to select another widget.
     */
    protected handleEvent(event: Event): Widget | null {
        if(event.target === this)
            return this;
        else
            return null;
    }

    /**
     * Called when an event is passed to the Widget. Checks if the target
     * matches the Widget, unless the Widget propagates events, or if the event
     * is a {@link PointerEvent} and is in the bounds of the Widget. If neither
     * of the conditions are true, the event is not captured (null is returned),
     * else, the {@link Widget#handleEvent} method is called and its result is
     * returned. Must not be overridden.
     *
     * @returns Returns the widget that captured the event or null if none captured the event.
     */
    dispatchEvent(event: Event): Widget | null {
        if(!this._enabled)
            return null;

        if(event.target === null) {
            if(event instanceof PointerEvent) {
                if(event.x < this.x || event.y < this.y || event.x >= this.x + this.width || event.y >= this.y + this.height)
                    return null;
            }
            else if(event instanceof AutoScroll) {
                if(event.originallyRelativeTo === this)
                    return this;
                else if(!this.propagatesEvents)
                    return null;
            }
        }
        else if(event.target !== this && !this.propagatesEvents)
            return null;

        let capturer = null;
        if(event.reversed)
            capturer = this.handleEvent(event);

        if(event instanceof TabSelect) {
            if(event.reachedRelative) {
                if(this.tabFocusable && (capturer === this || capturer === null))
                    return this;
            }
            else if(event.relativeTo === this)
                event.reachedRelative = true;
        }

        if(!event.reversed)
            capturer = this.handleEvent(event);

        return capturer;
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
        if(this._enabled)
            this.handlePreLayoutUpdate();
    }

    /**
     * Resolve dimensions of this widget. Must be implemented; set
     * {@link Widget#width} and {@link Widget#height}.
     */
    protected abstract handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void;

    /**
     * Wrapper for {@link Widget#handleResolveDimensions}. Does nothing if
     * {@link Widget#_enabled} is false. If the resolved dimensions change,
     * {@link Widget#_dirty} is set to true. {@link Widget#_layoutDirty} is set
     * to false. If the widget is not loose and the layout has non-infinite max
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
        if(minWidth == Infinity)
            throw new Error(DynMsg.INVALID_VALUE('minWidth', minWidth));
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

        if(minHeight == Infinity)
            throw new Error(DynMsg.INVALID_VALUE('minHeight', minHeight));
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
        }
        else if(this.idealWidth > maxWidth) {
            this.idealWidth = maxWidth;
            console.error(DynMsg.BROKEN_CONSTRAINTS(this.idealWidth, maxWidth, true, true));
        }

        if(this.idealWidth < 0 || !isFinite(this.idealWidth) || isNaN(this.idealWidth))
            throw new Error(DynMsg.INVALID_DIMS(true, this.idealWidth));

        if(this.idealHeight < minHeight) {
            this.idealHeight = minHeight;
            console.error(DynMsg.BROKEN_CONSTRAINTS(this.idealHeight, minHeight, false, false));
        }
        else if(this.idealHeight > maxHeight) {
            this.idealHeight = maxHeight;
            console.error(DynMsg.BROKEN_CONSTRAINTS(this.idealHeight, maxHeight, false, true));
        }

        if(this.idealHeight < 0 || !isFinite(this.idealHeight) || isNaN(this.idealHeight))
            throw new Error(DynMsg.INVALID_DIMS(false, this.idealHeight));

        // Clear layout dirty flag
        this._layoutDirty = false;

        // If dimensions changed (compare with tracked old dimensions), then set
        // dirty flag
        if(oldWidth !== this.idealWidth || oldHeight !== this.idealHeight)
            this._dirty = true;
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
     * them. If the final values have changed, {@link Widget#_dirty} is set to
     * true.
     *
     * Can be overridden, but `super.finalizeBounds` must still be called; if
     * you have parts of the widget that can be pre-calculated when the layout
     * is known, such as the length and offset of a {@link Checkbox}, or
     * non-default dirty flags, such as {@link MultiContainer#backgroundDirty},
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

        // Mark as dirty if bounds have changed
        if(newX !== this.x || newY !== this.y || newWidth !== this.width || newHeight !== this.height)
            this._dirty = true;

        // Set final bounds
        this.x = newX;
        this.y = newY;
        this.width = newWidth;
        this.height = newHeight;
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
        if(this._enabled)
            this.handlePostLayoutUpdate();
    }

    /**
     * Paiting utility: clears background of widget. Should not be overridden.
     *
     * Rounds to nearest pixels; no subpixel clearing.
     *
     * The background fill style used is {@link ThemeProperties#canvasFill}.
     *
     * @param fillStyle - The fill style to use for clearing. If null (default), then the value of {@link ThemeProperties#canvasFill} is used
     */
    protected clear(x: number, y: number, width: number, height: number, fillStyle: string | CanvasGradient | CanvasPattern | null = null): void {
        const ctx = this.viewport.context;
        ctx.save();
        ctx.globalCompositeOperation = 'copy';
        ctx.fillStyle = fillStyle ?? this.canvasFill;
        ctx.beginPath();
        // These are rounded because clipping and filling doesn't
        // work properly with decimal points
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.fill();
        ctx.restore();
    }

    /**
     * Paiting utility: start a clear operation with no clipping path, the user
     * has to add their own paths to the context. Should not be overridden.
     *
     * @param fillStyle - The fill style to use for clearing. If null (default), then the value of {@link ThemeProperties#canvasFill} is used
     */
    protected clearStart(fillStyle: string | CanvasGradient | CanvasPattern | null = null): void {
        const ctx = this.viewport.context;
        ctx.save();
        ctx.globalCompositeOperation = 'copy';
        ctx.fillStyle = fillStyle ?? this.canvasFill;
        ctx.beginPath();
    }

    /**
     * Paiting utility: end a clear operation (from {@link Widget#clearStart}). Should
     * not be overridden.
     *
     * @param fillRule - The canvas fill rule for clipping. See the {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip#parameters | canvas clip documentation}
     */
    protected clearEnd(fillRule: CanvasFillRule = 'nonzero'): void {
        const ctx = this.viewport.context;
        ctx.clip(fillRule);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Painting utility: paints a circle. Should not be overridden. Coordinates
     * are relative to the center of the circle. Uses ctx's current fillStyle.
     * Does not restore the context state after finishing.
     */
    protected paintCircle(x: number, y: number, radius: number): void {
        const ctx = this.viewport.context;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, twoPi);
        ctx.fill();
    }

    /**
     * Widget painting callback. By default does nothing. Do painting logic here
     * when extending Widget. Even if {@link Widget#_dirty} is false, if this
     * method is called, then the widget must still be painted. Should be
     * overridden.
     *
     * @param forced - Was this widget force-painted? If calling a child's paint method, propagate this value
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    protected handlePainting(forced: boolean): void {}

    /**
     * Called when the Widget is dirty and the Root is being rendered. Does
     * nothing if dirty flag is not set, else, clears the background if
     * {@link Widget#needsClear} is true, calls the
     * {@link Widget#handlePainting} method and unsets the dirty flag.
     * Automatically calls {@link Widget#dryPaint} if
     * {@link Widget#dimensionless} is true. Must not be overridden.
     *
     * @param force - Force re-paint even if {@link Widget#_dirty} is false
     */
    paint(force = false): void {
        if(this.dimensionless)
            return this.dryPaint();

        if(!this._dirty && !force)
            return;

        if(this._enabled) {
            if(this.needsClear)
                this.clear(this.x, this.y, this.width, this.height);

            const ctx = this.viewport.context;
            ctx.save();
            this.handlePainting(force);
            ctx.restore();
        }

        this._dirty = false;
    }

    /**
     * Unset this widget's dirty flag. Call this when painting a child that you
     * know will not be visible, such as if clipping and the child is out of
     * bounds. If implementing a container widget, override this so that each
     * child widget's dryPaint method is called.
     */
    dryPaint(): void {
        this._dirty = false;
    }

    /**
     * Force the widget to be fully re-painted and (by default) have layout
     * resolved. For internal use only or for use by {@link Parent} widgets so
     * that children get properly marked as dirty when added to a new container
     * after reuse.
     *
     * Should be overridden if the derived Widget has more dirty flags other
     * than the default ones (such as {@link MultiContainer#backgroundDirty}),
     * but `super.forceDirty` must be called.
     */
    forceDirty(markLayout = true): void {
        this._dirty = true;

        if(markLayout)
            this._layoutDirty = true;
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
        if(!this.attached)
            throw new Error(DynMsg.DETACHED_WIDGET('root'));

        // XXX attached makes sure that _root is not null, but typescript
        // doesn't detect this. force the type system to treat it as non-null
        return this._root as Root;
    }

    /**
     * Similar to {@link Widget#_viewport}, but throws an error if the widget is
     * not {@link Widget#attached}.
     */
    get viewport(): Viewport {
        if(!this.attached)
            throw new Error(DynMsg.DETACHED_WIDGET('viewport'));

        // XXX attached makes sure that _root is not null, but typescript
        // doesn't detect this. force the type system to treat it as non-null
        return this._viewport as Viewport;
    }

    /**
     * Similar to {@link Widget#_parent}, but throws an error if the widget is
     * not {@link Widget#attached}.
     */
    get parent(): Widget | null {
        if(!this.attached)
            throw new Error(DynMsg.DETACHED_WIDGET('parent'));

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
        if(this.attached)
            throw new Error(DynMsg.INVALID_ATTACHMENT(true));

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
        if(!this.attached)
            throw new Error(DynMsg.INVALID_ATTACHMENT(false));

        (this._root as Root).dropFoci(this);
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
            }
            else
                this._active = this._parent.active;
        }

        if(!oldActive && this._active) {
            this.activate();
            return true;
        }
        else if(oldActive && !this._active) {
            this.deactivate();
            return true;
        }
        else
            return false;
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
     * Marks {@link Widget#dirty} and {@link Widget#layoutDirty} as true.
     */
    protected activate(): void {
        this._dirty = true;
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
     * Marks {@link Widget#dirty} and {@link Widget#layoutDirty} as true, and
     * drops all foci set to this Widget if the Widget is attached.
     */
    protected deactivate(): void {
        this._dirty = true;
        this._layoutDirty = true;

        if(this.attached)
            (this._root as Root).dropFoci(this);
    }

    /**
     * {@link AutoScroll | Auto-scroll} to this widget. Uses the whole widget as
     * the {@link AutoScroll#bounds | auto-scroll bounds}.
     */
    autoScroll(): void {
        this.root.dispatchEvent(new AutoScroll(this, [0, this.idealWidth, 0, this.idealHeight]));
    }
}