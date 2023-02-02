import { Label } from './Label';
import { Tooltip } from './Tooltip';
import { TooltipBox } from './TooltipBox';
import type { Widget, WidgetProperties } from './Widget';

export class TextTooltip<W extends Widget = Widget> extends Tooltip<W, TooltipBox<Label>> {
    constructor(child: W, tooltipText: string, properties?: Readonly<WidgetProperties>) {
        super(
            child,
            new TooltipBox(
                new Label(
                    tooltipText,
                    {
                        wrapText: false
                    }
                )
            ),
            properties
        )
    }
}
