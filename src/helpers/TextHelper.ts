import { measureTextDims } from '../helpers/measureTextDims';
import { multiFlagField } from '../decorators/FlagFields';
import { FillStyle } from '../theme/FillStyle';
import { DynMsg, Msg } from '../core/Strings';

const WIDTH_OVERRIDING_CHARS = new Set(['\n', '\t']);

/**
 * A text render group. Contains all neccessary information to position a piece
 * of text.
 *
 * A 4-tuple containing, respectively, the inclusive index where the piece of
 * text starts, the exclusive index where the piece of text ends (including
 * characters that aren't rendered, such as newlines), the right horizontal
 * offset of the piece of text and whether the piece of text overrides width or
 * not.
 *
 * For characters that override width, the text range should have a length of 1
 * and will not be merged with other text render groups, else, it is a hint
 * containing the pre-measured size, for optimisation reasons, and may be merged
 * with other text render groups. Width-overidding groups where the text range
 * length is greater than 1 will have the length of each individual character as
 * an interpolation of the total length, where each character has equal width,
 * which is cheap, but innacurate; this is the reason why it is preferred to
 * have length 1 text range for width-overriding groups although you may still
 * want this for specific reasons (such as trailing space removal).
 * Width-overriding groups are also only meant to be used for whitespaces and
 * will therefore not be painted.
 *
 * Note that 0-width text render groups are valid and used for empty lines.
 *
 * @category Helper
 */
export type TextRenderGroup = [rangeStart: number, rangeEnd: number, right: number, overridesWidth: boolean];

/**
 * A line range. Contains all neccessary information to render a line of text.
 * An array of text render groups.
 *
 * @category Helper
 */
export type LineRange = Array<TextRenderGroup>;

/**
 * The mode to use for text wrapping in {@link TextHelper}.
 *
 * @category Helper
 */
export enum WrapMode {
    /** No text wrapping. Text will overflow if it exceeds the maximum width. */
    None,
    /**
     * Whitespaces always have width. The default wrapping mode for input
     * widgets
     */
    Normal,
    /**
     * Whitespaces at the end of a line which result in an overflow have no
     * width. The default wrapping mode for widgets that display text, since
     * spaces at the beginning of a line due to wrapping looks weird in
     * {@link Label | labels}. Whitespaces at the beginning of a new line are
     * still kept, as they are deliberate.
     */
    Shrink,
}

/**
 * The mode to use for text alignment in {@link TextHelper}.
 *
 * @category Helper
 */
export enum TextAlignMode {
    /** Align to the start of the line. Equivalent to a ratio of 0. */
    Start = 0,
    /** Align to the center of the line. Equivalent to a ratio of 0.5. */
    Center = 0.5,
    /** Align to the end of the line. Equivalent to a ratio of 0.5. */
    End = 1,
}

const CHARSET = '~!@#$%^&*()_+`1234567890-=qwertyuiop[]\\QWERTYUIOP{}|asdfghjkl;\'ASDFGHJKL:"zxcvbnm,./ZXCVBNM<>?';

/**
 * An aggregate helper class for widgets that contain text.
 *
 * Contains utilities for measuring text dimensions, converting between offsets
 * in pixels and text indices and painting.
 *
 * @category Helper
 */
export class TextHelper {
    /**
     * The current string of text.
     *
     * @decorator `@multiFlagField(['_dirty', 'measureDirty'])`
     */
    @multiFlagField(['_dirty', 'measureDirty'])
    text = '';
    /**
     * The current font used for rendering text.
     *
     * @decorator `@multiFlagField(['_dirty', 'measureDirty', 'lineHeightSpacingDirty', 'tabWidthDirty'])`
     */
    @multiFlagField(['_dirty', 'measureDirty', 'lineHeightSpacingDirty', 'tabWidthDirty'])
    font = '';
    /**
     * The current maximum text width. If not Infinite and
     * {@link TextHelper#wrapMode} is not `WrapMode.None`, then text will be
     * wrapped and width will be set to maxWidth.
     *
     * @decorator `@multiFlagField(['_dirty', 'maxWidthDirty'])`
     */
    @multiFlagField(['_dirty', 'maxWidthDirty'])
    maxWidth = Infinity;
    /**
     * The height of each line of text when wrapped. If null, then the helper
     * will try to automatically detect it.
     *
     * @decorator `@multiFlagField(['_dirty', 'measureDirty', 'lineHeightSpacingDirty'])`
     */
    @multiFlagField(['_dirty', 'measureDirty', 'lineHeightSpacingDirty'])
    lineHeight: number | null = null;
    /**
     * The amount of spacing between lines. If null, then the helper will try to
     * automatically detect it.
     *
     * @decorator `@multiFlagField(['_dirty', 'measureDirty', 'lineHeightSpacingDirty'])`
     */
    @multiFlagField(['_dirty', 'measureDirty', 'lineHeightSpacingDirty'])
    lineSpacing: number | null = null;
    /**
     * The amount of spaces that each tab character is equivalent to. By
     * default, it is equivalent to 4 spaces.
     *
     * @decorator `@multiFlagField(['_dirty', 'measureDirty', 'tabWidthDirty'])`
     */
    @multiFlagField(['_dirty', 'measureDirty', 'tabWidthDirty'])
    tabWidth = 4;
    /**
     * The mode for text wrapping
     *
     * @decorator `@multiFlagField(['_dirty', 'measureDirty'])`
     */
    @multiFlagField(['_dirty', 'measureDirty'])
    wrapMode: WrapMode = WrapMode.Normal;
    /**
     * The text alignment mode. Can also be a ratio.
     *
     * Note that this only aligns text in the text's width. If
     * {@link TextHelper#maxWidth} is infinite, then you may still need to align
     * the widget that uses this text helper with a {@link BaseContainer}
     * because the width will be set to the longest line range's width.
     */
    @multiFlagField(['_dirty'])
    alignMode: TextAlignMode | number = TextAlignMode.Start;

    /** The current largest text width. May be outdated. */
    private _width = 0;
    /** The current total text height. May be outdated. */
    private _height = 0;
    /** The current {@link TextHelper#lineHeight}. May be outdated */
    private _lineHeight = 0;
    /** The current {@link TextHelper#lineSpacing}. May be outdated */
    private _lineSpacing = 0;
    /** The actual {@link TextHelper#tabWidth} in pixels. May be outdated */
    private _tabWidth = 0;

    /** Does the text need to be re-measured? */
    private measureDirty = true;
    /** Has the maximum width been changed? */
    private maxWidthDirty = false;
    /** Does the line height or spacing need to be re-measured? */
    private lineHeightSpacingDirty = true;
    /** Does the tab width need to be re-measured? */
    private tabWidthDirty = true;
    /** Has the text (or properties associated with it) changed? */
    private _dirty = false;
    /** See {@link TextHelper#lineRanges}. For internal use only. */
    private _lineRanges: Array<LineRange> = [];
    /** Are any of the lines wrapped? For internal use only. */
    private hasWrappedLines = false;

    /**
     * Has the text (or properties associated with it) changed? Resets
     * {@link TextHelper#_dirty} to false
     */
    get dirty(): boolean {
        const wasDirty = this._dirty;
        this._dirty = false;
        return wasDirty;
    }

    /**
     * Measure a slice of text taking left offset into account. If left offset
     * is 0, then this will also add the left bounding box overhang. If not,
     * then it will just return the width.
     *
     * Only for slices of text which have no width-overriding characters, else,
     * you will get wrong measurements.
     *
     * @returns Returns the new horizontal offset
     */
    private measureTextSlice(left: number, start: number, end: number): number {
        const metrics = measureTextDims(this.text.slice(start, end), this.font);
        if(left === 0)
            return metrics.width + Math.max(0, metrics.actualBoundingBoxLeft);
        else
            return left + metrics.width;
    }

    /**
     * Get width from line range start to index. Handles out of bounds indices,
     * but keeps them in the same line
     */
    private getLineRangeWidthUntil(range: LineRange, index: number): number {
        // If before or at first group's start index, 0 width
        if(index <= range[0][0])
            return 0;

        // Find text render group that this index belongs to
        let groupIndex = 0;
        for(; groupIndex < range.length; groupIndex++) {
            // If index is at this group's end, return group's right value.
            // Most width-overriding groups have a length of 1 and therefore
            // just stop here
            const group = range[groupIndex];
            const groupEnd = group[1];
            if(index == groupEnd)
                return group[2];
            else if(index >= group[0] && index < groupEnd)
                break;
        }

        // If index was after line end, pick end of last group
        if(groupIndex === range.length)
            return range[groupIndex - 1][2];

        // Find left value
        let left = 0;
        if(groupIndex > 0)
            left = range[groupIndex - 1][2];

        // Measure the slice of text. Interpolate if it's a width-overidding
        // group
        const group = range[groupIndex];
        if(group[3])
            return left + group[2] * (index - group[0]) / (group[1] - group[0]);
        else
            return this.measureTextSlice(left, group[0], index);
    }

    /**
     * Similar to {@link measureTextDims}, but uses text render groups for
     * optimisation purposes and for the ability of individual characters to
     * override their natively measured size; tabs having a dynamic size that
     * aligns them to multiples of a value and newlines having no length.
     *
     * @param start - The inclusive index to start measuring at. If there are render groups and unmeasured text before this index, then this value will be overridden to include the unmeasured text. Render groups will also be merged if they don't override width.
     * @param end - The exclusive index to stop measuring at.
     * @param lineRange - The current text render groups for this line of text. This will be updated in place.
     * @param maxWidth - The maximum width of a line of text. If the line contains a single character, this will be ignored.
     * @returns Returns true if the line range was modified and it fit into the maximum width
     */
    private measureText(start: number, end: number, maxWidth: number, lineRange: LineRange): boolean {
        // Remove render groups that intersect the range that will be measured.
        // Removing a group means that the group will have to be re-measured and
        // therefore start is overridden
        let wantedGroups = 0;
        for(; wantedGroups < lineRange.length; wantedGroups++) {
            const group: TextRenderGroup = lineRange[wantedGroups];
            if(start >= group[0] && start < group[1]) {
                start = group[0];
                break;
            }
        }

        // Correct start value; attempt to merge with previous groups or expand
        // the measurement to include previous parts of text that haven't been
        // measured yet
        if(wantedGroups > 0) {
            let lastGroup: TextRenderGroup | null = lineRange[wantedGroups - 1];
            if(lastGroup[1] !== start) {
                start = lastGroup[1];

                if(--wantedGroups > 0)
                    lastGroup = lineRange[wantedGroups];
                else
                    lastGroup = null;
            }

            if(lastGroup !== null && !lastGroup[3] && !WIDTH_OVERRIDING_CHARS.has(this.text[start])) {
                start = lastGroup[0];
                wantedGroups--;
            }
        }

        // Find left horizontal offset
        let left = 0;
        if(wantedGroups > 0)
            left = lineRange[wantedGroups - 1][2];

        // Measure range of text, potentially splitting it into render groups
        let groupStart = start;
        const addedGroups: Array<TextRenderGroup> = [];
        while(groupStart < end) {
            if(this.text[groupStart] === '\t') {
                // Align to tab width
                const tabWidth = this.actualTabWidth;
                left = (Math.floor(left / tabWidth) + 1) * tabWidth;
                addedGroups.push([groupStart, ++groupStart, left, true]);
            }
            else if(this.text[groupStart] === '\n') {
                // Make it 0-width and ignore all other text
                addedGroups.push([groupStart, ++groupStart, left, true]);

                if(groupStart < end)
                    console.warn(Msg.ROGUE_NEWLINE);

                break;
            }
            else {
                // Find group end index; at next width-overriding character or
                // at end
                let nextNewline = this.text.indexOf('\n', groupStart + 1);
                if(nextNewline === -1)
                    nextNewline = Infinity;

                let nextTab = this.text.indexOf('\t', groupStart + 1);
                if(nextTab === -1)
                    nextTab = Infinity;

                const groupEnd = Math.min(nextNewline, nextTab, end);

                // Measure group
                left = this.measureTextSlice(left, groupStart, groupEnd);
                addedGroups.push([groupStart, groupEnd, left, false]);

                groupStart = groupEnd;
            }
        }

        // Check if this fits in maximum width
        const groupCount = wantedGroups + addedGroups.length;
        const lastGroup = addedGroups[addedGroups.length - 1]
                            ?? lineRange[wantedGroups - 1]
                            ?? null;

        if(lastGroup === null) {
            // Lines ranges must have at least one group
            lineRange.length = 0;
            lineRange.push([start, start, 0, false]);
            return true;
        }
        else if((groupCount === 1 && (lastGroup[1] - lastGroup[0]) <= 1) ||
                lastGroup[2] <= maxWidth) {
            lineRange.length = wantedGroups;
            lineRange.push(...addedGroups);
            return true;
        }
        else
            return false;
    }

    /**
     * Update {@link TextHelper#_width}, {@link TextHelper#_lineHeight} and
     * {@link TextHelper#_lineSpacing}. Sets {@link TextHelper#measureDirty} to
     * false. Does nothing if measurement is not needed.
     */
    private updateTextDims(): void {
        // Update line height or line spacing if needed
        if(this.lineHeightSpacingDirty) {
            this.lineHeightSpacingDirty = false;

            const oldLineHeight = this._lineHeight;
            const oldLineSpacing = this._lineSpacing;

            if(this.lineHeight === null || this.lineSpacing === null) {
                const metrics = measureTextDims(CHARSET, this.font);

                if(this.lineHeight === null)
                    this._lineHeight = metrics.actualBoundingBoxAscent;
                else
                    this._lineHeight = this.lineHeight;

                if(this.lineSpacing === null)
                    this._lineSpacing = metrics.actualBoundingBoxDescent;
                else
                    this._lineSpacing = this.lineSpacing;
            }
            else {
                this._lineHeight = this.lineHeight;
                this._lineSpacing = this.lineSpacing;
            }

            // If line height or spacing changed, text needs to be re-measured
            if(oldLineHeight !== this._lineHeight || oldLineSpacing !== this._lineSpacing)
                this.measureDirty = true;
        }

        // If maximum width changed, check if text needs to be re-measured
        if(this.maxWidthDirty && !this.measureDirty) {
            if(this.maxWidth === Infinity) {
                // No wrapping, but some lines were wrapped. Must re-measure
                // text
                if(this.hasWrappedLines)
                    this.measureDirty = true;
                else {
                    // [1] If text doesn't need to be re-measured, then the
                    // width still needs to be updated as it's set to be equal
                    // to maxWidth if maxWidth is not infinity
                    this._width = 0;
                    for(const range of this._lineRanges) {
                        const width = range[range.length - 1][2];
                        if(width > this._width)
                            this._width = width;
                    }
                }
            }
            else {
                // Wrapping, but no lines were wrapped and maxWidth is smaller
                // than previous width. Must re-measure text. If lines were
                // wrapped, must also re-measure
                if(this.hasWrappedLines || this._width > this.maxWidth)
                    this.measureDirty = true;
                else {
                    // ... _width still needs to be updated (see comment [1])
                    this._width = this.maxWidth;
                }
            }
        }

        this.maxWidthDirty = false;

        // Update tab width if needed
        if(this.tabWidthDirty) {
            this.tabWidthDirty = false;
            this._tabWidth = measureTextDims(' ', this.font).width * this.tabWidth;
        }

        // Abort if measurement not needed
        if(!this.measureDirty)
            return;

        // Mark as clean
        this.measureDirty = false;
        this.hasWrappedLines = false;

        const fullLineHeight = this._lineHeight + this._lineSpacing;

        if(this.text.length === 0) {
            // Special case for empty string; set height to height of single
            // line and width to 0 if maxWidth is not set or maxWidth if set
            this._height = fullLineHeight;
            this._width = this.maxWidth === Infinity ? 0 : this.maxWidth;
            this._lineRanges.length = 1;
            this._lineRanges[0] = [[0, 0, 0, false]];
        }
        else if(this.maxWidth === Infinity || this.wrapMode === WrapMode.None) {
            // Don't wrap text, but split lines when there's a newline character
            this._lineRanges.length = 0;
            let lineStart = 0;
            this._height = 0;
            this._width = 0;

            const text = this.text;
            // eslint-disable-next-line no-constant-condition
            while(true) {
                // Where is the next newline?
                const newline = this.text.indexOf('\n', lineStart);
                const atEnd = newline === -1;
                const end = atEnd ? text.length : (newline + 1);

                // Measure this block of text and add it to the line ranges
                const range: LineRange = [];
                this.measureText(lineStart, end, Infinity, range);
                this._lineRanges.push(range);

                this._height += fullLineHeight;
                const width = range[range.length - 1][2];
                if(width > this._width)
                    this._width = width;

                // At end, abort
                if(atEnd)
                    break;

                // Set start of next line
                lineStart = end;
            }

            if(this.maxWidth !== Infinity)
                this._width = this.maxWidth;
        }
        else {
            // Wrap text
            this._lineRanges.length = 0;
            let range: LineRange = [];
            const text = this.text;
            const spaceRegex = /\s/;
            let wordStart = -1;

            for(let i = 0; i <= text.length;) {
                const isSpace = spaceRegex.test(text[i]);
                const atEnd = i === text.length;

                // If this is a whitespace, wrap the previous word and check
                // where this character fits
                if(isSpace || atEnd) {
                    // Try fitting word if any
                    if(wordStart >= 0 && !this.measureText(wordStart, i, this.maxWidth, range)) {
                        // Overflow, check if word fits in new line
                        this.hasWrappedLines = true;
                        const newRange: LineRange = [];
                        if(this.measureText(wordStart, i, this.maxWidth, newRange)) {
                            // Fits in new line. Push old line to line ranges if
                            // it had any text render groups
                            if(range.length === 0)
                                throw new Error(Msg.EMPTY_LINE_RANGE);

                            this._lineRanges.push(range);
                            range = newRange;
                        }
                        else {
                            // Doesn't fit in new line. Fit as much as possible
                            // in current line and move rest to new line by
                            // backtracking to where the split occurs. Don't
                            // reverse this loop; although it may seem more
                            // efficient, it breaks when the word is broken
                            // across more than 2 lines
                            let j = wordStart;
                            for(; j < i - 1; j++) {
                                if(!this.measureText(j, j + 1, this.maxWidth, range))
                                    break;
                            }
                            this._lineRanges.push(range);
                            range = newRange;

                            i = j;
                            wordStart = j;
                            continue;
                        }
                    }

                    wordStart = -1;

                    // End line
                    if(atEnd) {
                        // If there isn't a render group in the line range yet,
                        // add it. Use last group's position. If there isn't a
                        // last group, default to the very beginning
                        if(range.length === 0) {
                            const lastLineRange = this._lineRanges[this._lineRanges.length - 1];
                            if(lastLineRange === undefined)
                                range.push([0, 0, 0, false]);
                            else {
                                const lastGroup = lastLineRange[lastLineRange.length - 1];
                                if(lastGroup === undefined)
                                    range.push([0, 0, 0, false]);
                                else
                                    range.push([lastGroup[1], lastGroup[1], 0, false]);
                            }
                        }

                        this._lineRanges.push(range);
                        break;
                    }

                    // Try fitting whitespace character
                    if(text[i] === '\n') {
                        // Newline character. Break line, but measure text
                        // anyways to update line range
                        this.measureText(i, i + 1, Infinity, range);
                        this._lineRanges.push(range);
                        range = [];
                    }
                    else if(!this.measureText(i, i + 1, this.maxWidth, range)) {
                        // Regular whitespace character overflow: put whitespace
                        // in next line but measure it anyways to update line
                        // range. If in the shrink wrap mode, then group up as
                        // many whitespaces as possible and make a zero-width
                        // group out of them
                        if(this.wrapMode === WrapMode.Shrink) {
                            const spaceGroupStart = i;
                            do {
                                i++;
                            } while(text[i] !== '\n' && spaceRegex.test(text[i]));

                            const lastGroup = range[range.length - 1];
                            range.push([
                                spaceGroupStart,
                                i,
                                lastGroup !== undefined ? lastGroup[2] : 0,
                                true,
                            ]);
                            this._lineRanges.push(range);
                            range = [];
                            continue;
                        }
                        else if(this.wrapMode === WrapMode.Normal) {
                            this.hasWrappedLines = true;
                            this._lineRanges.push(range);
                            range = [];
                            this.measureText(i, i + 1, Infinity, range);
                        }
                        else
                            throw new Error(DynMsg.INVALID_ENUM(this.wrapMode, 'WrapMode', 'wrapMode', true));
                    }
                }
                else if(wordStart === -1)
                    wordStart = i;

                // Incrementing down here so that we don't have to do i = j - 1
                // when splitting words
                i++;
            }

            // Calculate dimensions
            this._width = this.maxWidth;
            this._height = fullLineHeight * this._lineRanges.length;
        }
    }

    /**
     * Paint a single text render group with a given offset and left value for
     * checking if the group is zero-width. left value must not be shifted.
     *
     * Used mainly for injecting debug code; you won't get much use out of this
     * method unless you have a very specific need.
     */
    paintGroup(ctx: CanvasRenderingContext2D, group: TextRenderGroup, left: number, x: number, y: number): void {
        // Skip width-overidding or zero-width render groups
        if(!group[3] && group[2] > left)
            ctx.fillText(this.text.slice(group[0], group[1]), x, y);
    }

    /** Paint all line ranges. */
    paint(ctx: CanvasRenderingContext2D, fillStyle: FillStyle, x: number, y: number): void {
        // Clip
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, this.width, this.height);
        ctx.clip();

        // Apply fill style and font
        ctx.font = this.font;
        ctx.fillStyle = fillStyle;
        ctx.textBaseline = 'alphabetic';

        // Update line ranges if needed
        this.updateTextDims();

        // Paint line (or lines) of text
        const fullLineHeight = this.fullLineHeight;
        let yOffset = y + this._lineHeight;
        for(let line = 0; line < this._lineRanges.length; line++) {
            let left = 0;
            const shift = this.getLineShift(line);
            for(const group of this._lineRanges[line]) {
                this.paintGroup(ctx, group, left, x + left + shift, yOffset);
                left = group[2];
            }

            yOffset += fullLineHeight;
        }

        // Stop clipping
        ctx.restore();
    }

    /**
     * Get the horizontal offset, in pixels, of the beginning of a character at
     * a given index.
     *
     * See {@link TextHelper#findIndexOffsetFromOffset} for the opposite.
     *
     * @returns Returns a 2-tuple containing the offset, in pixels. Vertical offset in the tuple is at the top of the character. Note that this is not neccessarily an integer.
     */
    findOffsetFromIndex(index: number): [x: number, yTop: number] {
        // Update line ranges if needed
        this.updateTextDims();

        // If index is 0, an invalid negative number or there are no lines, it
        // is at the beginning
        if(index <= 0 || this._lineRanges.length === 0)
            return [this.getLineShift(0), 0];

        // Check which line the index is in
        let line = 0;
        for(const range of this._lineRanges) {
            if(index < range[range.length - 1][1])
                break;

            line++;
        }

        // Special case; the index is after the end, pick the end of the text
        if(line >= this._lineRanges.length) {
            line = this._lineRanges.length - 1;
            index = this.text.length;
        }

        // Get horizontal offset
        return [
            this.getLineRangeWidthUntil(this._lineRanges[line], index) + this.getLineShift(line),
            line * this.fullLineHeight,
        ];
    }

    /**
     * Get the index and horizontal offset, in pixels, of the beginning of a
     * character at a given offset.
     *
     * See {@link TextHelper#findOffsetFromIndex} for the opposite.
     *
     * @returns Returns a 2-tuple containing the index of the character at the offset and a 2-tuple containing the offset, in pixels. Note that this is not neccessarily an integer. Note that the returned offset is not the same as the input offset. The returned offset is exactly at the beginning of the character. This is useful for implementing selectable text.
     */
    findIndexOffsetFromOffset(offset: [number, number]): [number, [number, number]] {
        // If offset is before or at first character, text is empty or there are
        // no lines, default to index 0
        const fullLineHeight = this.fullLineHeight;
        const firstShift = this.getLineShift(0);
        if(this.text === '' || (offset[0] <= firstShift && offset[1] < fullLineHeight) || offset[1] < 0)
            return [0, [firstShift, 0]];

        // Find line being selected
        const line = Math.floor(offset[1] / fullLineHeight);

        // Update line ranges if needed
        this.updateTextDims();

        // If this is beyond the last line, pick the last character
        if(line >= this._lineRanges.length) {
            const index = this.text.length;
            return [index, this.findOffsetFromIndex(index)];
        }

        // If this is an empty line, stop
        const yOffset = line * fullLineHeight;
        const range = this._lineRanges[line];
        const shift = this.getLineShift(line);
        if(range.length === 1 && range[0][0] === range[0][1])
            return [range[0][0], [range[0][2] + shift, yOffset]];

        // For each character, find index at which offset is smaller than
        // total length minus half length of current character
        const lineStart = range[0][0];

        // Special case; if line range ends with a newline, ignore last
        // character
        let lineEnd = range[range.length - 1][1];
        if(this.text[lineEnd - 1] === '\n')
            lineEnd--;

        let closestNext = -1;
        let closestNextLen = 0;
        const xOffsetUnshifted = offset[0] - shift;
        let start = lineStart, end = lineEnd + 1, iLast = 0, lenLast = 0;
        do {
            // Measure length from the line start to the end of the current
            // character
            const i = start + Math.floor((end - start) / 2);
            const len = this.getLineRangeWidthUntil(range, i);

            if(len >= xOffsetUnshifted) {
                end = i;
                closestNext = i;
                closestNextLen = len;
            }
            else {
                start = i + 1;
                iLast = i;
                lenLast = len;
            }
        } while(start !== end);

        // If cursor is after halfway point of character, use next character
        // instead
        if(iLast < lineEnd) {
            const iNext = iLast + 1;
            let lenNext = closestNextLen;
            if(closestNext !== iNext)
                lenNext = this.getLineRangeWidthUntil(range, iNext);

            const mid = lenLast + (lenNext - lenLast) / 2;
            if(xOffsetUnshifted >= mid)
                return [iNext, [lenNext + shift, yOffset]];
        }

        return [iLast, [lenLast + shift, yOffset]];
    }

    /**
     * Get a line number from a given cursor index. If out of bounds, returns
     * nearest in-bounds line. Line numbers start at 0.
     */
    getLine(index: number): number {
        if(index <= 0)
            return 0;

        // Update line ranges if needed
        this.updateTextDims();

        for(let line = 0; line < this._lineRanges.length; line++) {
            const lineRange = this._lineRanges[line];
            const lastGroup = lineRange[lineRange.length - 1];
            if(index < lastGroup[1])
                return line;
        }

        return this._lineRanges.length - 1;
    }

    /**
     * Get the index of the start of a line. If out of bounds, returns the
     * nearest in-bounds index
     */
    getLineStart(line: number): number {
        if(line <= 0)
            return 0;

        // Update line ranges if needed
        this.updateTextDims();

        if(line >= this._lineRanges.length) {
            const lastLine = this._lineRanges[this._lineRanges.length - 1];
            return lastLine[lastLine.length - 1][1];
        }

        return this._lineRanges[line][0][0];
    }

    /**
     * Get the index of the end of a line.
     *
     * @param includeNewlines - If false, newline characters will be ignored and the end will be at their index, instead of after their index
     */
    getLineEnd(line: number, includeNewlines = true): number {
        if(line < 0)
            return 0;

        // Update line ranges if needed
        this.updateTextDims();

        if(line >= this._lineRanges.length) {
            const lastLine = this._lineRanges[this._lineRanges.length - 1];
            return lastLine[lastLine.length - 1][1];
        }

        const lineRange = this._lineRanges[line];
        const lastGroup = lineRange[lineRange.length - 1];
        const lastIndex = lastGroup[1];
        if(!includeNewlines && lastIndex > 0 &&
           this.text[lastIndex - 1] === '\n' && lastGroup[0] !== lastGroup[1])
            return lastIndex - 1;
        else
            return lastIndex;
    }

    /**
     * Get the horizontal offset, in pixels, of the start of a line. Takes text
     * wrapping into account. Line indices before first line will be treated as
     * the first line, after the last line will be treated as a new empty line.
     */
    getLineShift(line: number): number {
        // No need to do any logic if aligned to the start
        const ratio: number = this.alignMode;
        if(ratio === 0)
            return 0;

        // Update line ranges if needed
        this.updateTextDims();

        if(line < 0)
            line = 0;
        else if(line >= this._lineRanges.length)
            return this.width * ratio;

        const lineRange = this._lineRanges[line];
        return (this.width - lineRange[lineRange.length - 1][2]) * ratio;
    }

    /** The current text width. Re-measures text if neccessary. */
    get width(): number {
        this.updateTextDims();
        return this._width;
    }

    /** The current total text height. Re-measures text if neccessary. */
    get height(): number {
        this.updateTextDims();
        return this._height;
    }

    /**
     * Which range of text indices are used for each line.
     *
     * If there is no text wrapping (`maxWidth` is `Infinity` or `wrapMode` is
     * `WrapMode.None`), then this will contain a single tuple containing
     * `[0, (text length)]`.
     *
     * If there is text wrapping, then this will be an array where each member
     * is a tuple containing the starting index of a line of text and the ending
     * index (exclusive) of a line of text.
     */
    get lineRanges(): Array<LineRange> {
        this.updateTextDims();
        return [...this._lineRanges];
    }

    /**
     * Get the current line height, even if {@link TextHelper#lineHeight} is
     * null. Re-measures line height if neccessary.
     */
    get actualLineHeight(): number {
        this.updateTextDims();
        return this._lineHeight;
    }

    /**
     * Get the current line spacing, even if {@link TextHelper#lineSpacing} is
     * null. Re-measures line spacing if neccessary.
     */
    get actualLineSpacing(): number {
        this.updateTextDims();
        return this._lineSpacing;
    }

    /** Get the current tab width in pixels. Re-measures if neccessary */
    get actualTabWidth(): number {
        this.updateTextDims();
        return this._tabWidth;
    }

    /**
     * Get the height between the start of each line; the full line height.
     *
     * Equivalent to the sum of {@link TextHelper#actualLineHeight} and
     * {@link TextHelper#actualLineSpacing}
     */
    get fullLineHeight(): number {
        this.updateTextDims();
        return this._lineHeight + this._lineSpacing;
    }
}
