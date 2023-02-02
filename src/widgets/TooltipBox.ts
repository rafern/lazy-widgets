import { Widget, WidgetProperties } from './Widget';
import { Alignment } from '../theme/Alignment';
import { SingleParent } from './SingleParent';
import type { Event } from '../events/Event';
import type { Rect } from '../helpers/Rect';
import { resolveContainerDimensions } from '../helpers/resolveContainerDimensions';
import { resolveContainerPosition } from '../helpers/resolveContainerPosition';
import { Alignment2D } from '../theme/Alignment2D';
import { safeRoundRect } from '../helpers/safeRoundRect';
import { layoutArrayField, layoutField } from '../decorators/FlagFields';

const startAlignment = <Alignment2D>{
    horizontal: Alignment.Start, vertical: Alignment.Start
};

/**
 * A container widget for a widget that will be shown when a {@link Tooltip} is
 * hovered.
 *
 * @category Widget
 */
export class TooltipBox<W extends Widget = Widget> extends SingleParent<W> {
    @layoutField
    cursorX = 0;
    @layoutField
    cursorY = 0;
    @layoutArrayField(false)
    tooltipRect: Rect = [0, 0, 0, 0];

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, false, properties);
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'tooltipPadding') {
            this._layoutDirty = true;
            this.markWholeAsDirty();
        } else if (property === 'tooltipFill' || property === 'tooltipRadii') {
            this.markWholeAsDirty();
        }
    }

    protected override handleEvent(_event: Event): null {
        // ignore all events. tooltips are not interactible
        return null;
    }

    protected override handlePreLayoutUpdate(): void {
        // Pre-layout update child
        const child = this.child;
        child.preLayoutUpdate();

        // If child's layout is dirty, set self's layout as dirty
        if(child.layoutDirty) {
            this._layoutDirty = true;
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update child
        this.child.postLayoutUpdate();
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        [this.idealWidth, this.idealHeight] = resolveContainerDimensions(minWidth, maxWidth, minHeight, maxHeight, this.tooltipPadding, startAlignment, this.child);
    }

    override resolvePosition(x: number, y: number): void {
        // resolve best alignment that places the child under (or over) the
        // cursor
        // check if there is space above or below the wrapper widget
        let pX = 0;
        let pY = 0;
        let pW = Infinity;
        let pH = Infinity;
        const [_wX, wY, _wW, wH] = this.tooltipRect;

        if (this._parent) {
            [pX, pY, pW, pH] = this._parent.idealRect;
        }

        const spaceAbove = Math.max(wY - pY, 0);
        const pBot = pY + pH;
        const wBot = wY + wH;
        const spaceBelow = Math.max(pBot - wBot, 0);

        // decide whether to place tooltip above or below widget. fall back to
        // above the widget
        const fitsAbove = spaceAbove >= this.idealHeight;
        const fitsBelow = spaceBelow >= this.idealHeight;

        if (fitsAbove && fitsBelow) {
            if (this.cursorY <= (wY + 0.5 * wH)) {
                // put above
                y = wY - this.idealHeight;
            } else {
                // put below
                y = wBot;
            }
        } else if (fitsAbove) {
            // put above
            y = wY - this.idealHeight;
        } else if (fitsBelow) {
            // put below
            y = wBot;
        } else {
            // put on cursor
            y = this.cursorY;
        }

        x = this.cursorX;

        // clamp to bounds of parent
        const pRight = pX + pW;
        if (x + this.idealWidth > pRight) {
            x = pRight - this.idealWidth;
        }
        if (y + this.idealHeight > pBot) {
            y = pBot - this.idealHeight;
        }
        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }

        super.resolvePosition(x, y);

        resolveContainerPosition(x, y, this.idealWidth, this.idealHeight, this.tooltipPadding, startAlignment, this.child);
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        const ctx = this.viewport.context;

        ctx.save();

        ctx.beginPath();
        safeRoundRect(ctx, this.idealX, this.idealY, this.idealWidth, this.idealHeight, this.tooltipRadii);
        ctx.clip();
        ctx.fillStyle = this.tooltipFill;
        ctx.fillRect(this.idealX, this.idealY, this.idealWidth, this.idealHeight);
        this.child.paint(dirtyRects);

        ctx.restore();
    }
}
