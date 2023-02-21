import type { Widget } from '../widgets/Widget';
import type { XMLWidgetFactory } from './XMLWidgetFactory';

/**
 * A generic validator function which can transform a value and be chained with
 * other validators. If an input value is invalid, an error must be thrown.
 *
 * @category XML
 */
export type WidgetAutoXMLConfigValidator = (inputValue: unknown) => [transformedValue: unknown, stop: boolean];

/**
 * A value parameter for the constructor of a Widget class, configured in a
 * {@link WidgetAutoXMLConfig}.
 *
 * @category XML
 */
export interface WidgetAutoXMLConfigValueParameter extends WidgetAutoXMLConfigParameter {
    mode: 'value';
    name: string;
    optional?: boolean;
    validator?: WidgetAutoXMLConfigValidator | string | Array<WidgetAutoXMLConfigValidator | string>;
}

/**
 * A widget parameter for a {@link WidgetAutoXMLConfig}.
 *
 * @category XML
 */
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
 *
 * @category XML
 */
export interface WidgetAutoXMLConfigTextParameter {
    mode: 'text';
    name: string;
    optional?: boolean;
    list?: boolean;
}

/**
 * A parameter with a custom mode for a {@link WidgetAutoXMLConfig}.
 *
 * @category XML
 */
export interface WidgetAutoXMLConfigParameter {
    mode: string;
    name: string;
    optional?: boolean;
    list?: boolean;
}

/**
 * An input mapping for a {@link Widget | Widget's}
 * {@link BaseXMLUIParser#registerFactory | factory}.
 *
 * @category XML
 */
export type WidgetAutoXMLConfig = Array<WidgetAutoXMLConfigValueParameter | WidgetAutoXMLConfigWidgetParameter | WidgetAutoXMLConfigTextParameter | WidgetAutoXMLConfigParameter>;

/**
 * An object that contains an input mapping and a factory function for
 * {@link BaseXMLUIParser#registerFactory}.
 *
 * @category XML
 */
export interface WidgetAutoXMLConfigWithFactory {
    inputConfig: WidgetAutoXMLConfig,
    factory: XMLWidgetFactory
}

/**
 * A configuration object which will be used for registering a Widget's factory.
 *
 * @category XML
 */
export type WidgetAutoXML = WidgetAutoXMLConfig | WidgetAutoXMLConfigWithFactory;
