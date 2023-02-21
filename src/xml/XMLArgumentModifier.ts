import type { BaseXMLUIParser } from './BaseXMLUIParser';
import type { XMLUIParserContext } from './XMLUIParserContext';

/**
 * A function that modifies a given widget factory parameter list. Can be used
 * to add extra parameters (such as an options object) or transform existing
 * parameters.
 *
 * @category XML
 */
export type XMLArgumentModifier = (parser: BaseXMLUIParser, context: XMLUIParserContext, instantiationContext: Record<string, unknown>, parameters: Array<unknown>) => void;
