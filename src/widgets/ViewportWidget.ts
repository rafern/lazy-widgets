import { ClippedViewport } from '../core/ClippedViewport.js';
import { CanvasViewport } from '../core/CanvasViewport.js';
import { AxisCoupling } from '../core/AxisCoupling.js';
import { Widget, WidgetProperties } from './Widget.js';
import { SingleParent } from './SingleParent.js';
import { DynMsg } from '../core/Strings.js';
import { Rect } from '../helpers/Rect.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { TricklingEvent } from '../events/TricklingEvent.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import { ScrollEvent } from '../events/ScrollEvent.js';
import type { LayoutConstraints } from '../core/LayoutConstraints.js';
import type { Viewport } from '../core/Viewport.js';
import type { Bounds } from '../helpers/Bounds.js';
import type { Root } from '../core/Root.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { viewportRelativePointToAbsolute } from '../helpers/viewportRelativePointToAbsolute.js';
import { viewportRelativeRectToAbsolute } from '../helpers/viewportRelativeRectToAbsolute.js';
import { clipRelativeRectToAbsoluteViewport } from '../helpers/clipRelativeRectToAbsoluteViewport.js';

/**
 * Optional ViewportWidget constructor properties.
 *
 * @category Core
 */
export interface ViewportWidgetProperties extends WidgetProperties {
    /** Sets {@link ViewportWidget#widthCoupling}. */
    widthCoupling?: AxisCoupling,
    /** Sets {@link ViewportWidget#heightCoupling}. */
    heightCoupling?: AxisCoupling,
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
 * Note that, if using a {@link CanvasViewport} by setting
 * {@link ViewportWidget#useCanvas} to true, widgets may be blurry when the
 * offset is not aligned to the same grid as the parent viewport. This is not
 * fixable. For better quality use {@link ClippedViewport}; only use
 * {@link ViewportWidget#useCanvas} when absolutely necessary.
 *
 * @category Widget
 */
export class ViewportWidget<W extends Widget = Widget> extends SingleParent<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'viewport-widget',
        inputConfig: SingleParentXMLInputConfig
    };

    /** See {@link ViewportWidget#widthCoupling}. For internal use only */
    private _widthCoupling: AxisCoupling;
    /** See {@link ViewportWidget#heightCoupling}. For internal use only */
    private _heightCoupling: AxisCoupling;
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
    /** {@link ViewportWidget#_constraints} but for internal use. */
    private _constraints: LayoutConstraints = [0, Infinity, 0, Infinity];
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

    constructor(child: W, properties?: Readonly<ViewportWidgetProperties>) {
        super(child, properties);

        this.useCanvas = properties?.useCanvas ?? false;
        if(this.useCanvas) {
            this.internalViewport = new CanvasViewport(child);
        } else {
            this.internalViewport = new ClippedViewport(child);
        }

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
        // Not using @damageArrayField so that accessor can be overridden
        const [oldX, oldY] = this.internalViewport.offset;
        if(oldX !== offset[0] || oldY !== offset[1]) {
            this.internalViewport.offset = [offset[0], offset[1]];
            this.markWholeAsDirty();

            const [newX, newY] = this.internalViewport.offset;
            const deltaX = newX - oldX;
            const deltaY = newY - oldY;

            if (deltaX !== 0 || deltaY !== 0) {
                this.dispatchEvent(new ScrollEvent(this, newX, newY, deltaX, deltaY));
            }
        }
    }

    /**
     * Child constraints for resolving layout. May be different than
     * {@link ViewportWidget#internalViewport}'s constraints. By default, this
     * is 0 minimum and Infinity maximum per axis.
     *
     * Will be automatically scaled depending on the current {@link Root}'s
     * resolution.
     *
     * Will also update the constraints of the
     * {@link ViewportWidget#internalViewport | Viewport}, but may be different
     * due to {@link ViewportWidget#widthCoupling} or
     * {@link ViewportWidget#heightCoupling}.
     */
    set constraints(constraints: LayoutConstraints) {
        if (constraints[0] !== this._constraints[0] ||
            constraints[1] !== this._constraints[1] ||
            constraints[2] !== this._constraints[2] ||
            constraints[3] !== this._constraints[3]) {
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
        // Not using @damageArrayField so that accessor can be overridden
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
        // Not using @damageArrayField so that accessor can be overridden
        if(this._heightCoupling !== heightCoupling) {
            this._heightCoupling = heightCoupling;
            this._layoutDirty = true;
        }
    }

    protected getBoundsOf(widget: Widget): Bounds {
        const [width, height] = widget.idealDimensions;
        const [x, y] = widget.idealPosition;
        const [childX, childY] = this.child.idealPosition;
        const left = this.idealX + this.offset[0] + x - childX;
        const top = this.idealY + this.offset[1] + y - childY;
        return [ left, left + width, top, top + height ];
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation === PropagationModel.Trickling) {
            return this.internalViewport.dispatchTricklingEvent(event as TricklingEvent);
        } else {
            return super.handleEvent(event);
        }
    }

    protected override handlePreLayoutUpdate(): void {
        // Pre-layout update child
        const child = this.child;
        child.preLayoutUpdate();

        // If child's layout is dirty, set self's layout as dirty
        if (child.layoutDirty) {
            this._layoutDirty = true;
        }

        // Update viewport resolution if needed
        if(this.useCanvas) {
            (this.internalViewport as CanvasViewport).resolution = this.root.resolution;
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update child
        const child = this.child;
        child.postLayoutUpdate();
    }

    override finalizeBounds(): void {
        super.finalizeBounds();

        // Update viewport rect
        this.internalViewport.rect = [this.x, this.y, this.width, this.height];
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
        let effectiveMinWidth = Math.min(Math.max(minWidth - this.reservedX, 0), rMaxWidth);
        let effectiveMinHeight = Math.min(Math.max(minHeight - this.reservedY, 0), rMaxHeight);

        // Expand to the needed dimensions
        if(this._widthCoupling !== AxisCoupling.Bi && this._widthCoupling !== AxisCoupling.ChildToParent) {
            this.idealWidth = effectiveMinWidth;

            if(this._widthCoupling === AxisCoupling.ParentToChild) {
                effectiveMinWidth = this.idealWidth;
            }
        }

        if(this.idealWidth === 0 && this.minWidth === 0 && this._widthCoupling !== AxisCoupling.Bi) {
            console.warn(DynMsg.MAYBE_DIMENSIONLESS('width'));
        }

        if(this._heightCoupling !== AxisCoupling.Bi && this._heightCoupling !== AxisCoupling.ChildToParent) {
            this.idealHeight = effectiveMinHeight;

            if(this._heightCoupling === AxisCoupling.ParentToChild) {
                effectiveMinHeight = this.idealHeight;
            }
        }

        if(this.idealHeight === 0 && this.minHeight === 0 && this._heightCoupling !== AxisCoupling.Bi) {
            console.warn(DynMsg.MAYBE_DIMENSIONLESS('height'));
        }

        // Resolve child's layout and handle coupling
        const constraints: LayoutConstraints = [...this._constraints];

        if(this._widthCoupling !== AxisCoupling.None) {
            constraints[0] = effectiveMinWidth;

            if(this._widthCoupling === AxisCoupling.Bi) {
                constraints[1] = rMaxWidth;
            }
        }

        if(this._heightCoupling !== AxisCoupling.None) {
            constraints[2] = effectiveMinHeight;

            if(this._heightCoupling === AxisCoupling.Bi) {
                constraints[3] = rMaxHeight;
            }
        }

        const child = this.child;
        this.internalViewport.constraints = constraints;
        this.internalViewport.resolveLayout();

        // Bi-couple wanted axes. Do regular layout for non-coupled axes.
        if(this._widthCoupling === AxisCoupling.Bi || this._widthCoupling === AxisCoupling.ChildToParent) {
            this.idealWidth = Math.max(0, child.idealDimensions[0]);
        }

        if(this._heightCoupling === AxisCoupling.Bi || this._heightCoupling === AxisCoupling.ChildToParent) {
            this.idealHeight = Math.max(0, child.idealDimensions[1]);
        }
    }

    override attach(root: Root, viewport: Viewport, parent: Widget | null): void {
        // HACK Parent#attach attaches child widgets with this._viewport, but
        // we want to use this.internalViewport
        Widget.prototype.attach.call(this, root, viewport, parent);
        this.internalViewport.parent = viewport;
        this.child.attach(root, this.internalViewport, this);
    }

    override detach(): void {
        // unset parent viewport of internal viewport. using a clipped viewport
        // after this will crash; make sure to only use the viewport if the
        // widget is active
        this.internalViewport.parent = null;
        super.detach();
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Clear background and paint canvas
        this.internalViewport.paint(dirtyRects);
    }

    override propagateDirtyRect(rect: Rect): void {
        const clippedRect = clipRelativeRectToAbsoluteViewport(this.internalViewport, this.rect, rect);
        if (!clippedRect) {
            return;
        }

        super.propagateDirtyRect(clippedRect);
    }

    override queryRect(rect: Rect, relativeTo: Widget | null = null): Rect {
        // convert rect from relative coordinates to absolute coordinates if
        // necessary
        if (this.internalViewport.relativeCoordinates) {
            rect = viewportRelativeRectToAbsolute(this.internalViewport, rect);
        }

        return super.queryRect(rect, relativeTo);
    }

    override queryPoint(x: number, y: number, relativeTo: Widget | null = null): [x: number, y: number] {
        // convert point from relative coordinates to absolute coordinates if
        // necessary
        if (this.internalViewport.relativeCoordinates) {
            [x, y] = viewportRelativePointToAbsolute(this.internalViewport, x, y);
        }

        return super.queryPoint(x, y, relativeTo);
    }
}
