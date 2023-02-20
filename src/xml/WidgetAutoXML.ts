import type { Widget } from '../widgets/Widget';
import type { BaseXMLUIParser, XMLWidgetFactory } from './BaseXMLUIParser';

export type WidgetAutoXMLConfigValidator = (inputValue: unknown) => [transformedValue: unknown, stop: boolean];

/**
 * A value parameter for the constructor of a Widget class, configured in a
 * {@link WidgetAutoXMLConfig}.
 */
export interface WidgetAutoXMLConfigValueParameter extends WidgetAutoXMLConfigParameter {
    mode: 'value';
    name: string;
    optional?: boolean;
    validator?: WidgetAutoXMLConfigValidator | string | Array<WidgetAutoXMLConfigValidator | string>;
}

/** A widget parameter for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigWidgetParameter {
    mode: 'widget';
    name: string;
    optional?: boolean;
    list?: boolean;
    validator?: <W extends Widget>(value: Widget) => W;
}

/**
 * A string parameter for a {@link WidgetAutoXMLConfig}, which can be passed as
 * an XML text node. There can only be one text parameter.
 */
export interface WidgetAutoXMLConfigTextParameter {
    mode: 'text';
    name: string;
    optional?: boolean;
    list?: boolean;
}

/** A parameter with a custom mode for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigParameter {
    mode: string;
    name: string;
    optional?: boolean;
    list?: boolean;
}

/**
 * An input mapping for a {@link Widget | Widget's}
 * {@link BaseXMLUIParser#registerAutoFactory | auto-factory}.
 */
export type WidgetAutoXMLConfig = Array<WidgetAutoXMLConfigValueParameter | WidgetAutoXMLConfigWidgetParameter | WidgetAutoXMLConfigTextParameter | WidgetAutoXMLConfigParameter>;

export interface WidgetAutoXMLConfigWithFactory {
    inputConfig: WidgetAutoXMLConfig,
    factory: XMLWidgetFactory
}

/**
 * A function that, when called, should register a factory to a
 * {@link BaseXMLUIParser}
 */
export type WidgetAutoXMLSelfRegister = (parser: BaseXMLUIParser) => void;

/**
 * Widget factory auto-register object. Can be a config object, or an XML widget
 * factory which will be self-registered.
 */
export type WidgetAutoXML = WidgetAutoXMLConfig | WidgetAutoXMLConfigWithFactory;
