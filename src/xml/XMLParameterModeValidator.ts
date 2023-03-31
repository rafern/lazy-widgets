import type { BaseXMLUIParser } from './BaseXMLUIParser';
import type { WidgetXMLInputConfigParameter } from './WidgetAutoXML';
import type { XMLUIParserContext } from './XMLUIParserContext';

/**
 * A function that validates and transforms a value passed to a custom parameter
 * mode.
 *
 * @category XML
 */
export type XMLParameterModeValidator = (parser: BaseXMLUIParser, context: XMLUIParserContext, parameterConfig: WidgetXMLInputConfigParameter, value: unknown) => unknown;
