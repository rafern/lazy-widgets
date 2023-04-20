import type { BaseXMLUIParser } from './BaseXMLUIParser.js';
import type { ASTInstantiationContext } from './ASTInstantiationContext.js';

/**
 * A function that modifies a given widget factory parameter list. Can be used
 * to add extra parameters (such as an options object) or transform existing
 * parameters.
 *
 * @category XML
 */
export type XMLArgumentModifier = (parser: BaseXMLUIParser, context: ASTInstantiationContext, instantiationContext: Record<string, unknown>, parameters: Array<unknown>) => void;
