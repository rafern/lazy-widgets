import { WidgetAutoXML } from './WidgetAutoXML';

/**
 * {@link WidgetAutoXML} for {@link VirtualKey} widgets with keyContext,
 * minWidth (optional) and minHeight (optional) parameters.
 *
 * @category XML
 */
export const SpecializedVirtualKeyAutoXML: WidgetAutoXML = [
    {
        name: 'key-context',
        mode: 'value',
        validator: 'key-context',
    },
    {
        name: 'min-width',
        mode: 'value',
        validator: 'number',
        optional: true,
    },
    {
        name: 'min-height',
        mode: 'value',
        validator: 'number',
        optional: true,
    }
];
