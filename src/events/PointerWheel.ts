import { FocusType } from '../core/FocusType';
import { PointerEvent } from './PointerEvent';
import { Widget } from '../widgets/Widget';
import { DynMsg } from '../core/Strings';

/**
 * The scrolling mode that determines how the {@link PointerWheel#deltaX},
 * {@link PointerWheel#deltaY} and {@link PointerWheel#deltaZ} values are
 * interpreted.
 */
export enum PointerWheelMode {
    /** In this mode, delta values are measured in pixels. */
    Pixel,
    /**
     * In this mode, delta values are measured in line heights. The height of a
     * line is supplied as an argument to the
     * {@link PointerWheel#getDeltaPixels} method.
     */
    Line,
    /**
     * In this mode, delta values are measured in {@link Widget} dimensions,
     * minus {@link PointerWheel.PageLinesError | a few lines} or
     * {@link PointerWheel.PagePercentError | a percentage of the dimensions},
     * whichever is smaller. Both line height and dimensions are supplied as
     * arguments to the {@link PointerWheel#getDeltaPixels} method.
     */
    Page,
}

/**
 * Convert DOM WheelEvent.deltaMode to {@link PointerWheelMode}, or null if the
 * DOM delta mode is unknown.
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
export class PointerWheel extends PointerEvent {
    /**
     * Wheel event horizontal scroll amount. Not an integer. The value's
     * interpretation depends on {@link PointerWheel#deltaMode}.
     */
    readonly deltaX: number;
    /**
     * Wheel event vertical scroll amount. Not an integer. The value's
     * interpretation depends on {@link PointerWheel#deltaMode}.
     */
    readonly deltaY: number;
    /**
     * Wheel event depth scroll amount. Not an integer. The value's
     * interpretation depends on {@link PointerWheel#deltaMode}.
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

    /** Create a new PointerWheel. */
    constructor(x: number, y: number, deltaX: number, deltaY: number, deltaZ: number, deltaMode: PointerWheelMode, fromDrag: boolean, shift: boolean, ctrl: boolean, alt: boolean, target: Widget | null = null) {
        super(x, y, shift, ctrl, alt, target, FocusType.Pointer);
        this.deltaX = deltaX;
        this.deltaY = deltaY;
        this.deltaZ = deltaZ;
        this.deltaMode = deltaMode;
        this.fromDrag = fromDrag;
    }

    correctOffset(xOffset: number, yOffset: number): PointerWheel {
        return new PointerWheel(this.x - xOffset, this.y - yOffset, this.deltaX, this.deltaY, this.deltaZ, this.deltaMode, this.fromDrag, this.shift, this.ctrl, this.alt, this.target);
    }

    cloneWithTarget(target: Widget | null): PointerWheel {
        return new PointerWheel(this.x, this.y, this.deltaX, this.deltaY, this.deltaZ, this.deltaMode, this.fromDrag, this.shift, this.ctrl, this.alt, target);
    }

    /**
     * Get the scroll delta in pixels, even if the
     * {@link PointerWheel#deltaMode} is not {@link PointerWheelMode.Pixel}.
     *
     * @param forceLimit - Should the delta be limited by {@link PointerWheel.PageLinesError} and {@link PointerWheel.PagePercentError}, if {@link PointerWheel#deltaMode} is not {@link PointerWheelMode.Page}?
     * @param lineHeight - The full height (line height with spacing) of a line, used for page {@link PointerWheel#deltaMode}, or for limiting the delta
     * @param containerWidth - The width of the container, used for page {@link PointerWheel#deltaMode}, or for limiting the delta
     * @param containerHeight - The height of the container, used for page {@link PointerWheel#deltaMode}, or for limiting the delta
     * @param containerDepth - The depth of the container, used for page {@link PointerWheel#deltaMode}, or for limiting the delta. Only used for custom containers/widgets with a Z-axis
     * @returns Returns a 3-tuple containing the x, y and z components, repectively, of the wheel event in pixels.
     */
    getDeltaPixels(forceLimit: boolean, lineHeight: number, containerWidth: number, containerHeight: number, containerDepth = 0): [x: number, y: number, z: number] {
        let limitX = Infinity, limitY = Infinity, limitZ = Infinity;
        if(forceLimit || this.deltaMode !== PointerWheelMode.Page) {
            const linesError = lineHeight * PointerWheel.PageLinesError;
            limitX = containerWidth - Math.min(containerWidth * PointerWheel.PagePercentError, linesError);
            limitY = containerHeight - Math.min(containerHeight * PointerWheel.PagePercentError, linesError);
            limitZ = containerDepth - Math.min(containerDepth * PointerWheel.PagePercentError, linesError);
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
                const linesError = lineHeight * PointerWheel.PageLinesError;
                return [
                    (Math.abs(this.deltaX) * containerWidth - Math.min(containerWidth * PointerWheel.PagePercentError, linesError)) * Math.sign(this.deltaX),
                    (Math.abs(this.deltaY) * containerHeight - Math.min(containerHeight * PointerWheel.PagePercentError, linesError)) * Math.sign(this.deltaY),
                    (Math.abs(this.deltaZ) * containerDepth - Math.min(containerDepth * PointerWheel.PagePercentError, linesError)) * Math.sign(this.deltaZ)
                ];
            }
            default:
                throw new Error(DynMsg.INVALID_ENUM(this.deltaMode, 'PointerWheelMode', 'deltaMode'));
        }
    }
}
