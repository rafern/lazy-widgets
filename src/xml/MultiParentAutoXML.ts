import { WidgetAutoXML } from './WidgetAutoXML';

export const MultiParentAutoXML: WidgetAutoXML = {
    parameters: [
        {
            mode: 'widget',
            name: 'children',
            list: true,
            optional: true,
        }
    ],
    hasOptions: true,
}
