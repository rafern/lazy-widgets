import { Widget } from '../widgets/Widget';
import { fromKebabCase } from './fromKebabCase';
import { toKebabCase } from './toKebabCase';
import { validateArray } from './validateArray';
import { validateBoolean } from './validateBoolean';
import { validateFunction } from './validateFunction';
import { validateImageSource } from './validateImageSource';
import { validateKeyContext } from './validateKeyContext';
import { validateLayoutConstraints } from './validateLayoutConstraints';
import { validateNullable } from './validateNullable';
import { validateNumber } from './validateNumber';
import { validateObject } from './validateObject';
import { validateString } from './validateString';
import { validateTheme } from './validateTheme';
import { validateValidatedVariable } from './validateValidatedVariable';
import { validateVariable } from './validateVariable';
import type { WidgetAutoXML, WidgetAutoXMLConfig, WidgetAutoXMLConfigLayerParameter, WidgetAutoXMLConfigParameterList, WidgetAutoXMLConfigValidator, WidgetAutoXMLConfigWidgetParameter } from './WidgetAutoXML';

export type XMLWidgetFactory = (parser: BaseXMLUIParser, xmlNode: Node) => Widget;

const VALIDATORS = new Map<string, WidgetAutoXMLConfigValidator>([
    ['array', validateArray],
    ['boolean', validateBoolean],
    ['function', validateFunction],
    ['image-source', validateImageSource],
    ['key-context', validateKeyContext],
    ['layout-constraints', validateLayoutConstraints],
    ['number', validateNumber],
    ['object', validateObject],
    ['string', validateString],
    ['theme', validateTheme],
    ['validated-variable', validateValidatedVariable],
    ['variable', validateVariable],
    ['nullable:array', validateNullable(validateArray)],
    ['nullable:boolean', validateNullable(validateBoolean)],
    ['nullable:function', validateNullable(validateFunction)],
    ['nullable:image-source', validateNullable(validateImageSource)],
    ['nullable:key-context', validateNullable(validateKeyContext)],
    ['nullable:layout-constraints', validateNullable(validateLayoutConstraints)],
    ['nullable:number', validateNullable(validateNumber)],
    ['nullable:object', validateNullable(validateObject)],
    ['nullable:string', validateNullable(validateString)],
    ['nullable:theme', validateNullable(validateTheme)],
    ['nullable:validated-variable', validateNullable(validateValidatedVariable)],
    ['nullable:variable', validateNullable(validateVariable)],
]);

const WHITESPACE_REGEX = /^\s*$/;

function findNextParamOfType(paramConfig: WidgetAutoXMLConfigParameterList, parametersSet: Array<boolean>, mode: string) {
    const paramCount = paramConfig.length;

    for (let i = 0; i < paramCount; i++) {
        const param = paramConfig[i];
        if (param.mode === mode) {
            if (mode === 'widget') {
                if (!parametersSet[i] || (param as WidgetAutoXMLConfigWidgetParameter).list) {
                    return i;
                }
            } else if (mode === 'layer') {
                if ((param as WidgetAutoXMLConfigLayerParameter).list) {
                    return i;
                }
            } else if (!parametersSet[i]) {
                return i;
            }
        }
    }

    return -1;
}

export class BaseXMLUIParser {
    private factories = new Map<string, XMLWidgetFactory>();
    private domParser = new DOMParser();

    registerFactory(name: string, factory: XMLWidgetFactory): void;
    registerFactory<T extends Widget>(widgetClass: new (...args: unknown[]) => T, factory: XMLWidgetFactory): void;
    registerFactory<T extends Widget = Widget>(nameOrWidgetClass: string | (new (...args: unknown[]) => T), factory: XMLWidgetFactory) {
        // handle constructors as names
        let name = nameOrWidgetClass;
        if (typeof name !== 'string') {
            name = name.name;
        }

        // make sure name is in kebab-case; element names are case-insensitive,
        // but just toLowerCase'ing it makes the tag names unreadable if the
        // string originally in camelCase or PascalCase
        name = toKebabCase(name);

        // make sure the name is not reserved
        if (name === 'layer') {
            throw new Error(`This factory name (${name}) is reserved`);
        }

        // check if already taken
        if (this.factories.has(name)) {
            throw new Error(`There is a factory already registered to this name (${name})`);
        }

        // register factory
        this.factories.set(name, factory);
    }

    registerConfigFactory<T extends Widget>(widgetClass: new (...args: unknown[]) => T, autoConfig: WidgetAutoXMLConfig): void {
        // this is an auto-factory config. create a new factory that fits the
        // requirements of the config

        // validate parameter config and build parameter name map
        let widgetTrapReached = false;
        let layerTrapReached = false;
        let hasTextNodeParam = false;
        const paramNames = new Map<string, number>();

        for (const param of autoConfig.parameters) {
            if (param.mode === 'widget') {
                if (widgetTrapReached) {
                    throw new Error('Cannot add another widget parameter; there is already a previous widget parameter that is optional or a list');
                }

                if (param.list || param.optional) {
                    widgetTrapReached = true;
                }
            } else if (param.mode === 'layer') {
                if (layerTrapReached) {
                    throw new Error('Cannot add another layer parameter; there is already a previous layer parameter that is a list');
                }

                if (param.list) {
                    layerTrapReached = true;
                }
            } else if (param.mode === 'text') {
                if (hasTextNodeParam) {
                    throw new Error('Cannot add another text parameter; there can only be one text parameter. If you have more string parameters, add them as "value" mode parameters with a "string" validator, and only keep the most important string parameter as the "text" mode parameter');
                }

                hasTextNodeParam = true;
            } else if (param.mode === 'value') {
                if (param.validator !== undefined && typeof param.validator !== 'function' && !VALIDATORS.has(param.validator)) {
                    throw new Error(`Unknown built-in validator name (${param.validator})`);
                }
            } else {
                throw new Error(`Unknown parameter mode (${(param as { mode: unknown }).mode})`);
            }
        }

        // make factory
        this.registerFactory(widgetClass, (_parser: BaseXMLUIParser, xmlNode: Node) => {
            if (xmlNode.nodeType !== Node.ELEMENT_NODE) {
                throw new Error("Can't parse XML UI widget; XML node must be an element node");
            }

            const elem = xmlNode as Element;

            // parse parameters and options
            // TODO `meta:` prefix for metadata options. for example, a
            //      `meta:id` attribute would map the widget to an ID
            const paramCount = autoConfig.parameters.length;
            let options: Record<string, unknown> | null = autoConfig.hasOptions ? {} : null;
            let optionsReplaced = false;
            const parameters = new Array<unknown>(paramCount);
            const setParameters = new Array<boolean>(paramCount).fill(false);

            for (const attribute of elem.attributes) {
                if (attribute.prefix === 'option') {
                    // this attribute sets an options object's field
                    if (options === null) {
                        throw new Error(`Can't add option "${attribute.localName}"; widget does not accept an options object`);
                    }

                    if (attribute.localName === '_') {
                        if (optionsReplaced) {
                            throw new Error('Can\'t replace options object; options object has already been replaced with "option:_"');
                        }

                        if (Object.getOwnPropertyNames(options).length > 0) {
                            throw new Error("Can't replace options object; can't replace options object if individual options are being set with \"option:...\"");
                        }

                        optionsReplaced = true;

                        // TODO replace options object
                    } else {
                        if (optionsReplaced) {
                            throw new Error(`Can't add option "${attribute.localName}"; can't set individual options if the options object is replaced with "option:_"`);
                        }

                        const nameConverted = fromKebabCase(attribute.localName);
                        if (nameConverted in options) {
                            throw new Error(`Can't add option "${attribute.localName}"; the option has already been set`);
                        }

                        // TODO handle variables and json encoding prefixes
                        options[nameConverted] = attribute.value;
                    }
                } else if (attribute.prefix === null) {
                    // this attribute sets a parameter's value
                    const index = paramNames.get(attribute.localName);
                    if (index === undefined) {
                        throw new Error(`Can't set parameter "${attribute.localName}"; parameter does not exist for this widget`);
                    }

                    if (setParameters[index]) {
                        throw new Error(`Can't set parameter "${attribute.localName}"; parameter was already set`);
                    }

                    setParameters[index] = true;
                    // TODO handle variables and json encoding prefixes
                    // TODO validate value
                    parameters[index] = attribute.value;
                }
            }

            // parse child elements (widgets, layers and text nodes)
            let textContent = '';
            for (const childNode of elem.childNodes) {
                const nodeType = childNode.nodeType;

                if (nodeType === Node.DOCUMENT_NODE) {
                    throw new Error('Unexpected document node in XML file');
                } else if (nodeType === Node.DOCUMENT_TYPE_NODE) {
                    throw new Error('Unexpected document type node in XML file');
                } else if (nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                    throw new Error('Unexpected document fragment node in XML file');
                } else if (nodeType === Node.TEXT_NODE || nodeType === Node.CDATA_SECTION_NODE) {
                    textContent += (childNode as CharacterData).data;
                } else if (nodeType === Node.ELEMENT_NODE) {
                    const childElem = childNode as Element;
                    if (childElem.nodeName.toLowerCase() === 'layer') {
                        // TODO implement layer parsing
                    } else {
                        const index = findNextParamOfType(autoConfig.parameters, setParameters, 'widget');
                        const childWidget = this.parseNode(childElem);
                        setParameters[index] = true;

                        if ((autoConfig.parameters[index] as WidgetAutoXMLConfigWidgetParameter).list) {
                            if (parameters[index] === undefined) {
                                parameters[index] = [childWidget];
                            } else {
                                (parameters[index] as Array<Widget>).push(childWidget);
                            }
                        } else {
                            parameters[index] = childWidget;
                        }
                    }
                }
            }

            // add text parameter if needed
            const textIndex = findNextParamOfType(autoConfig.parameters, setParameters, 'text');
            if (textIndex >= 0) {
                parameters[textIndex] = textContent;
                setParameters[textIndex] = true;
            } else if (!WHITESPACE_REGEX.test(textContent)) {
                throw new Error('XML widget has a child text node, but there are no text parameters left to fill');
            }

            // check if all required parameters are set
            for (let i = 0; i < paramCount; i++) {
                if (!setParameters[i]) {
                    const param = autoConfig.parameters[i];
                    if (param.mode === 'value') {
                        if (!param.optional) {
                            throw new Error(`Parameter not set (${param.name})`);
                        }
                    } else if (param.mode === 'widget') {
                        if (!param.optional) {
                            throw new Error(`Widget parameter not set (${param.name === undefined ? 'unnamed' : param.name})`);
                        }
                    } else if (param.mode === 'layer') {
                        throw new Error(`Layer parameter not set (${param.name === undefined ? 'unnamed' : param.name})`);
                    } else {
                        if (!param.optional) {
                            throw new Error(`Text parameter not set (${param.name === undefined ? 'unnamed' : param.name})`);
                        }
                    }
                }
            }

            // instantiate widget
            if (options === null) {
                return new widgetClass(...parameters);
            } else {
                return new widgetClass(...parameters, options);
            }
        });
    }

    registerAutoFactory<T extends Widget = Widget>(widgetClass: (new () => T) & { autoXML: WidgetAutoXML }) {
        if (widgetClass.autoXML === null) {
            throw new Error('Widget class does not have an automatic XML factory config object set. Must be manually registered');
        }

        if (typeof widgetClass.autoXML === 'function') {
            // self-register factory
            this.registerFactory(widgetClass, widgetClass.autoXML);
        } else {
            // input mapping
            this.registerConfigFactory(widgetClass, widgetClass.autoXML);
        }
    }

    parseNode(xmlNode: Node): Widget {
        // get factory for this element name
        const name = xmlNode.nodeName.toLowerCase();
        const factory = this.factories.get(name);

        if (factory === undefined) {
            throw new Error(`No factory registered to name (${name})`);
        }

        // generate widget
        // TODO id mapping
        // TODO pre-parsed node attributes, to handle vue-like tag syntax
        return factory(this, xmlNode);
    }

    parseXMLDocument(xmlDoc: XMLDocument): Widget {
        // iterate children. there should only be one element child
        let topWidget = null;
        for (const child of xmlDoc.childNodes) {
            const nodeType = child.nodeType;
            if (nodeType === Node.ELEMENT_NODE) {
                if (topWidget !== null) {
                    throw new Error('XML UI tree can only have one top-most widget');
                }

                topWidget = this.parseNode(child);
            } else if (nodeType === Node.TEXT_NODE) {
                if (!WHITESPACE_REGEX.test((child as CharacterData).data)) {
                    throw new Error('Unexpected text node as XML document child');
                }
            } else if (nodeType === Node.CDATA_SECTION_NODE) {
                throw new Error('Unexpected CDATA node as XML document child');
            } else if (nodeType === Node.DOCUMENT_NODE) {
                throw new Error('Unexpected document node as XML document child');
            } else if (nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                throw new Error('Unexpected document fragment node as XML document child');
            }
        }

        if (topWidget === null) {
            throw new Error('Expected a XML widget definition in the document, none found');
        }

        return topWidget;
    }

    parseFromString(str: string): Widget {
        const xmlDoc = this.domParser.parseFromString(str, 'text/xml');

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            throw new Error('Invalid XML');
        }

        return this.parseXMLDocument(xmlDoc);
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
