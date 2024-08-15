import { BareWidgetXMLInputConfig } from '../xml/BareWidgetXMLInputConfig.js';
import { Widget, WidgetProperties } from './Widget.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';

/**
 * A widget with empty space.
 *
 * Will always try to expand if the layout is constrained, so make sure to set
 * flex or pass it along the constructor
 *
 * @category Widget
 */
export class Spacing extends Widget {
    static override autoXML: WidgetAutoXML = {
        name: 'spacing',
        inputConfig: BareWidgetXMLInputConfig
    };

    constructor(properties?: Readonly<WidgetProperties>) {
        // default properties
        properties = {
            flex: 1,
            ...properties
        };

        // Spacing needs clear, never has children and doesn't propagate events
        super(properties);
    }

    protected override handleResolveDimensions(minWidth: number, _maxWidth: number, minHeight: number, _maxHeight: number): void {
        // Try to expand each axis
        this.idealWidth = minWidth;
        this.idealHeight = minHeight;
    }
}
