import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import { BaseContainer } from './BaseContainer.js';

import type { Rect } from '../helpers/Rect.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';

/**
 * A container widget that adds a background color.
 *
 * @category Widget
 */
export class Background<W extends Widget = Widget> extends BaseContainer<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'background',
        inputConfig: SingleParentXMLInputConfig
    };

    constructor(child: W, properties?: Readonly<WidgetProperties>) {
        super(child, properties);
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
