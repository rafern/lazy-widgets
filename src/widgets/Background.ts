import { BaseContainer } from './BaseContainer';
import type { Widget, WidgetProperties } from './Widget';

export class Background<W extends Widget = Widget> extends BaseContainer<W> {
    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, true, properties);
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null) {
            // TODO send dirty rect to entire widget space
        } else if(property === 'canvasFill') {
            // TODO send dirty rect to entire widget space
        }
    }

    protected override handlePainting(forced: boolean): void {
        // Paint brackground
        const ctx = this.viewport.context;
        ctx.save();
        ctx.fillStyle = this.canvasFill;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();

        super.handlePainting(forced);
    }
}
