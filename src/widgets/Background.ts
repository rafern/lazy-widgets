import type { Rect } from '../helpers/Rect';
import { SingleParentAutoXML } from '../xml/SingleParentAutoXML';
import { BaseContainer } from './BaseContainer';
import type { Widget, WidgetProperties } from './Widget';

/**
 * A container widget that adds a background color.
 *
 * @category Widget
 */
export class Background<W extends Widget = Widget> extends BaseContainer<W> {
    static override autoXML = SingleParentAutoXML;

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, true, properties);
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'canvasFill') {
            this.markWholeAsDirty();
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint brackground
        const ctx = this.viewport.context;
        ctx.save();
        ctx.fillStyle = this.canvasFill;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();

        super.handlePainting(dirtyRects);
    }
}
