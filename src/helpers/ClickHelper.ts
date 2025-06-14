import { PointerReleaseEvent } from '../events/PointerReleaseEvent.js';
import { GenericClickHelper } from './GenericClickHelper.js';
import { PointerPressEvent } from '../events/PointerPressEvent.js';
import { PointerEvent } from '../events/PointerEvent.js';
import { FocusType } from '../core/FocusType.js';
import { ClickState } from './ClickState.js';
import { LeaveEvent } from '../events/LeaveEvent.js';
import type { TricklingEvent } from '../events/TricklingEvent.js';
import type { Root } from '../core/Root.js';
import type { Bounds } from './Bounds.js';

/**
 * An aggregate helper class for widgets that can be clicked.
 *
 * Keeps its current click state as well as its last click state, last pointer
 * position and whether the last click state change resulted in an actual click.
 *
 * @category Helper
 */
export class ClickHelper extends GenericClickHelper {
    /**
     * Last pointer position in normalised coordinates ([0,0] to [1,1]). If
     * there is no last pointer position, such as after a leave event, this will
     * be null. If pointer position was outside box, it will be beyond the [0,0]
     * to [1,1] range.
     */
    pointerPos: [number, number] | null = null;
    /**
     * Like {@link ClickHelper#pointerPos}, but only updated when a hold state
     * begins.
     *
     * Useful for implementing draggable widgets.
     */
    startingPointerPos: [number, number] | null = null;
    /** Which pointer button should count as a click? Left button by default */
    pointerButton = 0;

    /**
     * Normalise pointer coordinates inside a rectangle
     *
     * @param pX - Pointer X coordinate, in pixels
     * @param pY - Pointer Y coordinate, in pixels
     * @param rLeft - Rectangle's left coordinate, in pixels
     * @param rRight - Rectangle's right coordinate, in pixels
     * @param rTop - Rectangle's top coordinate, in pixels
     * @param rBottom - Rectangle's bottom coordinate, in pixels
     * @returns Returns normalised coordinates
     */
    getNormalInRect(pX: number, pY: number, rLeft: number, rRight: number, rTop: number, rBottom: number): [number, number] {
        return [(pX - rLeft) / (rRight - rLeft), (pY - rTop) / (rBottom - rTop)];
    }

    /**
     * Check if a point, in pixels, is inside a rectangle.
     *
     * @param pX - Pointer X coordinate, in pixels
     * @param pY - Pointer Y coordinate, in pixels
     * @param rLeft - Rectangle's left coordinate, in pixels
     * @param rRight - Rectangle's right coordinate, in pixels
     * @param rTop - Rectangle's top coordinate, in pixels
     * @param rBottom - Rectangle's bottom coordinate, in pixels
     * @returns Returns true if [pX, pY] is inside the rectangle, else, false
     */
    isPointInRect(pX: number, pY: number, rLeft: number, rRight: number, rTop: number, rBottom: number): boolean {
        return pX >= rLeft && pX < rRight && pY >= rTop && pY < rBottom;
    }

    /**
     * Check if a normalised point is inside a rectangle.
     *
     * Since the coordinates are normalised, you don't have to define the
     * coordinates of the rectangle, which may seem counterintuitive.
     *
     * @param pX - Pointer X coordinate, normalised
     * @param pY - Pointer Y coordinate, normalised
     * @returns Returns true if [pX, pY] is inside the rectangle, else, false
     */
    isNormalInRect(pX: number, pY: number): boolean {
        return pX >= 0 && pX < 1 && pY >= 0 && pY < 1;
    }

    /**
     * Updates the current {@link GenericClickHelper#clickState} given an event,
     * as well as {@link Root#_foci | focus}, and requests pointer styles when
     * necessary.
     *
     * @param bounds - A 4-tuple containing, respectively, left coordinate, right coordinate, top coordinate and bottom coordinate of clickable area, in pixels
     */
    handleClickEvent(event: TricklingEvent, root: Root, bounds: Bounds): void {
        // TODO make bounds readonly
        if(event.isa(LeaveEvent)) {
            // Drop focus on this widget if this is a leave event
            root.dropFocus(FocusType.Pointer, this.widget);
            root.clearPointerStyle(this.widget, this);
            this.pointerPos = null;
            return this.setClickState(ClickState.Released, false);
        } else if(event instanceof PointerEvent) {
            // Normalise pointer coordinates in click area
            this.pointerPos = this.getNormalInRect(event.x, event.y, ...bounds);

            // If pointer is over the clickable rectangle, then change the
            // pointer style, else, if not targeted, drop focus
            const inside = this.isNormalInRect(...this.pointerPos);
            if(inside) {
                root.requestPointerStyle(this.widget, 'pointer', this);
            } else {
                root.clearPointerStyle(this.widget, this);

                if(event.target === null) {
                    root.dropFocus(FocusType.Pointer, this.widget);
                    return this.setClickState(ClickState.Released, false);
                }
            }

            // If this is a press event, request focus and set starting
            // pointer coordinates. Ignore if wrong button
            if(event.isa(PointerPressEvent) && event.button === this.pointerButton) {
                this.startingPointerPos = this.pointerPos;
                root.requestFocus(FocusType.Pointer, this.widget);
                return this.setClickState(ClickState.Hold, inside);
            }

            // If this is a release event, drop focus. Ignore if wrong button
            if(event.isa(PointerReleaseEvent) && event.button === this.pointerButton) {
                root.dropFocus(FocusType.Pointer, this.widget);
                if(inside) {
                    return this.setClickState(ClickState.Hover, inside);
                } else {
                    return this.setClickState(ClickState.Released, inside);
                }
            }

            // If event was focused, then it's a hold, else, it's a hover
            if(event.target === null) {
                return this.setClickState(ClickState.Hover, inside);
            } else {
                return this.setClickState(ClickState.Hold, inside);
            }
        }
    }

    override reset(): void {
        super.reset();
        this.pointerPos = null;
        this.startingPointerPos = null;
        this.pointerButton = 0;

        if (this.widget.attached) {
            const root = this.widget.root;
            root.dropFocus(FocusType.Pointer, this.widget);
            root.clearPointerStyle(this.widget, this);
        }
    }
}
