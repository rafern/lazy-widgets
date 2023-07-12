import type { Widget } from '../widgets/Widget.js';
import type { XMLWidgetFactory } from './XMLWidgetFactory.js';
/**
 * A generic validator function which can transform a value and be chained with
 * other validators. If an input value is invalid, an error must be thrown.
 *
 * @category XML
 */
export type WidgetAutoXMLConfigValidator = (inputValue: unknown) => [transformedValue: unknown, stop: boolean];

/**
 * A value parameter for the constructor of a Widget class, configured in a
 * {@link WidgetXMLInputConfig}.
 *
 * @category XML
 */
export interface WidgetXMLInputConfigValueParameter extends WidgetXMLInputConfigParameter {
    mode: 'value';
    name: string;
    optional?: boolean;
    validator?: WidgetAutoXMLConfigValidator | string | Array<WidgetAutoXMLConfigValidator | string>;
}

/**
 * A widget parameter for a {@link WidgetXMLInputConfig}.
 *
 * @category XML
 */
export interface WidgetXMLInputConfigWidgetParameter {
    mode: 'widget';
    name: string;
    optional?: boolean;
    list?: boolean;
    validator?: <W extends Widget>(value: Widget) => W;
}

/**
 * A string parameter for a {@link WidgetXMLInputConfig}, which can be passed as
 * an XML text node. There can only be one text parameter.
 *
 * @category XML
 */
export interface WidgetXMLInputConfigTextParameter {
    mode: 'text';
    name: string;
    optional?: boolean;
    list?: boolean;
}

/**
 * A parameter with a custom mode for a {@link WidgetXMLInputConfig}.
 *
 * @category XML
 */
export interface WidgetXMLInputConfigParameter {
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
export type WidgetXMLInputConfig = Array<WidgetXMLInputConfigValueParameter | WidgetXMLInputConfigWidgetParameter | WidgetXMLInputConfigTextParameter | WidgetXMLInputConfigParameter>;

/**
 * An object that contains an input mapping and a factory function for
 * {@link BaseXMLUIParser#registerFactory}.
 *
 * @category XML
 */
export interface WidgetAutoXMLConfigWithFactory {
    inputConfig: WidgetXMLInputConfig,
    factory?: XMLWidgetFactory,
    name?: string
}

/**
 * A configuration object which will be used for registering a Widget's factory.
 *
 * @category XML
 */
export type WidgetAutoXML = WidgetXMLInputConfig | WidgetAutoXMLConfigWithFactory;
