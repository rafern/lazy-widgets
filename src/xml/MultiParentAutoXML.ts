import { WidgetAutoXML } from './WidgetAutoXML';

/**
 * {@link WidgetAutoXML} for {@link MultiParent} widgets with a single optional
 * child widget list parameter.
 *
 * @category XML
 */
export const MultiParentAutoXML: WidgetAutoXML = [
    {
        mode: 'widget',
        name: 'children',
        list: true,
        optional: true,
    }
];
