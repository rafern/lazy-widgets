import type { LayoutConstraints } from '../core/LayoutConstraints';
import { ClippedViewport } from '../core/ClippedViewport';
import { CanvasViewport } from '../core/CanvasViewport';
import { layoutField } from '../decorators/FlagFields';
import { AxisCoupling } from '../widgets/AxisCoupling';
import { Widget, WidgetProperties } from './Widget';
import type { Viewport } from '../core/Viewport';
import type { Bounds } from '../helpers/Bounds';
import { SingleParent } from './SingleParent';
import type { Event } from '../events/Event';
import type { Root } from '../core/Root';
import { DynMsg } from '../core/Strings';

/**
 * Optional ViewportWidget constructor properties.
 *
 * @category Widget
 */
export interface ViewportWidgetProperties extends WidgetProperties {
    /** Sets {@link ViewportWidget#widthCoupling}. */
    widthCoupling?: AxisCoupling,
    /** Sets {@link ViewportWidget#heightCoupling}. */
    heightCoupling?: AxisCoupling,
    /** Sets {@link ViewportWidget#minWidth}. */
    minWidth?: number,
    /** Sets {@link ViewportWidget#minHeight}. */
    minHeight?: number,
    /**
     * If true, then the {@link ViewportWidget} will use a
     * {@link CanvasViewport} instead of a {@link ClippedViewport}.
     */
    useCanvas?: boolean,
    /** Sets {@link ViewportWidget#offset}. */
    offset?: [number, number],
    /** Sets {@link ViewportWidget#constraints}. */
    constraints?: LayoutConstraints
}

// TODO finalizeBounds is called multiple times. this has no side-effects other
// than being less efficient. note that finalizeBounds must be able to be called
// multiple times, not just once per frame. this is because of canvas scaling
// triggering a need for re-rounding dimensions and positions

/**
 * A type of container widget which is allowed to be bigger or smaller than its
 * child.
 *
 * Can be constrained to a specific type of children.
 *
 * Allows setting the offset of the child, automatically clips it if neccessary.
 * Otherwise acts like a {@link Container}. Implemented by force re-painting the
 * child and clipping it or, optionally, by using a {@link Viewport} to paint
 * the child widget to a dedicated canvas.
 *
 * @category Widget
 */
export class ViewportWidget<W extends Widget = Widget> extends SingleParent<W> {
    /** See {@link ViewportWidget#widthCoupling}. For internal use only */
    private _widthCoupling: AxisCoupling;
    /** See {@link ViewportWidget#heightCoupling}. For internal use only */
    private _heightCoupling: AxisCoupling;
    /**
     * The minimum width that this widget will try to expand to.
     *
     * Will be automatically scaled depending on the current {@link Root}'s
     * resolution.
     *
     * @decorator `@layoutField`
     */
    @layoutField
    minWidth: number;
    /**
     * The minimum height that this widget will try to expand to.
     *
     * Will be automatically scaled depending on the current {@link Root}'s
     * resolution.
     *
     * @decorator `@layoutField`
     */
    @layoutField
    minHeight: number;
    /**
     * The actual viewport object. Can be a {@link ClippedViewport} or a
     * {@link CanvasViewport}.
     */
    protected readonly internalViewport: Viewport;
    /**
     * Is the internal viewport a {@link CanvasViewport} instance? If true, then
     * the resolution of the {@link Root} will be inherited automatically.
     */
    readonly useCanvas: boolean;
    /**
     * Child constraints for resolving layout. May be different than
     * {@link ViewportWidget#internalViewport}'s constraints. By default, this
     * is 0 minimum and Infinity maximum per axis.
     *
     * Will be automatically scaled depending on the current {@link Root}'s
     * resolution.
     */
    private _constraints: LayoutConstraints = [0, Infinity, 0, Infinity];
    /** Force child re-paint? Only used when not using a Viewport */
    protected forceRePaint = true;
    /**
     * The amount of horizontal space to reserve. By default, no space is
     * reserved. Useful for situations where additional parts are needed around
     * the viewport, such as scrollbars in {@link ScrollableViewportWidget}.
     *
     * Note that if scaling is being used, then these values are expected to
     * already be scaled.
     *
     * Should be set before {@link ViewportWidget#handleResolveDimensions} is
     * called.
     */
    protected reservedX = 0;
    /** Similar to {@link ViewportWidget#reservedX}, but vertical. */
    protected reservedY = 0;

    /** Create a new ViewportWidget. */
    constructor(child: W, properties?: Readonly<ViewportWidgetProperties>) {
        // Viewport clears its own background, has a single child and propagates
        // events
        super(child, false, true, properties);

        this.useCanvas = properties?.useCanvas ?? false;
        if(this.useCanvas)
            this.internalViewport = new CanvasViewport(child);
        else
            this.internalViewport = new ClippedViewport(child);

        this.minWidth = properties?.minWidth ?? 0;
        this.minHeight = properties?.minHeight ?? 0;
        this._widthCoupling = properties?.widthCoupling ?? AxisCoupling.None;
        this._heightCoupling = properties?.heightCoupling ?? AxisCoupling.None;
        this._constraints = properties?.constraints ?? [0, Infinity, 0, Infinity];
    }

    /**
     * Offset of {@link SingleParent#child}. Positional events will take this
     * into account, as well as rendering. Useful for implementing scrolling.
     */
    get offset(): [number, number] {
        return [...this.internalViewport.offset];
    }

    set offset(offset: [number, number]) {
        // Not using @paintArrayField so that accessor can be overridden
        if(this.internalViewport.offset[0] !== offset[0] || this.internalViewport.offset[1] !== offset[1]) {
            this.internalViewport.offset = [offset[0], offset[1]];
            this._dirty = true;
        }
    }

    /**
     * Accessor for {@link ViewportWidget#_constraints}. Will also update the
     * constraints of the {@link ViewportWidget#internalViewport | Viewport},
     * but may be different due to {@link ViewportWidget#widthCoupling} or
     * {@link ViewportWidget#heightCoupling}.
     */
    set constraints(constraints: LayoutConstraints) {
        if (constraints[0] !== this._constraints[0] ||
            constraints[1] !== this._constraints[1] ||
            constraints[2] !== this._constraints[2] ||
            constraints[3] !== this._constraints[3])
        {
            // Update own constraints
            this._constraints[0] = constraints[0];
            this._constraints[1] = constraints[1];
            this._constraints[2] = constraints[2];
            this._constraints[3] = constraints[3];

            // Update viewport's constaints
            this.internalViewport.constraints = constraints;
        }
    }

    get constraints(): LayoutConstraints {
        return [...this._constraints];
    }

    /**
     * Is the width coupled to the child's? If not {@link AxisCoupling.None},
     * width constraints will be ignored or augmented.
     */
    get widthCoupling(): AxisCoupling {
        return this._widthCoupling;
    }

    set widthCoupling(widthCoupling: AxisCoupling) {
        // Not using @paintArrayField so that accessor can be overridden
        if(this._widthCoupling !== widthCoupling) {
            this._widthCoupling = widthCoupling;
            this._layoutDirty = true;
        }
    }

    /**
     * Is the height coupled to the child's? If not {@link AxisCoupling.None},
     * height constraints will be ignored or augmented.
     */
    get heightCoupling(): AxisCoupling {
        return this._heightCoupling;
    }

    set heightCoupling(heightCoupling: AxisCoupling) {
        // Not using @paintArrayField so that accessor can be overridden
        if(this._heightCoupling !== heightCoupling) {
            this._heightCoupling = heightCoupling;
            this._layoutDirty = true;
        }
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null) {
            this._layoutDirty = true;
            this._dirty = true;
        }
        else if(property === 'canvasFill')
            this._dirty = true;
    }

    protected getBoundsOf(widget: Widget): Bounds {
        const [width, height] = widget.idealDimensions;
        const [x, y] = widget.idealPosition;
        const [childX, childY] = this.child.idealPosition;
        const left = this.idealX + this.offset[0] + x - childX;
        const top = this.idealY + this.offset[1] + y - childY;
        return [ left, left + width, top, top + height ];
    }

    protected override handleEvent(event: Event): Widget | null {
        return this.internalViewport.dispatchEvent(event);
    }

    protected override handlePreLayoutUpdate(): void {
        // Pre-layout update child
        const child = this.child;
        child.preLayoutUpdate();

        // If child's layout is dirty, set self's layout as dirty
        if(child.layoutDirty)
            this._layoutDirty = true;

        // Update viewport resolution if needed
        if(this.useCanvas)
            (this.internalViewport as CanvasViewport).resolution = this.root.resolution;
    }

    protected override handlePostLayoutUpdate(): void {
        // Update viewport rect
        this.internalViewport.rect = [this.x, this.y, this.width, this.height];

        // Post-layout update child
        const child = this.child;
        child.postLayoutUpdate();

        // If child is dirty, set self as dirty
        if(child.dirty)
            this._dirty = true;
    }

    /**
     * Resolve the dimensions of the viewport widget, taking coupling modes and
     * reserved space into account. Note that if space is reserved, then the
     * resulting {@link ViewportWidget#idealWidth} and
     * {@link ViewportWidget#idealHeight} will not include the reserved space.
     * Child classes are expected to add the reserved space to the final
     * dimensions themselves so that they can also be aware of the final
     * non-reserved space.
     */
    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // reserve space
        const rMaxWidth = Math.max(maxWidth - this.reservedX, 0);
        const rMaxHeight = Math.max(maxHeight - this.reservedY, 0);
        let effectiveMinWidth = Math.min(Math.max(minWidth, this.minWidth) - this.reservedX, rMaxWidth);
        let effectiveMinHeight = Math.min(Math.max(minHeight, this.minHeight) - this.reservedY, rMaxHeight);

        // Expand to the needed dimensions
        if(this._widthCoupling !== AxisCoupling.Bi) {
            this.idealWidth = effectiveMinWidth;

            if(this._widthCoupling === AxisCoupling.Uni)
                effectiveMinWidth = this.idealWidth;
        }

        if(this.idealWidth === 0 && this.minWidth === 0 && this._widthCoupling !== AxisCoupling.Bi)
            console.warn(DynMsg.MAYBE_DIMENSIONLESS('width'));

        if(this._heightCoupling !== AxisCoupling.Bi) {
            this.idealHeight = effectiveMinHeight;

            if(this._heightCoupling === AxisCoupling.Uni)
                effectiveMinHeight = this.idealHeight;
        }

        if(this.idealHeight === 0 && this.minHeight === 0 && this._heightCoupling !== AxisCoupling.Bi)
            console.warn(DynMsg.MAYBE_DIMENSIONLESS('height'));

        // Resolve child's layout and handle coupling
        const constraints: LayoutConstraints = [...this._constraints];

        if(this._widthCoupling !== AxisCoupling.None) {
            constraints[0] = effectiveMinWidth;

            if(this._widthCoupling === AxisCoupling.Bi)
                constraints[1] = rMaxWidth;
        }

        if(this._heightCoupling !== AxisCoupling.None) {
            constraints[2] = effectiveMinHeight;

            if(this._heightCoupling === AxisCoupling.Bi)
                constraints[3] = rMaxHeight;
        }

        const child = this.child;
        this.internalViewport.constraints = constraints;
        this.internalViewport.resolveLayout();

        // Bi-couple wanted axes. Do regular layout for non-coupled axes.
        if(this._widthCoupling === AxisCoupling.Bi)
            this.idealWidth = Math.max(0, child.idealDimensions[0]);

        if(this._heightCoupling === AxisCoupling.Bi)
            this.idealHeight = Math.max(0, child.idealDimensions[1]);
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        // HACK Parent#attach attaches child widgets with this._viewport, but
        // we want to use this.internalViewport
        Widget.prototype.attach.call(this, root, viewport, parent);
        this.internalViewport.parent = viewport;
        this.child.attach(root, this.internalViewport, parent);
    }

    override detach(): void {
        // unset parent viewport of internal viewport. using a clipped viewport
        // after this will crash; make sure to only use the viewport if the
        // widget is active
        this.internalViewport.parent = null;
        super.detach();
    }

    protected override handlePainting(forced: boolean): void {
        // Clear background and paint canvas
        this.internalViewport.paint(forced || this.forceRePaint, this.canvasFill);
        this.forceRePaint = false;
    }
}