import { BaseXMLUIParser } from './BaseXMLUIParser';
import * as widgets from '../widgets/concrete-widgets';
import { WidgetAutoXML } from './WidgetAutoXML';
import type { Widget } from '../widgets/Widget';

export class XMLUIParser extends BaseXMLUIParser {
    constructor() {
        super();

        // register factories for default widgets
        for (const ctor of Object.values(widgets)) {
            this.registerAutoFactory(ctor as ((new () => Widget) & { autoXML: WidgetAutoXML }));
        }
    }
}
