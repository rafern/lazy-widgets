import type { BaseXMLUIParser } from './BaseXMLUIParser';
import type { XMLUIParserContext } from './XMLUIParserContext';

/**
 * A function that deserializes an attribute's value. The correct deserializer
 * is picked from the prefix of the value.
 *
 * @category XML
 */
export type XMLAttributeValueDeserializer = (parser: BaseXMLUIParser, context: XMLUIParserContext, value: string) => unknown;
