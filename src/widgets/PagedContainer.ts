import { PropagationModel, type WidgetEvent } from '../events/WidgetEvent.js';
import { type Rect } from '../helpers/Rect.js';
import { MultiParentXMLInputConfig } from '../xml/MultiParentXMLInputConfig.js';
import { type WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import { MultiParent } from './MultiParent.js';
import { Widget } from './Widget.js';

export class PagedContainer<W extends Widget = Widget> extends MultiParent<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'paged-container',
        inputConfig: MultiParentXMLInputConfig
    };

    private _currentIndex = 0;

    get currentIndex(): number {
        return this._currentIndex;
    }

    set currentIndex(currentIndex: number) {
        if (this._currentIndex === currentIndex) {
            return;
        }

        this._currentIndex = currentIndex;
        this._layoutDirty = true;
        this.markWholeAsDirty();
    }

    get currentPageChild() {
        return this._children[this._currentIndex];
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            return super.handleEvent(event);
        } else {
            return this.currentPageChild.dispatchEvent(event);
        }
    }

    protected override handlePreLayoutUpdate(): void {
        // Pre-layout update child
        const child = this.currentPageChild;
        child.preLayoutUpdate();

        // If child's layout is dirty, set self's layout as dirty
        if (child.layoutDirty) {
            this._layoutDirty = true;
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update child
        this.currentPageChild.postLayoutUpdate();
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve child's dimensions and set own resolved dimensions to be
        // equal to the child's
        const child = this.currentPageChild;
        child.resolveDimensions(minWidth, maxWidth, minHeight, maxHeight);
        [this.idealWidth, this.idealHeight] = child.idealDimensions;
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Resolve child's position to be the same as this widget's position
        this.currentPageChild.resolvePosition(x, y);
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint child
        this.currentPageChild.paint(dirtyRects);
    }

    override updateActiveState(): boolean {
        // TODO add a new api that lets you selectively propagate activation to
        //      children, without enabling or disabling them
        const changed = super.updateActiveState();

        if(changed) {
            for(const child of this) {
                child.updateActiveState();
            }
        }

        return changed;
    }
}
