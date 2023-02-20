import { WidgetAutoXML } from './WidgetAutoXML';

/**
 * {@link WidgetAutoXML} for {@link SingleParent} widgets with a single required
 * child widget parameter.
 *
 * @category XML
 */
export const SingleParentAutoXML: WidgetAutoXML = [
    {
        mode: 'widget',
        name: 'child'
    }
];
