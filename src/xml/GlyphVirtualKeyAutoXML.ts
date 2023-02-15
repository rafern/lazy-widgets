import { WidgetAutoXMLConfig } from './WidgetAutoXML';

export const GlyphVirtualKeyAutoXML: WidgetAutoXMLConfig = {
    parameters: [
        {
            name: 'glyph',
            mode: 'value',
            validator: 'string',
        },
        {
            name: 'alt-glyph',
            mode: 'value',
            validator: 'nullable-string',
        },
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
    ],
    hasOptions: true,
};
