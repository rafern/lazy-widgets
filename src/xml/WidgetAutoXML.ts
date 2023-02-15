import { Widget } from '../widgets/Widget';
import { BaseXMLUIParser } from './BaseXMLUIParser';

/**
 * A parameter for the constructor of a Widget class, configured in a
 * {@link WidgetAutoXMLConfig}.
 */
export interface WidgetAutoXMLConfigParameter {
    name: string;
    mode: 'value';
    optional?: boolean;
    validator?: (<T>(value: unknown) => T) | 'string' | 'number' | 'function' | 'nullable-string' | 'nullable-number' | 'nullable-function' | 'key-context';
}

/** A widget parameter for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigWidgetParameter {
    name: string;
    mode: 'widget';
    optional?: boolean;
    isList?: boolean;
    validator?: <W extends Widget>(value: Widget) => W;
}

/** A layer list parameter for a {@link WidgetAutoXMLConfig}. */
export interface WidgetAutoXMLConfigLayerParameter {
    name: string;
    mode: 'layer';
}

/**
 * An input mapping for a {@link Widget | Widget's}
 * {@link BaseXMLUIParser#registerAutoFactory | auto-factory}.
 */
export interface WidgetAutoXMLConfig {
    parameters: Array<WidgetAutoXMLConfigParameter | WidgetAutoXMLConfigWidgetParameter>;
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
