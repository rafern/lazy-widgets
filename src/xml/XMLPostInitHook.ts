import { Widget } from '../widgets/Widget.js';
import { BaseXMLUIParser } from './BaseXMLUIParser.js';
import { XMLUIParserContext } from './XMLUIParserContext.js';
/**
 * A function that is called after a widget instance is created. Can be used to
 * modify a part of a widget that is only available after the widget is created,
 * such as adding event listeners to a widget.
 *
 * @category XML
 */
export type XMLPostInitHook = (parser: BaseXMLUIParser, context: XMLUIParserContext, instantiationContext: Record<string, unknown>, instance: Widget) => void;
