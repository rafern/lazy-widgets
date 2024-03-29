import type { BaseXMLUIParser } from './BaseXMLUIParser.js';
import type { WidgetXMLInputConfigParameter } from './WidgetAutoXML.js';
import type { XMLUIParserContext } from './XMLUIParserContext.js';
/**
 * A function that validates and transforms a value passed to a custom parameter
 * mode.
 *
 * @category XML
 */
export type XMLParameterModeValidator = (parser: BaseXMLUIParser, context: XMLUIParserContext, parameterConfig: WidgetXMLInputConfigParameter, value: unknown) => unknown;
