import { WidgetAutoXMLConfig } from './WidgetAutoXML';

export const VirtualKeyAutoXML: WidgetAutoXMLConfig = {
    parameters: [
        {
            name: 'text',
            mode: 'value',
            validator: 'string',
        },
        {
            name: 'callback',
            mode: 'value',
            validator: 'function',
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
