import type { Widget } from '../widgets/Widget.js';
/**
 * A context object that will be used when parsing an XML UI tree. Used to keep
 * track of resources that are shared when parsing, or inputs required for
 * parsing.
 *
 * @category XML
 */
export interface XMLUIParserContext {
    scriptImports: Map<string, unknown> | null;
    variableMap: Map<string, unknown>;
    idMap: Map<string, Widget>;
}
