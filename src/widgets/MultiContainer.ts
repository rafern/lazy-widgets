import { FlexAlignment } from '../theme/FlexAlignment.js';
import { Widget, WidgetProperties } from './Widget.js';
import { Alignment } from '../theme/Alignment.js';
import { MultiParent } from './MultiParent.js';
import { PropagationModel, WidgetEvent } from '../events/WidgetEvent.js';
import type { TricklingEvent } from '../events/TricklingEvent.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';

const FLEXBOX_EPSILON = 1e-6;
const FLEXBOX_ITER_MAX = 8;

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
    static override autoXML: WidgetAutoXML = {
        name: 'multi-container',
        inputConfig: [
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
        ]
    };

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
        const mainIdx = this.vertical ? 1 : 0;
        const crossIdx = this.vertical ? 0 : 1;
        const minCrossLength = this.vertical ? minWidth : minHeight;
        const maxCrossLength = this.vertical ? maxWidth : maxHeight;
        let totalFlex = 0, totalFlexShrink = 0, crossLength = minCrossLength, minCrossAxis = 0;

        const alignment = this.multiContainerAlignment;
        let needsStretch = alignment.cross === Alignment.Stretch;
        if(needsStretch) {
            minCrossAxis = maxCrossLength;
            if(minCrossAxis === Infinity) {
                minCrossAxis = minCrossLength;
            }
        } else if(alignment.cross === Alignment.SoftStretch) {
            needsStretch = true;
            minCrossAxis = minCrossLength;
        }

        this.enabledChildCount = 0;
        const spacing = this.multiContainerSpacing;
        let usedSpace = 0;
        let usedUnshrinkableSpace = 0;
        let usedUngrowableSpace = 0;
        let minCrossAxisGrowIdx = 0;
        const children = this._children;
        const childCount = children.length;

        for(let i = 0; i < childCount; i++) {
            const child = children[i];

            // Resolve dimensions of disabled children with zero-width
            // constraints just so layout dirty flag is cleared
            if(!child.enabled) {
                child.resolveDimensions(0, 0, 0, 0);
                continue;
            }

            if (this.enabledChildCount !== 0) {
                usedSpace += spacing;
                usedUnshrinkableSpace += spacing;
                usedUngrowableSpace += spacing;
            }

            this.enabledChildCount++;

            const basis = child.flexBasis;
            if (basis === null) {
                if (this.vertical) {
                    child.resolveDimensions(minCrossAxis, maxWidth, 0, Infinity);
                } else {
                    child.resolveDimensions(0, Infinity, minCrossAxis, maxHeight);
                }
            } else {
                if (this.vertical) {
                    child.resolveDimensions(minCrossAxis, maxWidth, basis, basis);
                } else {
                    child.resolveDimensions(basis, basis, minCrossAxis, maxHeight);
                }
            }

            const childDimensions = child.idealDimensions;
            const childLength = childDimensions[mainIdx];
            usedSpace += childLength;
            if (child.flexShrink === 0) {
                usedUnshrinkableSpace += childLength;
            }
            if (child.flex === 0) {
                usedUngrowableSpace += childLength;
            }

            totalFlex += child.flex;
            totalFlexShrink += child.flexShrink;
            const childCrossLength = childDimensions[crossIdx];
            crossLength = Math.max(childCrossLength, crossLength);

            if (needsStretch && childCrossLength > minCrossAxis) {
                minCrossAxis = childCrossLength;
                minCrossAxisGrowIdx = i;
            }
        }

        // <NOTE stretch-cross-axis>
        // If we're stretching the cross axis, but one of the later children
        // caused the minimum cross length to grow, then grow the earlier
        // children to correct the missing cross length. Used space will need to
        // be recalculated, since the main axis length is not guaranteed to be
        // unchanged (we're not doing subtraction of old size and addition of
        // new size to avoid floating point error)
        if (minCrossAxisGrowIdx > 0) {
            usedUngrowableSpace = usedUnshrinkableSpace = usedSpace = spacing * (this.enabledChildCount - 1);

            for(let i = 0; i < childCount; i++) {
                const child = children[i];
                if(!child.enabled) {
                    continue;
                }

                if (i < minCrossAxisGrowIdx) {
                    const basis = child.flexBasis;
                    if (basis === null) {
                        if (this.vertical) {
                            child.resolveDimensions(minCrossAxis, maxWidth, 0, Infinity);
                        } else {
                            child.resolveDimensions(0, Infinity, minCrossAxis, maxHeight);
                        }
                    } else {
                        if (this.vertical) {
                            child.resolveDimensions(minCrossAxis, maxWidth, basis, basis);
                        } else {
                            child.resolveDimensions(basis, basis, minCrossAxis, maxHeight);
                        }
                    }
                }

                const childLength = child.idealDimensions[mainIdx];
                usedSpace += childLength;
                if (child.flexShrink === 0) {
                    usedUnshrinkableSpace += childLength;
                }
                if (child.flex === 0) {
                    usedUngrowableSpace += childLength;
                }
            }
        }

        // If we haven't reached the minimum length, treat it as the maximum
        // length so that the empty space needed to fit the required minimum
        // length is distributed properly
        let targetLength = usedSpace;
        const minLength = this.vertical ? minHeight : minWidth;
        const maxLength = this.vertical ? maxHeight : maxWidth;
        if (usedSpace < minLength) {
            targetLength = minLength;
        }
        if (usedSpace > maxLength) {
            targetLength = maxLength;
        }

        // Don't do flexbox calculations if free space is infinite
        // (unconstrained main axis) or if there isn't any free space.
        const freeSpace = targetLength - usedSpace;
        if(freeSpace === Infinity || freeSpace === 0 || (freeSpace > 0 && totalFlex <= 0) || (freeSpace < 0 && totalFlexShrink <= 0)) {
            if(this.vertical) {
                this.idealWidth = crossLength;
                this.idealHeight = Math.max(Math.min(usedSpace, maxHeight), minHeight);
            } else {
                this.idealWidth = Math.max(Math.min(usedSpace, maxWidth), minWidth);
                this.idealHeight = crossLength;
            }

            // Set unused space to 0; no alignment should be done
            this.unusedSpace = 0;

            // Shrink children where necessary (first children get priority
            // since flexShrink is not being used), and use strict constraints
            // on the cross axis, so that stretch alignment works along it
            // (otherwise maxWidth/maxHeight might never be set to a finite
            // value, causing stretch to never apply). Only re-apply strict
            // constraints if the maximum cross axis length was infinite.
            const needsStrictCross = (maxCrossLength === Infinity);
            if (needsStrictCross || freeSpace < 0) {
                let spaceLeft = targetLength;
                for (let i = 0; i < childCount; i++) {
                    // Ignore disabled children
                    const child = children[i];
                    if(!child.enabled) {
                        continue;
                    }

                    if (spaceLeft < child.idealDimensions[mainIdx]) {
                        if(this.vertical) {
                            child.resolveDimensions(minCrossAxis, crossLength, spaceLeft, spaceLeft);
                        } else {
                            child.resolveDimensions(spaceLeft, spaceLeft, minCrossAxis, crossLength);
                        }

                        spaceLeft = 0;
                    } else {
                        if (needsStrictCross) {
                            const wantedLength = child.idealDimensions[this.vertical ? 1 : 0];
                            if(this.vertical) {
                                child.resolveDimensions(minCrossAxis, crossLength, wantedLength, wantedLength);
                            } else {
                                child.resolveDimensions(wantedLength, wantedLength, minCrossAxis, crossLength);
                            }
                        }

                        spaceLeft = Math.max(0, spaceLeft - child.idealDimensions[mainIdx] - spacing);
                    }
                }
            }

            return;
        }

        // Resolve children's layout with constraints restricted to distributed
        // free space. Calculate used space after flexbox calculations. Loosely
        // follows the w3c flexbox algorithm:
        // https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths
        const wantedLengths = new Array<number>();
        const frozen = new Array<boolean>();
        const shrink = freeSpace < 0;
        const potentialSlack = targetLength - (shrink ? usedUnshrinkableSpace : usedUngrowableSpace);
        let remainingFreeSpace = potentialSlack;
        let scaledFlexTotal = 0;

        for(const child of this._children) {
            // Ignore disabled/inflexible children
            const childFlex = shrink ? child.flexShrink : child.flex;
            if(!child.enabled || childFlex <= 0) {
                continue;
            }

            const childLength = child.idealDimensions[mainIdx];
            wantedLengths.push(childLength);
            frozen.push(false);

            remainingFreeSpace -= childLength;
            if (shrink) {
                scaledFlexTotal += childFlex * childLength;
            } else {
                scaledFlexTotal += childFlex;
            }
        }

        let remainingThawedFreeSpace = remainingFreeSpace;

        // update wanted lengths
        for(let j = 0; j < FLEXBOX_ITER_MAX && Math.abs(remainingFreeSpace) > FLEXBOX_EPSILON && scaledFlexTotal > 0; j++) {
            let i = 0;
            let nextRemainingFreeSpace = potentialSlack;
            let nextRemainingThawedFreeSpace = potentialSlack;
            let nextScaledFlexTotal = 0;

            for (const child of this._children) {
                // Ignored disabled/inflexible children
                const childFlex = shrink ? child.flexShrink : child.flex;
                if (!child.enabled || childFlex <= 0) {
                    continue;
                }

                if (!frozen[i]) {
                    let scaledFlex: number;
                    if (shrink) {
                        const basis = child.idealDimensions[mainIdx];
                        scaledFlex = childFlex * basis;
                    } else {
                        scaledFlex = childFlex;
                    }

                    wantedLengths[i] += scaledFlex * remainingThawedFreeSpace / scaledFlexTotal;

                    if (shrink && wantedLengths[i] <= 0) {
                        wantedLengths[i] = 0;
                        frozen[i] = true;
                    }

                    nextRemainingThawedFreeSpace -= wantedLengths[i];
                    nextScaledFlexTotal += scaledFlex;
                }

                nextRemainingFreeSpace -= wantedLengths[i];
                i++;
            }

            remainingFreeSpace = nextRemainingFreeSpace;
            remainingThawedFreeSpace = nextRemainingThawedFreeSpace;
            scaledFlexTotal = nextScaledFlexTotal;
        }

        // apply wanted lengths
        let i = 0;
        let iEnabled = 0;
        let usedSpaceAfter = 0;
        let needsSpacing = false;
        crossLength = minCrossAxis;
        minCrossAxisGrowIdx = 0;

        for(const child of this._children) {
            // Ignore disabled children
            if(!child.enabled) {
                continue;
            }

            // Add spacing to used space if this is not the first widget
            if(needsSpacing) {
                usedSpaceAfter += spacing;
            } else {
                needsSpacing = true;
            }

            const childFlex = shrink ? child.flexShrink : child.flex;
            let wantedLength = childFlex > 0 ? wantedLengths[i++] : child.idealDimensions[mainIdx];
            if (wantedLength + usedSpaceAfter > targetLength) {
                wantedLength = Math.max(0, targetLength - usedSpaceAfter);
            }

            if (this.vertical) {
                child.resolveDimensions(
                    minCrossAxis, maxWidth,
                    wantedLength, wantedLength,
                );
            } else {
                child.resolveDimensions(
                    wantedLength, wantedLength,
                    minCrossAxis, maxHeight,
                );
            }

            usedSpaceAfter += child.idealDimensions[mainIdx];
            const childCrossLength = child.idealDimensions[crossIdx];
            if (crossLength < childCrossLength) {
                crossLength = childCrossLength;
                if (needsStretch) {
                    minCrossAxis = childCrossLength;
                    minCrossAxisGrowIdx = iEnabled;
                }
            }

            iEnabled++;
        }

        // see <NOTE stretch-cross-axis>
        if (minCrossAxisGrowIdx > 0) {
            i = 0;
            usedSpaceAfter = 0;
            needsSpacing = false;

            for(iEnabled = 0; iEnabled < minCrossAxisGrowIdx; iEnabled++) {
                const child = children[iEnabled];
                if(!child.enabled) {
                    continue;
                }

                if(needsSpacing) {
                    usedSpaceAfter += spacing;
                } else {
                    needsSpacing = true;
                }

                const childFlex = shrink ? child.flexShrink : child.flex;
                let wantedLength = childFlex > 0 ? wantedLengths[i++] : child.idealDimensions[mainIdx];
                if (wantedLength + usedSpaceAfter > targetLength) {
                    wantedLength = Math.max(0, targetLength - usedSpaceAfter);
                }

                if (this.vertical) {
                    child.resolveDimensions(
                        minCrossAxis, maxWidth,
                        wantedLength, wantedLength,
                    );
                } else {
                    child.resolveDimensions(
                        wantedLength, wantedLength,
                        minCrossAxis, maxHeight,
                    );
                }

                usedSpaceAfter += child.idealDimensions[mainIdx];
            }
        }

        // Resolve width and height
        if(this.vertical) {
            this.idealWidth = crossLength;
            this.idealHeight = targetLength;
        } else {
            this.idealWidth = targetLength;
            this.idealHeight = crossLength;
        }

        // Calculate final unused space; used for alignment. Clamp to zero just
        // in case XXX is that neccessary?
        this.unusedSpace = Math.max(targetLength - usedSpaceAfter, 0);
    }

    override resolvePosition(x: number, y: number): void {
        super.resolvePosition(x, y);

        // Align children
        const alignment = this.multiContainerAlignment;
        const around = alignment.main === FlexAlignment.SpaceAround;
        const between = alignment.main === FlexAlignment.SpaceBetween || around;
        const mainRatio = (between ? 0 : alignment.main as number);
        const crossRatio = ((alignment.cross === Alignment.Stretch || alignment.cross === Alignment.SoftStretch) ? 0 : alignment.cross);
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
