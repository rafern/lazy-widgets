import { Widget } from '../widgets/Widget.js';
import { ASTInstantiationContext } from './ASTInstantiationContext.js';
import { ASTNode } from './ASTNode.js';

export abstract class WidgetModifierNode extends ASTNode {
    static override readonly typeGroup = 'widget-modifier';
    override readonly typeGroup = WidgetModifierNode.typeGroup;

    static derives(obj: ASTNode): obj is WidgetModifierNode {
        return obj.typeGroup === this.typeGroup;
    }

    abstract apply(context: ASTInstantiationContext, widget: Widget): void;
}
