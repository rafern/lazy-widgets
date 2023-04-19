import { WidgetXMLInputConfig } from './WidgetAutoXML.js';

/**
 * {@link WidgetXMLInputConfig} for {@link MultiParent} widgets with a single
 * optional child widget list parameter.
 *
 * @category XML
 */
export const MultiParentXMLInputConfig: WidgetXMLInputConfig = [
    {
        mode: 'widget',
        name: 'children',
        list: true,
        optional: true,
    }
];
