import type { LayoutConstraints } from './LayoutConstraints.js';
import type { Widget } from '../widgets/Widget.js';
import type { TricklingEvent } from '../events/TricklingEvent.js';
import type { Rect } from '../helpers/Rect.js';
import { type BackingCanvasContext } from '../helpers/BackingCanvas.js';

/**
 * Viewports are constrained rectangles that can be painted to. Viewports have a
 * rendering context associated with them, either by inheriting them from a
 * parent Viewport, or by having an internal canvas.
 *
 * @category Core
 */
export interface Viewport {
    /**
     * The coordinate system used for this Viewport. If true, then coordinates
     * are relative to the Viewport itself ({@link Viewport#child} always has a
     * position of 0,0). If false, then coordinates are absolute (relative to
     * the nearest relative parent Viewport, or topmost Viewport, or 0,0 if this
     * is the topmost Viewport).
     */
    readonly relativeCoordinates: boolean;
    /** The Viewport's child. Painting and layout will be relative to this. */
    readonly child: Widget;
    /**
     * The render target's (canvas) 2D context. Alpha is enabled.
     *
     * Note that readonly in this context means that this property is a getter,
     * not that it is immutable. Ideally, this is a getter that gets the current
     * rendering context. Some Viewport implementations (such as
     * {@link CanvasViewport}) will always use the same context, while others
     * (such as {@link ClippedViewport}) will occasionally change the context.
     */
    readonly context: BackingCanvasContext;
    /**
     * Layout constraints of viewport when resolving widget's layout. A 4-tuple
     * containing, respectively, minimum width, maximum width, minimum height
     * and maximum height.
     *
     * By default, has no minimum width nor height and unconstrained maximum
     * width and height.
     */
    constraints: LayoutConstraints;
    /**
     * The actual dimensions and position of the viewport, relative to the
     * parent Viewport (or the UI {@link Root} if there is no parent Viewport,
     * meaning that positions are absolute in that case); for example, this
     * would be the equivalent to an iframe's dimensions and position (the HTML
     * body in the iframe can have different dimensions than the iframe itself
     * and be scrolled by some amount).
     *
     * Do not use this value for resolving the layout. Only use this for event
     * handling or other logic that doesn't affect layout.
     *
     * Should be set by the owner of the Viewport (a {@link Root} or a
     * {@link ViewportWidget}) when finalizing layout.
     */
    rect: Rect;
    /**
     * Get the canvas scale that will be applied to the Viewport's child. Used
     * for checking whether a child's dimensions exceeds a canvas' maximum
     * dimensions.
     *
     * Note that readonly in this context means that this property is a getter,
     * not that it is immutable. Ideally, this is a getter that calculates the
     * effective scale of the viewport via the canvas dimensions and max
     * dimensions, which may returns different values, not the same value every
     * time.
     */
    readonly effectiveScale: [scaleX: number, scaleY: number];
    // TODO ^^^ remove readonly once typescript ~~stops being bad~~ introduces
    // getters in interfaces
    /**
     * The parent Viewport of this Viewport. Since positions are relative to
     * this, absolute positions can be calculated by following all the parents.
     *
     * If null, this is the topmost Viewport and owned by the UI {@link Root}.
     *
     * Should be set by the owner when the owner is attached or detached.
     */
    parent: Viewport | null;
    /**
     * The offset of the child inside the Viewport. Depending on the Viewport
     * implementation, this may update the actual position of the child Widget,
     * or it may just affect how the {@link paint} method behaves.
     */
    offset: [x: number, y: number];

    /**
     * Resolves the Viewport child's layout (including position) in one call,
     * using the previous position.
     *
     * @returns Returns true if the child was resized, else, false.
     */
    resolveLayout(): boolean;
    /**
     * Paint the {@link Viewport#child} to the {@link Viewport#context} and, if
     * it makes sense to do so, paint to the {@link Viewport#parent} Viewport's
     * context.
     *
     * Nothing is done if the child was not re-painted.
     *
     * @param extraDirtyRects - Extra damage regions (not tracked internally) that need to be repainted. Can be an empty list if this is a root viewport.
     * @returns Returns true if the child was re-painted, else, false.
     */
    paint(extraDirtyRects: Array<Rect>): boolean;
    /**
     * Dispatch an event to the Viewport's {@link Viewport#child}. Only
     * {@link TricklingEvent} is supported.
     *
     * @param event - The event to dispatch down the UI tree
     * @returns Returns the widget that captured the event or null if none captured the event.
     */
    dispatchTricklingEvent(event: TricklingEvent): Widget | null;
    /**
     * Mark a rectangle relative to this viewport as dirty.
     *
     * @param rect - A rectangle with the area that was marked as dirty
     */
    markDirtyRect(rect: Rect): void;
}
