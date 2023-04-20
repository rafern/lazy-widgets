/**
 * Options to be used in a {@link BaseXMLUIParser}.
 *
 * @category XML
 */
export interface ASTInstantiationConfig {
    scriptImports?: Record<string, unknown> | Map<string, unknown>;
    variables?: Record<string, unknown> | Map<string, unknown>;
    allowScripts?: boolean;
}
