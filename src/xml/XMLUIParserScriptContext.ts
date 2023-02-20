import type { Widget } from '../widgets/Widget';

/**
 * A context object that will be passed to a script as the 'context' variable in
 * an XML UI.
 *
 * @category XML
 */
export interface XMLUIParserScriptContext {
    variables: Map<string, unknown>;
    ids: Map<string, Widget>;
}
