import type { BaseXMLUIParser } from './BaseXMLUIParser.js';
import type { ASTInstantiationContext } from './ASTInstantiationContext.js';

/**
 * A function that does something with an attribute that belongs to a specific
 * namespace. Could be used to add extra functionality to the parser, such as
 * adding attributes that change a widget's options object, or add event
 * listeners after the widget is instantiated.
 *
 * @category XML
 */
export type XMLAttributeNamespaceHandler = (parser: BaseXMLUIParser, context: ASTInstantiationContext, instantiationContext: Record<string, unknown>, attribute: Attr) => void;
