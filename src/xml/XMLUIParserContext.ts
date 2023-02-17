import type { Widget } from '../widgets/Widget';

export interface XMLUIParserContext {
    scriptImports: Map<string, unknown> | null;
    variableMap: Map<string, unknown>;
    idMap: Map<string, Widget>;
}
