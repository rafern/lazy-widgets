import { safeRoundRect } from '../helpers/safeRoundRect.js';
import { PassthroughWidget } from './PassthroughWidget.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';

import type { Rect } from '../helpers/Rect.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';

/**
 * A container widget that rounds the corners of a child widget.
 *
 * @category Widget
 */
export class RoundedCorners<W extends Widget = Widget> extends PassthroughWidget<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'rounded-corners',
        inputConfig: SingleParentXMLInputConfig
    };

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, properties);
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'roundedCornersRadii') {
            this.markWholeAsDirty();
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint brackground
        const ctx = this.viewport.context;
        ctx.save();
        ctx.beginPath();

        safeRoundRect(ctx, this.x, this.y, this.width, this.height, this.roundedCornersRadii);
        ctx.clip();

        super.handlePainting(dirtyRects);

        ctx.restore();
    }
}
