import { FlexAlignment } from '../theme/FlexAlignment';
import { Widget, WidgetProperties } from './Widget';
import { Alignment } from '../theme/Alignment';
import { MultiParent } from './MultiParent';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent';

import type { TricklingEvent } from '../events/TricklingEvent';
import type { Rect } from '../helpers/Rect';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML';

/**
 * A {@link MultiParent} which automatically paints children, adds spacing,
 * propagates events and handles layout.
 *
 * Can be constrained to a specific type of children.
 *
 * Note that there is no padding. Put this inside a {@link Margin} if padding is
 * needed.
 *
 * @category Widget
 */
export class MultiContainer<W extends Widget = Widget> extends MultiParent<W> {
    static override autoXML: WidgetAutoXML = [
        {
            mode: 'value',
            name: 'vertical',
            validator: 'boolean',
        },
        {
            mode: 'widget',
            name: 'children',
            list: true,
            optional: true,
        }
    ];

    /** Is this container vertical? */
    private vertical: boolean;
    /** The unused space along the main axis after resolving dimensions */
    private unusedSpace = 0;
    /** The number of enabled children in this container */
    private enabledChildCount = 0;

    constructor(vertical: boolean, children?: Array<W>, properties?: Readonly<WidgetProperties>) {
        // MultiContainers clear their own background, have children and
        // propagate events
        super([], properties);

        this.vertical = vertical;

        if (children) {
            this.add(children);
        }
    }

    protected override onThemeUpdated(property: string | null = null): void {
        super.onThemeUpdated(property);

        if(property === null || property === 'multiContainerAlignment'
           || property === 'multiContainerSpacing') {
            this._layoutDirty = true;
        }
    }

    protected override handleEvent(baseEvent: WidgetEvent): Widget | null {
        if (baseEvent.propagation !== PropagationModel.Trickling) {
            return super.handleEvent(baseEvent);
        }

        // Reverse children if necessary
        // XXX use iterator instead of _children because an event might trigger
        // an action that removes a child, and the iterator creates a copy of
        // the children list
        let children = this as Iterable<W>;
        const event = baseEvent as TricklingEvent;
        if(event.reversed) {
            children = Array.from(children).reverse();
        }

        // Find which widget the event should go to
        for(const child of children) {
            // Ignore disabled children
            if(!child.enabled) {
                continue;
            }

            // Stop if event was captured
            const captured = child.dispatchEvent(event);
            if(captured !== null) {
                return captured;
            }
        }

        // Event wasn't dispatched to any child
        return null;
    }

    protected override handlePreLayoutUpdate(): void {
        // Pre-layout update children
        for(const child of this._children) {
            child.preLayoutUpdate();

            // If child's layout is dirty, set own layoutDirty flag
            if(child.layoutDirty) {
                this._layoutDirty = true;
            }
        }
    }

    protected override handlePostLayoutUpdate(): void {
        // Post-layout update children
        for(const child of this._children) {
            child.postLayoutUpdate();
        }
    }

    protected override handleResolveDimensions(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void {
        // Resolve children's layout with loose constraints along the main axis
        // to get their wanted dimensions and calculate total flex ratio
        let totalFlex = 0, crossLength = 0, minCrossAxis = 0;
        const maxLength = this.vertical ? maxHeight : maxWidth;

        const alignment = this.multiContainerAlignment;
        if(alignment.cross === Alignment.Stretch) {
            minCrossAxis = this.vertical ? maxWidth : maxHeight;
            if(minCrossAxis == Infinity) {
                minCrossAxis = this.vertical ? minWidth : minHeight;
            }
        }

        this.enabledChildCount = 0;
        for(const child of this._children) {
            // Resolve dimensions of disabled children with zero-width
            // constraints just so layout dirty flag is cleared
            if(!child.enabled) {
                child.resolveDimensions(0, 0, 0, 0);
                continue;
            }

            this.enabledChildCount++;

            if(this.vertical) {
                child.resolveDimensions(minCrossAxis, maxWidth, 0, Infinity);
            } else {
                child.resolveDimensions(0, Infinity, minCrossAxis, maxHeight);
            }

            const [childWidth, childHeight] = child.idealDimensions;

            totalFlex += child.flex;
            crossLength = Math.max(this.vertical ? childWidth : childHeight, crossLength);
        }

        // Clamp cross length
        const minCrossLength = this.vertical ? minWidth : minHeight;
        if(crossLength < minCrossLength) {
            crossLength = minCrossLength;
        }

        // Get free space
        const spacing = this.multiContainerSpacing;
        let usedSpace = Math.max(this.enabledChildCount - 1, 0) * spacing;
        for(const child of this._children) {
            // Ignore disabled children
            if(!child.enabled) {
                continue;
            }

            usedSpace += this.vertical ? child.idealDimensions[1] : child.idealDimensions[0];
        }

        const freeSpace = maxLength - usedSpace;

        // Don't do flexbox calculations if free space is infinite
        // (unconstrained main axis) or if there isn't any free space.
        if(freeSpace == Infinity || freeSpace <= 0) {
            if(this.vertical) {
                this.idealWidth = crossLength;
                this.idealHeight = Math.min(usedSpace, maxHeight);
            } else {
                this.idealWidth = Math.min(usedSpace, maxWidth);
                this.idealHeight = crossLength;
            }

            // Set unused space to 0; no alignment should be done
            this.unusedSpace = 0;

            // Resolve children's layout, but now with strict constraints so
            // that they stretch properly and shrink children if neccessary (on
            // overflow)
            let spaceLeft = maxLength;
            for(const child of this._children) {
                // Ignore disabled children
                if(!child.enabled) {
                    continue;
                }

                const [oldChildWidth, oldChildHeight] = child.idealDimensions;

                if(this.vertical) {
                    const wantedLength = Math.min(spaceLeft, oldChildHeight);
                    child.resolveDimensions(minCrossAxis, maxWidth, wantedLength, wantedLength);
                } else {
                    const wantedLength = Math.min(spaceLeft, oldChildWidth);
                    child.resolveDimensions(wantedLength, wantedLength, minCrossAxis, maxHeight);
                }

                const childLength = this.vertical ? oldChildHeight
                    : oldChildWidth;
                spaceLeft = Math.max(0, spaceLeft - childLength - spacing);
            }

            return;
        }

        // Resolve children's layout with constraints restricted to distributed
        // free space. Calculate used space after flexbox calculations.
        let usedSpaceAfter = 0;
        let freeSpacePerFlex = 0;
        if(totalFlex > 0) {
            freeSpacePerFlex = freeSpace / totalFlex;
        }

        for(const child of this._children) {
            // Ignore disabled children
            if(!child.enabled) {
                continue;
            }

            // Add spacing to used space if this is not the first widget
            if(usedSpaceAfter !== 0) {
                usedSpaceAfter += spacing;
            }

            const dedicatedSpace = freeSpacePerFlex * child.flex;
            const [oldChildWidth, oldChildHeight] = child.idealDimensions;
            if(this.vertical) {
                const wantedLength = dedicatedSpace + oldChildHeight;
                child.resolveDimensions(
                    minCrossAxis, maxWidth,
                    wantedLength, wantedLength,
                );
            } else {
                const wantedLength = dedicatedSpace + oldChildWidth;
                child.resolveDimensions(
                    wantedLength, wantedLength,
                    minCrossAxis, maxHeight,
                );
            }

            const [childWidth, childHeight] = child.idealDimensions;
            usedSpaceAfter += this.vertical ? childHeight : childWidth;
        }

        // Resolve width and height
        let length;
        if(this.vertical) {
            length = maxHeight;
            this.idealWidth = crossLength;
            this.idealHeight = length;
        } else {
            length = maxWidth;
            this.idealWidth = length;
            this.idealHeight = crossLength;
        }

        // Calculate final unused space; used for alignment. Clamp to zero just
        // in case XXX is that neccessary?
        this.unusedSpace = Math.max(length - usedSpaceAfter, 0);
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Align children
        const alignment = this.multiContainerAlignment;
        const around = alignment.main === FlexAlignment.SpaceAround;
        const between = alignment.main === FlexAlignment.SpaceBetween || around;
        const mainRatio = (between ? 0 : alignment.main as number);
        const crossRatio = (alignment.cross === Alignment.Stretch ? 0 : alignment.cross);
        const effectiveChildren = this.enabledChildCount - 1 + (around ? 2 : 0);
        let extraSpacing;
        if(effectiveChildren <= 0) {
            extraSpacing = 0;
        } else {
            extraSpacing = this.unusedSpace / effectiveChildren;
        }

        let spacing = this.multiContainerSpacing;
        if(between) {
            spacing += extraSpacing;
        }

        let mainOffset = (this.vertical ? y : x) + mainRatio * this.unusedSpace;
        if(around) {
            mainOffset += extraSpacing;
        }

        for(const child of this._children) {
            // Ignore disabled children
            if(!child.enabled) {
                continue;
            }

            const [childWidth, childHeight] = child.idealDimensions;

            if(this.vertical) {
                child.resolvePosition(x + crossRatio * (this.idealWidth - childWidth), mainOffset);
                mainOffset += childHeight + spacing;
            } else {
                child.resolvePosition(mainOffset, y + crossRatio * (this.idealHeight - childHeight));
                mainOffset += childWidth + spacing;
            }
        }
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint children
        for(const child of this._children) {
            child.paint(dirtyRects);
        }
    }
}
