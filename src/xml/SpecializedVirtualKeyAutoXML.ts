import { WidgetAutoXML } from './WidgetAutoXML';

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