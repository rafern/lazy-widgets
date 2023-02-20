import type { BaseXMLUIParser } from './BaseXMLUIParser';
import type { XMLUIParserContext } from './XMLUIParserContext';

/**
 * A function that deserializes an XML element into a value usable by a Widget
 * constructor. The correct deserializer is picked from the name of the element,
 * but the element must be using the lazy-widgets base XML namespace.
 *
 * @category XML
 */
export type XMLElementDeserializer = (parser: BaseXMLUIParser, context: XMLUIParserContext, xmlElem: Element) => unknown;
