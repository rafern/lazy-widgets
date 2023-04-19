import { WidgetXMLInputConfig } from './WidgetAutoXML.js';

/**
 * {@link WidgetXMLInputConfig} for {@link VirtualKey} widgets with keyContext,
 * minWidth (optional) and minHeight (optional) parameters.
 *
 * @category XML
 */
export const SpecializedVirtualKeyXMLInputConfig: WidgetXMLInputConfig = [
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
