import type { Widget } from '../widgets/Widget.js';
/**
 * A context object that will be passed to a script as the 'context' variable in
 * an XML UI.
 *
 * @category XML
 */
export interface ASTInstantiationScriptContext {
    variables: Map<string, unknown>;
    ids: Map<string, Widget>;
}
