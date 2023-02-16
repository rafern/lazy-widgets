import { Widget } from '../widgets/Widget';
import { BaseXMLUIParser } from './BaseXMLUIParser';

/**
 * A parameter for the constructor of a Widget class, configured in a
 * {@link WidgetAutoXMLConfig}.
 */
export interface WidgetAutoXMLConfigParameter {
    mode: 'value';
    name: string;
    optional?: boolean;
    validator?: ((value: unknown) => unknown) | 'array' | 'boolean' | 'function' | 'image-source' | 'key-context' | 'layout-constraints' | 'number' | 'object' | 'string' | 'theme' | 'validated-variable' | 'variable' | 'nullable:array' | 'nullable:boolean' | 'nullable:function' | 'nullable:image-source' | 'nullable:key-context' | 'nullable:layout-constraints' | 'nullable:number' | 'nullable:object' | 'nullable:string' | 'nullable:theme' | 'nullable:validated-variable' | 'nullable:variable';
}

/** A widget parameter for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigWidgetParameter {
    mode: 'widget';
    optional?: boolean;
    isList?: boolean;
    validator?: <W extends Widget>(value: Widget) => W;
}

/** A layer list parameter for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigLayerParameter {
    mode: 'layer';
    isList: boolean;
}

/**
 * A string parameter for a {@link WidgetAutoXMLConfig}, passed as an XML text
 * node.
 */
export interface WidgetAutoXMLConfigTextParameter {
    mode: 'text';
    optionalName?: string;
    optional?: boolean;
}

/**
 * An input mapping for a {@link Widget | Widget's}
 * {@link BaseXMLUIParser#registerAutoFactory | auto-factory}.
 */
export interface WidgetAutoXMLConfig {
    parameters: Array<WidgetAutoXMLConfigParameter | WidgetAutoXMLConfigWidgetParameter | WidgetAutoXMLConfigLayerParameter | WidgetAutoXMLConfigTextParameter>;
    hasOptions: boolean;
}

/**
 * A function that, when called, should register a factory to a
 * {@link BaseXMLUIParser}
 */
export type WidgetAutoXMLSelfRegister = (parser: BaseXMLUIParser) => void;

/**
 * Widget factory auto-register object. Can be a config object, or a
 * self-register function.
 */
export type WidgetAutoXML = WidgetAutoXMLConfig | WidgetAutoXMLSelfRegister;
