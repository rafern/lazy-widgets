import { Widget } from '../widgets/Widget';
import { toKebabCase } from './toKebabCase';

export type XMLWidgetFactory = (parser: BaseXMLUIParser, xmlNode: Node) => Widget;

export class BaseXMLUIParser {
    private factories = new Map<string, XMLWidgetFactory>();
    private domParser = new DOMParser();

    registerFactory(name: string, factory: XMLWidgetFactory): void;
    registerFactory(widgetCtor: new () => Widget, factory: XMLWidgetFactory): void;
    registerFactory(nameOrWidgetCtor: string | (new () => Widget), factory: XMLWidgetFactory) {
        // handle constructors as names
        let name = nameOrWidgetCtor;
        if (typeof name !== 'string') {
            name = name.name;
        }

        // make sure name is in kebab-case; element names are case-insensitive,
        // but just toLowerCase'ing it makes the tag names unreadable if the
        // string originally in camelCase or PascalCase
        name = toKebabCase(name);

        // check if already taken
        if (this.factories.has(name)) {
            throw new Error(`There is a factory already registered to this name (${name})`);
        }

        // register factory
        this.factories.set(name, factory);
    }

    parseNode(xmlNode: Node): Widget {
        // get factory for this element name
        const name = xmlNode.nodeName.toLowerCase();
        const factory = this.factories.get(name);

        if (factory === undefined) {
            throw new Error(`No factory registered to name (${name})`);
        }

        // generate widget
        // TODO input mapping
        // TODO id mapping
        // TODO pre-parsed node attributes, to handle vue-like tag syntax
        return factory(this, xmlNode);
    }

    parseFromString(str: string): Widget {
        const xmlDoc = this.domParser.parseFromString(str, 'text/xml');

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            throw new Error('Invalid XML');
        }

        return this.parseNode(xmlDoc);
    }

    async parseFromURL(resource: RequestInfo | URL, options?: RequestInit): Promise<Widget> {
        const response = await fetch(resource, options);

        if (!response.ok) {
            throw new Error(`Response not OK (status code ${response.status})`);
        }

        const str = await response.text();
        return this.parseFromString(str);
    }
}
