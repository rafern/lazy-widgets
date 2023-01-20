import type { Rect } from '../helpers/Rect';
import { PassthroughWidget } from './PassthroughWidget';
import type { Widget, WidgetProperties } from './Widget';

// XXX firefox doesn't support CanvasRenderingContext2D.roundRect; add polyfill
import 'canvas-roundrect-polyfill';

export class RoundedCorners<W extends Widget = Widget> extends PassthroughWidget<W> {
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, properties);
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint brackground
        const ctx = this.viewport.context;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, this.roundedCornersRadii);
        ctx.clip();

        super.handlePainting(dirtyRects);

        ctx.restore();
    }
}
