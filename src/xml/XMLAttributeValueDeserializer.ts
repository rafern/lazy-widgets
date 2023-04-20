import type { BaseXMLUIParser } from './BaseXMLUIParser.js';
import type { ASTInstantiationContext } from './ASTInstantiationContext.js';

/**
 * A function that deserializes an attribute's value. The correct deserializer
 * is picked from the prefix of the value.
 *
 * @category XML
 */
export type XMLAttributeValueDeserializer = (parser: BaseXMLUIParser, context: ASTInstantiationContext, value: string) => unknown;
