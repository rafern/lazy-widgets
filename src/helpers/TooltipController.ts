import { type TooltipContainer } from '../widgets/TooltipContainer.js';
import { type Widget } from '../widgets/Widget.js';
import { BaseTooltipController } from './BaseTooltipController.js';

/**
 * The default implementation of {@link BaseTooltipController}. Used by
 * {@link TooltipContainer}, which lets you provide an anchor point to position
 * the tooltip around.
 */
export class TooltipController<W extends Widget = Widget, C extends TooltipContainer = TooltipContainer> extends BaseTooltipController<W, C, readonly [relAnchorX: number, relAnchorY: number]> {
    override addLayer(relAnchorPos: readonly [x: number, y: number]): boolean {
        const added = super.addLayer(relAnchorPos);

        if (added) {
            // get anchor pos and this widget relative to layerered container.
            // update tooltip widget with these positions
            [this.tooltipContainer.anchorX, this.tooltipContainer.anchorY] = this.tooltipWrapper.queryPointFromHere(relAnchorPos[0], relAnchorPos[1], this.topLayeredContainer!);
            this.updateTooltipRect();
        }

        return added;
    }

    protected override doTooltipRectUpdate() {
        this.tooltipContainer.tooltipRect = this.tooltipWrapper.queryRectFromHere(this.tooltipWrapper.idealRect, this.topLayeredContainer!);
    }
}
