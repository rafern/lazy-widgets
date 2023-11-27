import type { Widget } from '../widgets/Widget.js';
import type { Parser } from '../serialization/Parser.js';

/**
 * A context object that will be used when parsing an XML UI tree. Used to keep
 * track of resources that are shared when parsing, or inputs required for
 * parsing.
 *
 * @category XML
 */
export interface ASTInstantiationContext {
    parser: Parser;
    scriptImports: Map<string, unknown> | null;
    variableMap: Map<string, unknown>;
    idMap: Map<string, Widget>;
}
