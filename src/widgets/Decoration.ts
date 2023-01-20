import type { CanvasViewport } from '../core/CanvasViewport';
import type { Rect } from '../helpers/Rect';
import { AxisCoupling } from './AxisCoupling';
import { ViewportWidget } from './ViewportWidget';
import type { Widget, WidgetProperties } from './Widget';

export class Decoration<W extends Widget = Widget> extends ViewportWidget<W> {
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, {
            ...properties,
            useCanvas: true,
            widthCoupling: AxisCoupling.Bi,
            heightCoupling: AxisCoupling.Bi,
        });
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // paint child to internal viewport
        const internalViewport = this.internalViewport as CanvasViewport;
        internalViewport.receiveTopDamage(dirtyRects);
        internalViewport.paintToInternal();

        // apply decoration to canvas, and paint it to the real viewport
        const ctx = this.viewport.context;
        ctx.save();
        // ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        // ctx.rotate(Math.PI / 4);
        // ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'red';
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(internalViewport.canvas, this.x, this.y);
        ctx.restore();
    }
}
