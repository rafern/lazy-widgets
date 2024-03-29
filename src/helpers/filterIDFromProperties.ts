import { WidgetProperties } from '../widgets/Widget.js';
export function filterIDFromProperties(properties?: WidgetProperties): WidgetProperties | undefined {
    if (properties === undefined || !(('id' in properties) || ('enabled' in properties))) {
        return properties;
    } else {
        const newProperties: Record<string, unknown> = {};
        for (const name of Object.getOwnPropertyNames(properties)) {
            if (name !== 'id' && name !== 'enabled') {
                newProperties[name] = (properties as Record<string, unknown>)[name];
            }
        }

        return newProperties;
    }
}
