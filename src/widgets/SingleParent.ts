import { Parent } from './Parent.js';
import type { Widget, WidgetProperties } from '../widgets/Widget.js';
/**
 * A specialised version of the {@link Parent} class for parents with a single
 * mandatory child.
 *
 * @category Widget
 */
export abstract class SingleParent<W extends Widget = Widget> extends Parent<W> {
    /**
     * @param child - The mandatory single child of this widget. Cannot be changed later.
     */
    constructor(readonly child: W, properties?: Readonly<WidgetProperties>) {
        super(properties);
        child.inheritedTheme = this.inheritedTheme;
    }

    override [Symbol.iterator](): Iterator<W> {
        const child = this.child;
        let first = true;

        return <Iterator<W>>{
            next() {
                if (first) {
                    first = false;
                    return { value: child, done: false };
                } else {
                    return { value: undefined, done: true };
                }
            }
        }
    }

    override get childCount(): 1 {
        return 1;
    }
}
