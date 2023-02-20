import type { BaseXMLUIParser } from './BaseXMLUIParser';
import type { XMLUIParserContext } from './XMLUIParserContext';

/**
 * A function that does something with an attribute that belongs to a specific
 * namespace. Could be used to add extra functionality to the parser, such as
 * adding attributes that change a widget's options object, or add event
 * listeners after the widget is instantiated.
 *
 * @category XML
 */
export type XMLAttributeNamespaceHandler = (parser: BaseXMLUIParser, context: XMLUIParserContext, instantiationContext: Record<string, unknown>, attribute: Attr) => void;
