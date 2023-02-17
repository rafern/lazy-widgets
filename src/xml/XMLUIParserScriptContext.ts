import type { Widget } from '../widgets/Widget';

export interface XMLUIParserScriptContext {
    variables: Map<string, unknown>;
    ids: Map<string, Widget>;
    metadata: Map<Widget, Map<string, unknown>>;
}
