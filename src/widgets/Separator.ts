import { Spacing } from './Spacing';
import type { SpacingProperties } from './Spacing';
import type { Rect } from '../helpers/Rect';

/**
 * A {@link Spacing} with a colored background, where the color is the same as
 * the theme's text color.
 *
 * @category Widget
 */
export class Separator extends Spacing {
    constructor(properties?: Readonly<SpacingProperties>) {
        super({
            minWidth: 1,
            minHeight: 1,
            ...properties
        });
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'bodyTextFill') {
            this.markWholeAsDirty();
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint brackground
        const ctx = this.viewport.context;
        ctx.save();
        ctx.fillStyle = this.bodyTextFill;
        ctx.fillRect(this.x, this.y, this.idealWidth, this.idealHeight);
        ctx.restore();

        super.handlePainting(dirtyRects);
    }
}
