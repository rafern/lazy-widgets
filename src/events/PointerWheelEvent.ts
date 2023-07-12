import { FocusType } from '../core/FocusType.js';
import { PointerEvent } from './PointerEvent.js';
import { Widget } from '../widgets/Widget.js';
import { DynMsg } from '../core/Strings.js';
import type { SourcePointer } from '../drivers/SourcePointer.js';
/**
 * The scrolling mode that determines how the {@link PointerWheelEvent#deltaX},
 * {@link PointerWheelEvent#deltaY} and {@link PointerWheelEvent#deltaZ} values
 * are interpreted.
 *
 * @category Event
 */
export enum PointerWheelMode {
    /** In this mode, delta values are measured in pixels. */
    Pixel,
    /**
     * In this mode, delta values are measured in line heights. The height of a
     * line is supplied as an argument to the
     * {@link PointerWheelEvent#getDeltaPixels} method.
     */
    Line,
    /**
     * In this mode, delta values are measured in {@link Widget} dimensions,
     * minus {@link PointerWheelEvent.PageLinesError | a few lines} or
     * {@link PointerWheelEvent.PagePercentError | a percentage of the dimensions},
     * whichever is smaller. Both line height and dimensions are supplied as
     * arguments to the {@link PointerWheelEvent#getDeltaPixels} method.
     */
    Page,
}

/**
 * Convert DOM WheelEvent.deltaMode to {@link PointerWheelMode}, or null if the
 * DOM delta mode is unknown.
 *
 * @category Event
 */
export function parseDOMDeltaMode(domDeltaMode: number): PointerWheelMode | null {
    switch(domDeltaMode) {
    case 0:
        return PointerWheelMode.Pixel;
    case 1:
        return PointerWheelMode.Line;
    case 2:
        return PointerWheelMode.Page;
    default:
        return null;
    }
}

/**
 * A pointer wheel {@link PointerEvent}.
 *
 * Has a focus type of {@link FocusType.Pointer} and does not need focus.
 *
 * @category Event
 */
export class PointerWheelEvent extends PointerEvent {
    static override readonly type = 'pointer-wheel';
    override readonly type: typeof PointerWheelEvent.type;
    override readonly focusType: FocusType.Pointer;
    /**
     * Wheel event horizontal scroll amount. Not an integer. The value's
     * interpretation depends on {@link PointerWheelEvent#deltaMode}.
     */
    readonly deltaX: number;
    /**
     * Wheel event vertical scroll amount. Not an integer. The value's
     * interpretation depends on {@link PointerWheelEvent#deltaMode}.
     */
    readonly deltaY: number;
    /**
     * Wheel event depth scroll amount. Not an integer. The value's
     * interpretation depends on {@link PointerWheelEvent#deltaMode}.
     */
    readonly deltaZ: number;
    /**
     * The mode of the delta values; how the delta values should be
     * interpreted. See {@link PointerWheelMode}
     */
    readonly deltaMode: PointerWheelMode;
    /** Was this wheel event created from a pointer drag? */
    readonly fromDrag: boolean;

    /** The amount of lines to remove from a page scroll */
    static readonly PageLinesError = 3;
    /** The percentage of a page to remove from a page scroll */
    static readonly PagePercentError = 0.1;

    constructor(x: number, y: number, deltaX: number, deltaY: number, deltaZ: number, deltaMode: PointerWheelMode, fromDrag: boolean, shift: boolean, ctrl: boolean, alt: boolean, source: SourcePointer | null, target: Widget | null = null) {
        super(x, y, shift, ctrl, alt, source, target);

        this.type = PointerWheelEvent.type;
        this.focusType = FocusType.Pointer;
        this.deltaX = deltaX;
        this.deltaY = deltaY;
        this.deltaZ = deltaZ;
        this.deltaMode = deltaMode;
        this.fromDrag = fromDrag;
    }

    correctOffset(xOffset: number, yOffset: number): PointerWheelEvent {
        return new PointerWheelEvent(this.x - xOffset, this.y - yOffset, this.deltaX, this.deltaY, this.deltaZ, this.deltaMode, this.fromDrag, this.shift, this.ctrl, this.alt, this.source, this.target);
    }

    cloneWithTarget(target: Widget | null): PointerWheelEvent {
        return new PointerWheelEvent(this.x, this.y, this.deltaX, this.deltaY, this.deltaZ, this.deltaMode, this.fromDrag, this.shift, this.ctrl, this.alt, this.source, target);
    }

    /**
     * Get the scroll delta in pixels, even if the
     * {@link PointerWheelEvent#deltaMode} is not
     * {@link PointerWheelMode.Pixel}.
     *
     * @param forceLimit - Should the delta be limited by {@link PointerWheelEvent.PageLinesError} and {@link PointerWheelEvent.PagePercentError}, if {@link PointerWheelEvent#deltaMode} is not {@link PointerWheelMode.Page}?
     * @param lineHeight - The full height (line height with spacing) of a line, used for page {@link PointerWheelEvent#deltaMode}, or for limiting the delta
     * @param containerWidth - The width of the container, used for page {@link PointerWheelEvent#deltaMode}, or for limiting the delta
     * @param containerHeight - The height of the container, used for page {@link PointerWheelEvent#deltaMode}, or for limiting the delta
     * @param containerDepth - The depth of the container, used for page {@link PointerWheelEvent#deltaMode}, or for limiting the delta. Only used for custom containers/widgets with a Z-axis
     * @returns Returns a 3-tuple containing the x, y and z components, repectively, of the wheel event in pixels.
     */
    getDeltaPixels(forceLimit: boolean, lineHeight: number, containerWidth: number, containerHeight: number, containerDepth = 0): [x: number, y: number, z: number] {
        let limitX = Infinity, limitY = Infinity, limitZ = Infinity;
        if(forceLimit || this.deltaMode !== PointerWheelMode.Page) {
            const linesError = lineHeight * PointerWheelEvent.PageLinesError;
            limitX = containerWidth - Math.min(containerWidth * PointerWheelEvent.PagePercentError, linesError);
            limitY = containerHeight - Math.min(containerHeight * PointerWheelEvent.PagePercentError, linesError);
            limitZ = containerDepth - Math.min(containerDepth * PointerWheelEvent.PagePercentError, linesError);
        }

        switch(this.deltaMode) {
        case PointerWheelMode.Pixel:
            return [
                Math.min(limitX, Math.abs(this.deltaX)) * Math.sign(this.deltaX),
                Math.min(limitY, Math.abs(this.deltaY)) * Math.sign(this.deltaY),
                Math.min(limitZ, Math.abs(this.deltaZ)) * Math.sign(this.deltaZ)
            ];
        case PointerWheelMode.Line:
            return [
                Math.min(limitX, Math.abs(this.deltaX) * lineHeight) * Math.sign(this.deltaX),
                Math.min(limitY, Math.abs(this.deltaY) * lineHeight) * Math.sign(this.deltaY),
                Math.min(limitZ, Math.abs(this.deltaZ) * lineHeight) * Math.sign(this.deltaZ)
            ];
        case PointerWheelMode.Page:
        {
            const linesError = lineHeight * PointerWheelEvent.PageLinesError;
            return [
                (Math.abs(this.deltaX) * containerWidth - Math.min(containerWidth * PointerWheelEvent.PagePercentError, linesError)) * Math.sign(this.deltaX),
                (Math.abs(this.deltaY) * containerHeight - Math.min(containerHeight * PointerWheelEvent.PagePercentError, linesError)) * Math.sign(this.deltaY),
                (Math.abs(this.deltaZ) * containerDepth - Math.min(containerDepth * PointerWheelEvent.PagePercentError, linesError)) * Math.sign(this.deltaZ)
            ];
        }
        default:
            throw new Error(DynMsg.INVALID_ENUM(this.deltaMode, 'PointerWheelMode', 'deltaMode'));
        }
    }
}
