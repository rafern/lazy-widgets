import { ViewportWidget, ViewportWidgetProperties } from './ViewportWidget';
import { AxisCoupling } from '../widgets/AxisCoupling';
import { PointerEvent } from '../events/PointerEvent';
import { PointerWheel } from '../events/PointerWheel';
import { ClickHelper } from '../helpers/ClickHelper';
import { ClickState } from '../helpers/ClickState';
import { TextHelper } from '../helpers/TextHelper';
import { AutoScroll } from '../events/AutoScroll';
import type { Bounds } from '../helpers/Bounds';
import type { Event } from '../events/Event';
import { Leave } from '../events/Leave';
import type { Widget } from './Widget';
import { Root } from '../core/Root';

/**
 * The mode for how a scrollbar is shown in a {@link ScrollableViewportWidget}.
 *
 * @category Widget
 */
export enum ScrollbarMode {
    /** The scrollbar is an overlay and therefore only shown when needed */
    Overlay,
    /** The scrollbar is part of the layout and therefore always shown */
    Layout,
    /** The scrollbar is hidden, but the content can still be scrolled */
    Hidden,
}

/**
 * Optional ScrollableViewportWidget constructor properties.
 *
 * @category Widget
 */
export interface ScrollableViewportWidgetProperties extends ViewportWidgetProperties {
    /** Sets {@link ScrollableViewportWidget#scrollbarMode}. */
    scrollbarMode?: ScrollbarMode
}

/**
 * A wrapper for a {@link ViewportWidget} with scrollbars.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class ScrollableViewportWidget<W extends Widget = Widget> extends ViewportWidget<W> {
    /**
     * See {@link ScrollableViewportWidget#scrollbarMode}. For internal use only
     */
    private _scrollbarMode: ScrollbarMode;
    /**
     * The effective viewport width (ideal width not occupied by a non-overlay
     * scrollbar), for scrollbar calculations. For internal use only.
     */
    private effectiveWidth = 0;
    /**
     * The effective viewport height (ideal height not occupied by a non-overlay
     * scrollbar), for scrollbar calculations. For internal use only.
     */
    private effectiveHeight = 0;
    /**
     * ClickHelper used for checking if the horizontal scrollbar has been
     * dragged
     */
    private horizontalClickHelper: ClickHelper;
    /**
     * ClickHelper used for checking if the vertical scrollbar has been dragged
     */
    private verticalClickHelper: ClickHelper;
    /** Is the vertical scrollbar being dragged? If null, none is */
    private verticalDragged: boolean | null = null;
    /** What was the starting scroll value before dragging? */
    private startingScroll = 0;
    /** What was the normalised offset when starting drag? */
    private startingOffset = 0;
    /** When was the last scroll attempt in milliseconds since Unix epoch? */
    private lastScroll = 0;
    /** Was the horizontal scrollbar painted last frame? */
    private horizWasPainted = false;
    /** Was the vertical scrollbar painted last frame? */
    private vertWasPainted = false;
    /** The line height used for scrolling via wheel events. */
    private _scrollLineHeight = 0;

    /**
     * Create a new ScrollableViewportWidget.
     *
     * If an axis is bi-coupled, that axis will not have a scrollbar.
     */
    constructor(child: W, properties?: Readonly<ScrollableViewportWidgetProperties>) {
        super(child, properties);

        this._scrollbarMode = properties?.scrollbarMode ?? ScrollbarMode.Overlay;
        this.horizontalClickHelper = new ClickHelper(this);
        this.verticalClickHelper = new ClickHelper(this);
        this.updateScrollLineHeight();
    }

    /** The mode for how the scrollbar is shown. */
    get scrollbarMode(): ScrollbarMode {
        return this._scrollbarMode;
    }

    set scrollbarMode(scrollbarMode: ScrollbarMode) {
        if(this._scrollbarMode !== scrollbarMode) {
            const oldScroll = this.scroll;
            this._scrollbarMode = scrollbarMode;
            this.scroll = oldScroll;
            this._layoutDirty = true;
            this._dirty = true;
        }
    }

    /**
     * Offset of {@link SingleParent#child}. Positional events will take this
     * into account, as well as rendering. Unlike {@link ViewportWidget#offset},
     * this will clamp to possible scroll values to avoid issues.
     */
    override get offset(): [number, number] {
        return super.offset;
    }

    override set offset(offset: [number, number]) {
        const [childWidth, childHeight] = this.child.idealDimensions;

        super.offset = [
            -Math.max(Math.min(-offset[0], childWidth - this.effectiveWidth), 0),
            -Math.max(Math.min(-offset[1], childHeight - this.effectiveHeight), 0),
        ];
    }

    override get widthCoupling(): AxisCoupling {
        return super.widthCoupling;
    }

    override set widthCoupling(widthCoupling: AxisCoupling) {
        const oldScroll = this.scroll;
        super.widthCoupling = widthCoupling;
        this.scroll = oldScroll;
    }

    override get heightCoupling(): AxisCoupling {
        return super.heightCoupling;
    }

    override set heightCoupling(heightCoupling: AxisCoupling) {
        const oldScroll = this.scroll;
        super.heightCoupling = heightCoupling;
        this.scroll = oldScroll;
    }

    /**
     * The current scroll values. Similar to
     * {@link ScrollableViewportWidget#offset}, but with normalised values (from
     * 0 to 1).
     */
    get scroll(): [number, number] {
        const [offsetX, offsetY] = this.offset;
        const [childWidth, childHeight] = this.child.idealDimensions;
        const diffX = childWidth - this.effectiveWidth;
        const diffY = childHeight - this.effectiveHeight;
        return [
            diffX === 0 ? 0 : Math.min(Math.max(-offsetX / diffX, 0), 1),
            diffY === 0 ? 0 : Math.min(Math.max(-offsetY / diffY, 0), 1),
        ];
    }

    set scroll(scroll: [number, number]) {
        const [childWidth, childHeight] = this.child.idealDimensions;
        this.offset = [
            -scroll[0] * (childWidth - this.effectiveWidth),
            -scroll[1] * (childHeight - this.effectiveHeight),
        ];
    }

    /** Get the ClickHelper of a scrollbar */
    private getClickHelper(vertical: boolean): ClickHelper {
        if(vertical)
            return this.verticalClickHelper;
        else
            return this.horizontalClickHelper;
    }

    /**
     * Handle a pointer/leave event for a given scrollbar.
     *
     * @returns Returns true if the event was captured
     */
    private handleEventScrollbar(vertical: boolean, corner: boolean, event: Event, root: Root): boolean {
        // Abort if the other scrollbar is being dragged
        if(this.verticalDragged !== null && this.verticalDragged !== vertical)
            return false;

        // Get click area of scrollbar. If in overlay mode, use the filled part
        // of the scrollbar as the click area since there is no background
        const [fillRect, bgRect] = this.getScrollbarRects(vertical, corner);
        const overlay = this._scrollbarMode === ScrollbarMode.Overlay;
        const clickRect = overlay ? fillRect : bgRect;
        const clickArea: [number, number, number, number] = [
            clickRect[0],
            clickRect[0] + clickRect[2],
            clickRect[1],
            clickRect[1] + clickRect[3],
        ];

        // Handle click event
        const clickHelper = this.getClickHelper(vertical);
        clickHelper.handleClickEvent(event, root, clickArea);

        const clickState = clickHelper.clickState;
        const stateChanged = clickHelper.clickStateChanged;
        if(stateChanged)
            this._dirty = true;

        if(clickState === ClickState.Hold) {
            // Abort if state is not valid, but grab the event
            if(clickHelper.pointerPos === null || !(event instanceof PointerEvent))
                return true;

            const axisIndex = vertical ? 1 : 0;
            const scroll = this.scroll;

            // Skip check if in overlay mode; can only scroll by dragging in
            // this mode
            let inFilledArea = overlay;
            if(!inFilledArea) {
                inFilledArea = clickHelper.isPointInRect(
                    event.x,
                    event.y,
                    fillRect[0],
                    fillRect[0] + fillRect[2],
                    fillRect[1],
                    fillRect[1] + fillRect[3],
                );
            }

            // Find offset along scrollbar. Necessary for overlay mode since
            // pointerPos is relative to the fillRect in that case, not bgRect
            let thisOffset;
            if(overlay) {
                thisOffset = clickHelper.getNormalInRect(
                    event.x,
                    event.y,
                    bgRect[0],
                    bgRect[0] + bgRect[2],
                    bgRect[1],
                    bgRect[1] + bgRect[3],
                )[axisIndex];
            }
            else
                thisOffset = clickHelper.pointerPos[axisIndex];

            if(stateChanged) {
                // If this was outside the filled area, snap scrollbar
                if(!inFilledArea) {
                    const viewportLength = vertical ? this.effectiveHeight : this.effectiveWidth;
                    const childLength = this.child.idealDimensions[axisIndex];
                    const barLength = viewportLength / childLength;
                    scroll[axisIndex] = (thisOffset - barLength / 2) / (1 - barLength);
                    this.scroll = scroll;
                }

                // Drag start, save current scroll and set this scrollbar as
                // being dragged
                this.startingOffset = thisOffset;
                this.startingScroll = scroll[axisIndex];
                this.verticalDragged = vertical;
            }
            else {
                // Drag continue, scroll
                const viewportLength = vertical ? this.effectiveHeight : this.effectiveWidth;
                const childLength = this.child.idealDimensions[axisIndex];
                const barLength = viewportLength / childLength;
                const dragDiff = thisOffset - this.startingOffset;
                scroll[axisIndex] = this.startingScroll + dragDiff / (1 - barLength);
                this.scroll = scroll;
            }

            return true;
        }
        else if(clickState === ClickState.Hover)
            return true;
        else if(stateChanged) {
            // Release this scrollbar
            this.verticalDragged = null;
            return true;
        }

        return false;
    }

    /** Clamp offset in-place to valid scroll values. For internal use only. */
    private clampOffset(offset: [number, number]): void {
        const [childWidth, childHeight] = this.child.idealDimensions;

        const minX = -(childWidth - this.effectiveWidth);
        if(minX >= 0)
            offset[0] = 0;
        else if(offset[0] < minX)
            offset[0] = minX;

        const minY = -(childHeight - this.effectiveHeight);
        if(minY >= 0)
            offset[1] = 0;
        else if(offset[1] < minY)
            offset[1] = minY;
    }

    /**
     * Handle a wheel scroll event. If scrolling fails due to being at the
     * limit, this returns true if the last scroll attempt happened less than
     * 200 milliseconds ago. This behaviour is disabled if
     * {@link PointerWheel#fromDrag} is true.
     *
     * @returns Returns true if this changed scroll was successful
     */
    private handleWheelEvent(event: PointerWheel): boolean {
        const offset = this.offset;
        const [oldX, oldY] = offset;
        const [dx, dy] = event.getDeltaPixels(true, this._scrollLineHeight, this.idealWidth, this.idealHeight);
        offset[0] -= event.shift ? dy : dx;
        offset[1] -= event.shift ? dx : dy;
        this.clampOffset(offset);
        this.offset = offset;
        const [newX, newY] = this.offset;

        const success = newX !== oldX || newY !== oldY;
        const last = this.lastScroll;
        const now = (new Date()).getTime();
        this.lastScroll = now;

        if(success)
            return true;

        if(event.fromDrag)
            return false;

        const elapsed = now - last;
        return elapsed < 200;
    }

    protected updateScrollLineHeight(): void {
        const textHelper = new TextHelper();
        textHelper.font = this.bodyTextFont;
        textHelper.lineHeight = this.bodyTextHeight;
        textHelper.lineSpacing = this.bodyTextSpacing;
        this._scrollLineHeight = textHelper.fullLineHeight;
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null) {
            this._layoutDirty = true;
            this._dirty = true;
        }
        else if(property === 'bodyTextFont' ||
                property === 'bodyTextHeight' ||
                property === 'bodyTextSpacing')
            this.updateScrollLineHeight();
        else if(property === 'scrollBarThickness')
        {
            this._layoutDirty = true;
            this._dirty = true;
        }
        else if(property === 'backgroundFill' ||
                property === 'scrollBarMinPercent' ||
                property === 'scrollBarMinPixels' ||
                property === 'primaryFill' ||
                property === 'accentFill' ||
                property === 'backgroundGlowFill')
            this._dirty = true;
    }

    protected override handleEvent(event: Event): Widget | null {
        // Try to drag a scrollbar if this is a pointer or leave event with no
        // target or target on this. Don't do this if the scrollbars are hidden
        const widthBiCoupled = this.widthCoupling === AxisCoupling.Bi;
        const heightBiCoupled = this.heightCoupling === AxisCoupling.Bi;

        if(this._scrollbarMode !== ScrollbarMode.Hidden &&
           (event instanceof Leave || event instanceof PointerEvent) &&
           (event.target === null || event.target === this)) {
            const [childWidth, childHeight] = this.child.idealDimensions;
            const overlay = this._scrollbarMode === ScrollbarMode.Overlay;
            const forceCorner = !overlay && (!widthBiCoupled && !heightBiCoupled);
            const xNeeded = childWidth > this.idealWidth;
            const yNeeded = childHeight > this.idealHeight;

            let grabbedEvent = false;

            // Only handle event in scrollbar if the scrollbar is shown and
            // needed (layout mode shows unneeded scrollbars)
            if(!widthBiCoupled && (xNeeded || !overlay) &&
               this.handleEventScrollbar(false, yNeeded || forceCorner, event, this.root))
                grabbedEvent = true;

            if(!heightBiCoupled && (yNeeded || !overlay) &&
               this.handleEventScrollbar(true, xNeeded || forceCorner, event, this.root))
                grabbedEvent = true;

            // If the event was grabbed by either scrollbar, capture it
            if(grabbedEvent) {
                // If this is a wheel event, handle it
                if(event instanceof PointerWheel)
                    this.handleWheelEvent(event);

                return this;
            }
        }

        // Pass event along
        const capturer = super.handleEvent(event);

        // If this is an auto-scroll event and it's been captured, then scroll
        // to the capturer's wanted bounds, make the event relative to this
        // scrollable viewport and re-capture it
        if(capturer !== null && event instanceof AutoScroll) {
            const reserve = this._scrollbarMode === ScrollbarMode.Layout;
            const reserveX = reserve && !heightBiCoupled;
            const reserveY = reserve && !widthBiCoupled;
            let clearWidth = this.effectiveWidth;
            let clearHeight = this.effectiveHeight;

            if(!reserveX || !reserveY) {
                const thickness = this.scrollBarThickness;
                const [childWidth, childHeight] = this.child.idealDimensions;
                const xNeeded = childWidth > this.idealWidth;
                const yNeeded = childHeight > this.idealHeight;
                const paintX = this.scrollbarNeedsPaint(false, xNeeded);
                const paintY = this.scrollbarNeedsPaint(true, yNeeded);

                // XXX don't trim clear space if scrollbars are hidden
                if(this._scrollbarMode !== ScrollbarMode.Hidden) {
                    if(!reserveX && paintY)
                        clearWidth = Math.max(0, clearWidth - thickness);
                    if(!reserveY && paintX)
                        clearHeight = Math.max(0, clearHeight - thickness);
                }
            }

            let [cx, cy] = capturer.idealPosition;

            // XXX if a viewport is being used, then the child's coordinates are
            // relative to the viewport widget. convert coordinates so that they
            // are relative to the viewport widget's parent viewport
            let [offsetX, offsetY] = this.offset;
            const oldOffX = offsetX, oldOffY = offsetY;
            if(this.internalViewport.relativeCoordinates) {
                cx += this.idealX + offsetX;
                cy += this.idealY + offsetY;
            }

            let [cl, cr, ct, cb] = event.bounds;
            cl += cx;
            cr += cx;
            ct += cy;
            cb += cy;
            const vpr = this.idealX + clearWidth;
            const vpb = this.idealY + clearHeight;

            // If a tab-selection event occurred, scroll so that widget that got
            // selected is visible. Don't scroll if viewport is smaller than
            // capturer and viewport is inside capturer. Don't scroll if
            // capturer is smaller than viewport and capturer is inside viewport
            const moveX = !widthBiCoupled && !(cl >= this.idealX && cr <= vpr) && !(this.idealX >= cl && vpr <= cr);
            if(moveX) {
                // If child rect is bigger than viewport, then align nearest
                // child rect edge to farthest border of viewport
                // If child rect is smaller than viewport, then align farthest
                // child rect edge to nearest border of viewport
                const rectBiggerThanViewport = cr - cl > clearWidth;
                const rectBeforeViewport = cl < this.idealX;
                const alignLeft = rectBiggerThanViewport !== rectBeforeViewport;
                if(alignLeft)
                    offsetX += this.idealX - cl;
                else
                    offsetX += vpr - cr;
            }

            const moveY = !heightBiCoupled && !(ct >= this.idealY && cb <= vpb) && !(this.idealY >= ct && vpb <= cb);
            if(moveY) {
                const rectBiggerThanViewport = cb - ct > clearHeight;
                const rectBeforeViewport = ct < this.idealY;
                const alignTop = rectBiggerThanViewport !== rectBeforeViewport;
                if(alignTop)
                    offsetY += this.idealY - ct;
                else
                    offsetY += vpb - cb;
            }

            if(moveX || moveY)
                this.offset = [offsetX, offsetY];

            // Correct event bounds to new offset
            // XXX need to use getter instead of [offsetX, offsetY] because the
            // setter clamps the values and therefore the offset may have
            // changed
            const [newOffX, newOffY] = this.offset;
            const offDiffX = newOffX - oldOffX + cx - this.idealX;
            const offDiffY = newOffY - oldOffY + cy - this.idealY;
            event.bounds[0] += offDiffX;
            event.bounds[1] += offDiffX;
            event.bounds[2] += offDiffY;
            event.bounds[3] += offDiffY;

            return this;
        }

        // If this is a wheel event and nobody captured the event, try
        // scrolling. If scrolling did indeed occur, then capture the event.
        if(capturer === null && event instanceof PointerWheel && this.handleWheelEvent(event))
            return this;

        return capturer;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Reserve space for scrollbars if needed
        const thickness = this.scrollBarThickness;
        const reserve = this._scrollbarMode === ScrollbarMode.Layout;

        this.reservedX = reserve && this.heightCoupling !== AxisCoupling.Bi ? thickness : 0;
        this.reservedY = reserve && this.widthCoupling !== AxisCoupling.Bi ? thickness : 0;

        // Resolve dimensions
        super.handleResolveDimensions(minWidth, maxWidth, minHeight, maxHeight);

        // Save dimensions to effective dimensions
        this.effectiveWidth = this.idealWidth;
        this.effectiveHeight = this.idealHeight;

        // Expand dimensions to fit scrollbars
        this.idealWidth = Math.min(Math.max(this.idealWidth + this.reservedX, minWidth), maxWidth);
        this.idealHeight = Math.min(Math.max(this.idealHeight + this.reservedY, minHeight), maxHeight);
    }

    protected override handlePostLayoutUpdate(): void {
        super.handlePostLayoutUpdate();

        // Keep scroll in bounds
        const offset = this.offset;
        this.clampOffset(offset);
        this.offset = offset;
    }

    protected override handlePainting(forced: boolean): void {
        // Check which scrollbars need painting and update forceRePaint flag
        const [childWidth, childHeight] = this.child.idealDimensions;
        const xNeeded = childWidth > this.effectiveWidth;
        const yNeeded = childHeight > this.effectiveHeight;
        const paintX = this.scrollbarNeedsPaint(false, xNeeded);
        const paintY = this.scrollbarNeedsPaint(true, yNeeded);

        if(this.horizWasPainted !== paintX || this.vertWasPainted !== paintY) {
            this.horizWasPainted = paintX;
            this.vertWasPainted = paintY;
            this.forceRePaint = true;
        }
        else if(this.scrollbarMode === ScrollbarMode.Overlay) {
            // XXX overlay mode always needs the child widget to be repainted
            // because the scrollbar could be semi-transparent. if the scrollbar
            // is semi-transparent and the child is painted, then the scrollbar
            // will also be painted, but it will be overpainted, resulting in
            // accumulation of alpha, getting rid of the transparency over time
            this.forceRePaint = true;
        }

        // Paint viewport
        super.handlePainting(forced);

        // Paint scrollbars
        const forceCorner = this._scrollbarMode === ScrollbarMode.Layout &&
                            (this.widthCoupling !== AxisCoupling.Bi
                                && this.heightCoupling !== AxisCoupling.Bi);

        if(paintX)
            this.paintScrollbar(false, xNeeded, yNeeded || forceCorner);
        if(paintY)
            this.paintScrollbar(true, yNeeded, xNeeded || forceCorner);

        // Paint corner if it is forced
        if(forceCorner) {
            const thickness = this.scrollBarThickness;
            const ctx = this.viewport.context;
            ctx.fillStyle = this.backgroundFill;
            ctx.fillRect(
                this.x + this.width - thickness,
                this.y + this.height - thickness,
                thickness,
                thickness,
            );
        }
    }

    /**
     * Get the rectangles (filled and background) of a scrollbar
     *
     * @returns Returns a 2-tuple with 2 4-tuples. The first one is the scrollbar fill rectangle and the second one is the background fill rectangle. Each rectangle 4-tuple contains, respectively, horizontal offset, vertical offset, width and height
     */
    private getScrollbarRects(vertical: boolean, corner: boolean): [Bounds, Bounds] {
        // Calculate basic scrollbar properties
        const overlay = this._scrollbarMode === ScrollbarMode.Overlay;
        const axisIndex = vertical ? 1 : 0;
        const percent = this.scroll[axisIndex];
        const childLength = this.child.idealDimensions[axisIndex];
        const viewportLength = vertical ? this.effectiveHeight : this.effectiveWidth;
        const thickness = Math.min(this.scrollBarThickness, this.width / 2, this.height / 2);
        const minPercent = this.scrollBarMinPercent;
        const minPixels = this.scrollBarMinPixels;

        let viewportLengthCorner = viewportLength;
        if(overlay)
            viewportLengthCorner -= (corner ? thickness : 0);

        const length = Math.min(
            // Make sure scrollbar fill isn't bigger than viewport
            Math.max(
                // Make sure that scrollbar respects the minimum pixel length
                minPixels,
                Math.max(
                    // Make sure that scrollbar respects the minimum percent
                    viewportLength / childLength,
                    minPercent,
                ) * viewportLengthCorner,
            ),
            viewportLength,
        );

        const offset = (viewportLengthCorner - length) * percent;

        // Find rectangle where filled part of scrollbar will be painted
        let sX, sY, sWidth, sHeight;
        if(vertical) {
            sX = this.idealX + this.idealWidth - thickness;
            sY = this.idealY + offset;
            sWidth = thickness;
            sHeight = length;
        }
        else {
            sX = this.idealX + offset;
            sY = this.idealY + this.idealHeight - thickness;
            sWidth = length;
            sHeight = thickness;
        }

        // Find rectangle where background of scrollbar will be painted
        let bgX, bgY, bgWidth, bgHeight;
        if(vertical) {
            bgX = sX;
            bgY = this.idealY;
            bgWidth = thickness;
            bgHeight = viewportLengthCorner;
        }
        else {
            bgX = this.idealX;
            bgY = sY;
            bgWidth = viewportLengthCorner;
            bgHeight = thickness;
        }

        return [
            [sX, sY, sWidth, sHeight],
            [bgX, bgY, bgWidth, bgHeight],
        ];
    }

    /** Check if a scrollbar needs to be painted */
    private scrollbarNeedsPaint(vertical: boolean, needed: boolean): boolean {
        if(this._scrollbarMode === ScrollbarMode.Hidden)
            return false;

        if(!needed && this._scrollbarMode === ScrollbarMode.Overlay)
            return false;

        if(vertical)
            return this.heightCoupling !== AxisCoupling.Bi;
        else
            return this.widthCoupling !== AxisCoupling.Bi;
    }

    /** Paint a scrollbar. For internal use only */
    private paintScrollbar(vertical: boolean, needed: boolean, corner: boolean): void {
        // Get rectangles
        const [fillRect, bgRect] = this.getScrollbarRects(vertical, corner);

        // Paint background if not in overlay mode
        const ctx = this.viewport.context;
        if(this._scrollbarMode !== ScrollbarMode.Overlay) {
            ctx.fillStyle = this.backgroundFill;
            ctx.fillRect(...bgRect);
        }

        // Paint filled part of scrollbar
        if(needed) {
            const clickHelper = this.getClickHelper(vertical);
            switch(clickHelper.clickState) {
                case ClickState.Released:
                    ctx.fillStyle = this.primaryFill;
                    break;
                case ClickState.Hover:
                case ClickState.Hold:
                    ctx.fillStyle = this.accentFill;
                    break;
            }
        }
        else
            ctx.fillStyle = this.backgroundGlowFill;

        ctx.fillRect(...fillRect);
    }
}