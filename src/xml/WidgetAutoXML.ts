import type { Widget } from '../widgets/Widget';
import type { BaseXMLUIParser, XMLWidgetFactory } from './BaseXMLUIParser';

export type WidgetAutoXMLConfigValidator = (value: unknown) => unknown;

/**
 * A parameter for the constructor of a Widget class, configured in a
 * {@link WidgetAutoXMLConfig}.
 */
export interface WidgetAutoXMLConfigParameter {
    mode: 'value';
    name: string;
    optional?: boolean;
    validator?: WidgetAutoXMLConfigValidator | 'array' | 'boolean' | 'function' | 'image-source' | 'key-context' | 'layout-constraints' | 'number' | 'object' | 'string' | 'theme' | 'validated-variable' | 'variable' | 'nullable:array' | 'nullable:boolean' | 'nullable:function' | 'nullable:image-source' | 'nullable:key-context' | 'nullable:layout-constraints' | 'nullable:number' | 'nullable:object' | 'nullable:string' | 'nullable:theme' | 'nullable:validated-variable' | 'nullable:variable';
}

/** A widget parameter for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigWidgetParameter {
    mode: 'widget';
    name?: string;
    optional?: boolean;
    list?: boolean;
    validator?: <W extends Widget>(value: Widget) => W;
}

/** A layer list parameter for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigLayerParameter {
    mode: 'layer';
    list: boolean;
    name?: string;
}

/**
 * A string parameter for a {@link WidgetAutoXMLConfig}, passed as an XML text
 * node. There can only be one text parameter.
 */
export interface WidgetAutoXMLConfigTextParameter {
    mode: 'text';
    name?: string;
    optional?: boolean;
}

/**
 * An input mapping for a {@link Widget | Widget's}
 * {@link BaseXMLUIParser#registerAutoFactory | auto-factory}.
 */
export type WidgetAutoXMLConfig = Array<WidgetAutoXMLConfigParameter | WidgetAutoXMLConfigWidgetParameter | WidgetAutoXMLConfigLayerParameter | WidgetAutoXMLConfigTextParameter>;

/**
 * A function that, when called, should register a factory to a
 * {@link BaseXMLUIParser}
 */
export type WidgetAutoXMLSelfRegister = (parser: BaseXMLUIParser) => void;

/**
 * Widget factory auto-register object. Can be a config object, or an XML widget
 * factory which will be self-registered.
 */
export type WidgetAutoXML = WidgetAutoXMLConfig | XMLWidgetFactory;
