import { BareWidgetXMLInputConfig } from '../xml/BareWidgetXMLInputConfig.js';
import { Widget, WidgetProperties } from './Widget.js';

import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';

/**
 * Optional TextInput constructor properties.
 *
 * @category Widget
 */
export interface SpacingProperties extends WidgetProperties {
    /** Sets {@link Spacing#minWidth}. */
    minWidth?: number,
    /** Sets {@link Spacing#minHeight}. */
    minHeight?: number
}

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

    /** The minimum width this will try to expand */
    minWidth: number;
    /** The minimum height this will try to expand */
    minHeight: number;

    constructor(properties?: Readonly<SpacingProperties>) {
        // default properties
        properties = {
            flex: 1,
            ...properties
        };

        // Spacing needs clear, never has children and doesn't propagate events
        super(properties);

        this.minWidth = properties?.minWidth ?? 0;
        this.minHeight = properties?.minHeight ?? 0;
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Try to expand each axis. If axis is not constrained (can't expand),
        // then try to use the biggest minimum length
        if(maxWidth !== Infinity) {
            this.idealWidth = maxWidth;
        } else {
            this.idealWidth = Math.max(minWidth, this.minWidth);
        }

        if(maxHeight !== Infinity) {
            this.idealHeight = maxHeight;
        } else {
            this.idealHeight = Math.max(minHeight, this.minHeight);
        }
    }
}
