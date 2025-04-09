import { Layer } from '../core/Layer.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import { Parent } from './Parent.js';
import type { LayerInit } from '../core/LayerInit.js';
import type { Root } from '../core/Root.js';
import type { Viewport } from '../core/Viewport.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
import type { Widget, WidgetProperties } from './Widget.js';
/**
 * A tuple with a layer and the name of that layer (or null if it is an unnamed
 * layer). For internal use only.
 *
 * @category Core
 */
export type LayerIteratorNextType<W extends Widget> = [layer: Layer<W>, layerName: string | null];

/**
 * Makes an iterator for a list of layers, given a starting index and a delta
 * for the direction of the iteration. For internal use only.
 *
 * @internal
 */
function makeLayerIterator<W extends Widget>(startIndex: number, delta: number, layers: Array<Layer<W>>, layerNames: Map<string, number>): Iterator<LayerIteratorNextType<W>> {
    const names = new Map<number, string>();

    for (const [name, nameIndex] of layerNames) {
        names.set(nameIndex, name);
    }

    let index = startIndex;

    return <Iterator<LayerIteratorNextType<W>>>{
        next() {
            if (index >= layers.length || index < 0) {
                return { value: undefined, done: true };
            } else {
                const layer = layers[index];
                const name = names.get(index) ?? null;
                index += delta;

                return { value: [layer, name], done: false };
            }
        }
    }
}

/**
 * A {@link Parent} where each child is in a separate layer. Layers have an
 * order, and are placed in that order; layers at the beginning of the list are
 * below layers at the end of the list, painting is done in a back-to-front
 * order, while event dispatching is done in a front-to-back order.
 *
 * A layerered container must always contain at least one layer; the default
 * layer. The default layer can't be removed, and must be able to expand.
 *
 * Can be constrained to a specific type of children.
 *
 * @category Widget
 */
export class LayeredContainer<W extends Widget = Widget> extends Parent<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'layered-container',
        inputConfig: [
            {
                mode: 'layer',
                name: 'layers',
                list: true
            },
            {
                mode: 'value',
                name: 'default-layer-index',
                validator: 'number',
                optional: true
            }
        ]
    };

    /** The default layer. Can't be removed */
    readonly defaultLayer: Layer<W>;
    /** The current index of the default layer */
    private _defaultLayerIndex;
    /** The list of layers in this container */
    private readonly layers = new Array<Layer<W>>();
    /**
     * A map which names some layers. Each key is the layer name, and each value
     * is the index of the layer in the layers list.
     */
    private readonly layerNames = new Map<string, number>();

    /**
     * @param layers - The list of layers to be added to this container
     * @param defaultLayerIndex - The index of the default layer in the layers list
     */
    constructor(layers: Array<LayerInit<W>>, defaultLayerIndex = 0, properties?: Readonly<WidgetProperties>) {
        super(properties);

        const layerCount = layers.length;

        if (defaultLayerIndex < 0) {
            defaultLayerIndex += layerCount;
        }

        if (defaultLayerIndex < 0 || defaultLayerIndex >= layerCount) {
            throw new Error('Default layer index is out of bounds');
        }

        for (const layerInit of layers) {
            const canExpand = layerInit.canExpand ?? true;
            const name = layerInit.name ?? null;
            const child = layerInit.child;
            child.inheritedTheme = this.inheritedTheme;

            if (!child) {
                throw new Error('A layer must have a child widget');
            }

            if (name !== null) {
                this.layerNames.set(name, this.layers.length);
            }

            this.layers.push(<Layer<W>>{ child, canExpand });
        }

        this._defaultLayerIndex = defaultLayerIndex;
        this.defaultLayer = this.layers[defaultLayerIndex];

        if (!this.defaultLayer.canExpand) {
            throw new Error('Default layer must be able to expand the layout');
        }
    }

    /**
     * Create a new {@link LayeredContainer} with a single default layer.
     * Shortcut for using the constructor with a single-element array as the
     * layers list, and a default layer index of 0.
     */
    static fromDefaultLayerChild<W extends Widget>(defaultLayerChild: W, properties?: Readonly<WidgetProperties>) {
        return new LayeredContainer([
            <LayerInit<W>>{
                child: defaultLayerChild,
                canExpand: true
            }
        ], 0, properties);
    }

    override *[Symbol.iterator](): Iterator<W> {
        for (const [layer, _name] of this.backToFrontLayers) {
            yield layer.child;
        }
    }

    override get childCount(): number {
        return this.layerCount;
    }

    /**
     * Get the amount of layers currently in this container. Equivalent to
     * {@link LayeredContainer#childCount};
     */
    get layerCount() {
        return this.layers.length;
    }

    /**
     * Get the current index of the default layer. May change if a layer is
     * inserted or removed before the default layer.
     */
    get defaultLayerIndex() {
        return this._defaultLayerIndex;
    }

    /** Iterate all layers from back to front. */
    get backToFrontLayers(): Iterable<LayerIteratorNextType<W>> {
        const layers = this.layers;
        const layerNames = this.layerNames;

        return {
            [Symbol.iterator]() {
                return makeLayerIterator(0, 1, layers, layerNames);
            }
        }
    }

    /** Iterate all layers from front to back. */
    get frontToBackLayers(): Iterable<LayerIteratorNextType<W>> {
        const layers = this.layers;
        const layerNames = this.layerNames;

        return {
            [Symbol.iterator]() {
                return makeLayerIterator(layers.length - 1, -1, layers, layerNames);
            }
        }
    }

    protected override handleEvent(event: WidgetEvent): Widget | null {
        if (event.propagation !== PropagationModel.Trickling) {
            return super.handleEvent(event);
        }

        // Dispatch event to children. Front layers receive the event before the
        // back layers
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const capturer = this.layers[i].child.dispatchEvent(event);
            if (capturer) {
                return capturer;
            }
        }

        return null;
    }

    protected override handlePreLayoutUpdate(): void {
        // Pre-layout update all children. Propagate layoutDirty flag
        for (const child of this) {
            child.preLayoutUpdate();

            // If child's layout is dirty, set self's layout as dirty
            if(child.layoutDirty) {
                this._layoutDirty = true;
            }
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update all children
        for (const child of this) {
            child.postLayoutUpdate();
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // resolve expanding layers
        this.idealWidth = 0;
        this.idealHeight = 0;

        for (const layer of this.layers) {
            if (!layer.canExpand) {
                continue;
            }

            const child = layer.child;
            child.resolveDimensions(minWidth, maxWidth, minHeight, maxHeight);

            const idealChildDims = child.idealDimensions;
            this.idealWidth = Math.max(this.idealWidth, idealChildDims[0]);
            this.idealHeight = Math.max(this.idealHeight, idealChildDims[1]);
        }

        // soft-stretch all layers to fit ideal dimensions
        for (const layer of this.layers) {
            layer.child.resolveDimensions(this.idealWidth, this.idealWidth, this.idealHeight, this.idealHeight);
        }
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Resolve children's position to be the same as this widget's position
        for (const child of this) {
            child.resolvePosition(x, y);
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint children. Back layers are painted before front layers
        for (const layer of this.layers) {
            layer.child.paint(dirtyRects);
        }
    }

    /** Add a new layer to the container at the end of the layers list. */
    pushLayer(layer: Layer<W>, name: string | null = null): number {
        this.assertNameAvailable(name);

        const index = this.layers.push(layer) - 1;

        if (name !== null) {
            this.layerNames.set(name, index);
        }

        this.attachLayer(layer);
        return index;
    }

    /** Add a new layer to the container at a given index of the layers list. */
    insertLayerBefore(layer: Layer<W>, index: number, name: string | null = null): number {
        this.assertNameAvailable(name);

        const layerCount = this.layers.length;

        if (index < 0) {
            index = layerCount + index;
            if (index < 0) {
                index = 0;
            }
        } else if (index >= layerCount) {
            return this.pushLayer(layer, name);
        }

        this.updateIndices(index, 1);
        this.layers.splice(index, 0, layer);

        if (name !== null) {
            this.layerNames.set(name, index);
        }

        this.attachLayer(layer);
        return index;
    }

    /**
     * Add a new layer to the container after a given index of the layers list.
     */
    insertLayerAfter(layer: Layer<W>, index: number, name: string | null = null): number {
        return this.insertLayerBefore(layer, index + 1, name);
    }

    /**
     * Remove a layer from the container at a given index of the layers list.
     */
    removeLayer(index: number) {
        const layerCount = this.layers.length;

        if (index < 0) {
            index = layerCount + index;
        }

        if (index < 0 || index >= layerCount) {
            throw new RangeError('Cannot remove layer: index out of bounds');
        }

        if (index === this._defaultLayerIndex) {
            throw new Error('Default layer connot be removed');
        }

        this.detachLayer(this.layers[index]);
        this.layers.splice(index, 1);
        this.updateIndices(index, -1);
    }

    /**
     * Get the current index of a named layer by its name.
     *
     * @returns Returns the index of the named layer, or null if no layer has been added with this name.
     */
    getNamedLayerIndex(name: string): number | null {
        const index = this.layerNames.get(name);

        if (index !== undefined) {
            return index;
        } else {
            return null;
        }
    }

    /**
     * Get a named layer by its name.
     *
     * @returns Returns the named layer, or null if no layer has been added with this name.
     */
    getNamedLayer(name: string): Layer<W> | null {
        const index = this.layerNames.get(name);

        if (index !== undefined) {
            return this.layers[index];
        } else {
            return null;
        }
    }

    /**
     * Get the current index of a layer by its value.
     *
     * @returns Returns the index of the layer, or null if the layer is not present in the container.
     */
    getLayerIndex(layer: Layer<W>): number | null {
        const index = this.layers.indexOf(layer);
        return (index < 0) ? null : index;
    }

    /**
     * Change the indices of the named layers and default layer if they exceed
     * indexMin, by a given delta. For internal use only.
     *
     * @param indexMin - Indices with this value or greater will be updated
     * @param delta - The amount of change the indices by
     */
    private updateIndices(indexMin: number, delta: number) {
        // XXX is this safe? i've read that it is, but it doesn't feel right
        for (const [name, index] of this.layerNames) {
            if (index >= indexMin) {
                this.layerNames.set(name, index + delta);
            }
        }

        if (this._defaultLayerIndex >= indexMin) {
            this._defaultLayerIndex += delta;
        }
    }

    /**
     * Attach a given layer to the UI root. For internal use only.
     *
     * @param layer - The layer to attach to the UI root.
     */
    private attachLayer(layer: Layer<W>) {
        const child = layer.child;

        if (this.attached) {
            child.attach(this._root as Root, this._viewport as Viewport, this);
        }

        child.inheritedTheme = this.inheritedTheme;
        this._layoutDirty = true;
    }

    /**
     * Detach a given layer from the UI root. For internal use only.
     *
     * @param layer - The layer to deatach from the UI root.
     */
    private detachLayer(layer: Layer<W>) {
        const child = layer.child;

        if (this.attached) {
            this.markAsDirty([...child.position, ...child.dimensions]);
            child.detach();
        }

        child.inheritedTheme = undefined;
        this._layoutDirty = true;
    }

    /**
     * Assert that a layer name is available. If no name is provided, this
     * method will always succeed. If the name is already taken, an error is
     * thrown.
     */
    private assertNameAvailable(name: string | null) {
        if (name !== null && this.layerNames.has(name)) {
            throw new Error('');
        }
    }
}
