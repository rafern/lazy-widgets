import { WidgetAutoXMLConfig } from './WidgetAutoXML';

export const BasicVirtualKeyAutoXML: WidgetAutoXMLConfig = {
    parameters: [
        {
            name: 'text',
            mode: 'value',
            validator: 'string',
        },
        {
            name: 'key-code',
            mode: 'value',
            validator: 'string',
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
