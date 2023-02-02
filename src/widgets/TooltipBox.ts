import { Widget, WidgetProperties } from './Widget';
import { Alignment } from '../theme/Alignment';
import { SingleParent } from './SingleParent';
import type { Event } from '../events/Event';
import type { Rect } from '../helpers/Rect';
import { resolveContainerDimensions } from '../helpers/resolveContainerDimensions';
import { resolveContainerPosition } from '../helpers/resolveContainerPosition';
import { Alignment2D } from '../theme/Alignment2D';
import { safeRoundRect } from '../helpers/safeRoundRect';
import { layoutField } from '../decorators/FlagFields';

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
        super.resolvePosition(x, y);

        // resolve best alignment that places the child under (or over) the
        // cursor
        // TODO

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
