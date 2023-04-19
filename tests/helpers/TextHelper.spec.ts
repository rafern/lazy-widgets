import { expect } from 'chai';
import { TextAlignMode, TextHelper, WrapMode } from '../../src/index.js';

const MULTILINE_TEXT = `\
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Aenean pharetra magna ac placerat vestibulum lectus.
Cursus vitae congue mauris rhoncus aenean vel elit.
Massa tempor nec feugiat nisl.
Cursus metus aliquam eleifend mi in nulla posuere.
Eu ultrices vitae auctor eu augue ut lectus.
Pretium viverra suspendisse potenti nullam ac tortor vitae purus.
Nulla pharetra diam sit amet nisl. Et sollicitudin ac orci phasellus egestas.
Sagittis nisl rhoncus mattis rhoncus urna neque viverra justo.
Leo integer malesuada nunc vel risus commodo viverra.
Adipiscing commodo elit at imperdiet dui accumsan.
Sagittis aliquam malesuada bibendum arcu vitae elementum curabitur vitae nunc.
Lectus quam id leo in vitae turpis massa sed.
Faucibus pulvinar elementum integer enim neque volutpat ac.
Condimentum id venenatis a condimentum vitae sapien.`;
const MULTILINE_LENGTH = MULTILINE_TEXT.length;
const MULTILINE_LINES = MULTILINE_TEXT.split('\n');
const MULTILINE_COUNT = MULTILINE_LINES.length;
const MULTILINE_START: number[] = [];

for (let startIndex = 0, line = 0; line < MULTILINE_COUNT; line++) {
    MULTILINE_START.push(startIndex);
    startIndex += MULTILINE_LINES[line].length + 1;
}

describe('TextHelper tests', () => {
    it('Changing text marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.text = 'Example text';
        expect(textHelper.dirty).to.be.true;
    });

    it('Changing font marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.font = '16px sans-serif';
        expect(textHelper.dirty).to.be.true;
    });

    it('Changing maxWidth marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.maxWidth = 100;
        expect(textHelper.dirty).to.be.true;
    });

    it('Changing lineHeight marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.lineHeight = 24;
        expect(textHelper.dirty).to.be.true;
    });

    it('Changing lineSpacing marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.lineSpacing = 8;
        expect(textHelper.dirty).to.be.true;
    });

    it('Changing tabWidth marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.tabWidth = 8;
        expect(textHelper.dirty).to.be.true;
    });

    it('Changing wrapMode marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.wrapMode = WrapMode.Shrink;
        expect(textHelper.dirty).to.be.true;
    });

    it('Changing alignMode marks as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.alignMode = TextAlignMode.End;
        expect(textHelper.dirty).to.be.true;
    });

    it('Checking if a TextHelper is dirty unmarks it as dirty', () => {
        const textHelper = new TextHelper();
        expect(textHelper.dirty).to.be.false;
        textHelper.text = 'Example text';
        expect(textHelper.dirty).to.be.true;
        expect(textHelper.dirty).to.be.false;
    });

    it('Lines have the correct line start index', () => {
        const textHelper = new TextHelper();
        textHelper.text = MULTILINE_TEXT;

        for (let i = 0; i < MULTILINE_COUNT; i++) {
            expect(textHelper.getLineStart(i)).to.be.equal(MULTILINE_START[i]);
        }
    });

    it('Start-aligned lines have a horizontal offset of 0 at the start of the line', () => {
        const textHelper = new TextHelper();
        textHelper.alignMode = TextAlignMode.Start;
        textHelper.text = MULTILINE_TEXT;

        for (let i = 0; i < MULTILINE_COUNT; i++) {
            const startIndex = textHelper.getLineStart(i);
            expect(textHelper.findOffsetFromIndex(startIndex)[0]).to.be.equal(0);
        }
    });

    it('End-aligned lines have a horizontal offset equal to the width at the end of the line', () => {
        const textHelper = new TextHelper();
        textHelper.alignMode = TextAlignMode.End;
        textHelper.text = MULTILINE_TEXT;

        expect(textHelper.lineRanges.length).to.be.equal(MULTILINE_COUNT, 'line count matches line range count (no wrapping occurred)');

        for (let i = 0; i < MULTILINE_COUNT; i++) {
            const endIndex = textHelper.getLineEnd(i, false);
            expect(textHelper.findOffsetFromIndex(endIndex)[0]).to.be.equal(textHelper.width);
        }
    });

    it('End-aligned lines have a horizontal offset equal to the width at the end of the line when wrapped in normal mode', () => {
        const textHelper = new TextHelper();
        textHelper.alignMode = TextAlignMode.End;
        textHelper.text = MULTILINE_TEXT;

        const measuredWidth = textHelper.width;
        expect(measuredWidth).to.be.greaterThan(0, 'width is non-zero');

        textHelper.wrapMode = WrapMode.Normal;
        textHelper.maxWidth = measuredWidth / 2;

        const lineRangeCount = textHelper.lineRanges.length;
        expect(lineRangeCount).to.be.greaterThan(MULTILINE_COUNT, 'line range count is greater than line count (wrapping occurred)');

        for (let i = 0; i < lineRangeCount; i++) {
            const endIndex = textHelper.getLineEnd(i, false);
            expect(textHelper.findOffsetFromIndex(endIndex, true)[0]).to.be.equal(textHelper.width);
        }
    });

    it('End-aligned lines have a horizontal offset equal to the width at the end of the line when wrapped in shrink mode', () => {
        const textHelper = new TextHelper();
        textHelper.alignMode = TextAlignMode.End;
        textHelper.text = MULTILINE_TEXT;

        const measuredWidth = textHelper.width;
        expect(measuredWidth).to.be.greaterThan(0, 'width is non-zero');

        textHelper.wrapMode = WrapMode.Shrink;
        textHelper.maxWidth = measuredWidth / 2;

        const lineRangeCount = textHelper.lineRanges.length;
        expect(lineRangeCount).to.be.greaterThan(MULTILINE_COUNT, 'line range count is greater than line count (wrapping occurred)');

        for (let i = 0; i < lineRangeCount; i++) {
            const endIndex = textHelper.getLineEnd(i, false);
            expect(textHelper.findOffsetFromIndex(endIndex, true)[0]).to.be.equal(textHelper.width);
        }
    });

    it('Vertical offset of each line is different when wrapped in normal mode', () => {
        const textHelper = new TextHelper();
        textHelper.text = MULTILINE_TEXT;

        const measuredWidth = textHelper.width;
        expect(measuredWidth).to.be.greaterThan(0, 'width is non-zero');

        textHelper.wrapMode = WrapMode.Normal;
        textHelper.maxWidth = measuredWidth / 2;

        const lineRangeCount = textHelper.lineRanges.length;
        expect(lineRangeCount).to.be.greaterThan(MULTILINE_COUNT, 'line range count is greater than line count (wrapping occurred)');

        let lastVerticalOffsetStart = -Infinity, lastVerticalOffsetEnd = -Infinity;
        for (let i = 0; i < lineRangeCount; i++) {
            const startIndex = textHelper.getLineStart(i);
            const verticalOffsetStart = textHelper.findOffsetFromIndex(startIndex)[1];
            expect(verticalOffsetStart).to.be.greaterThan(lastVerticalOffsetStart, 'vertical offset at line start increases');
            lastVerticalOffsetStart = verticalOffsetStart;

            const endIndex = textHelper.getLineEnd(i, false);
            const verticalOffsetEnd = textHelper.findOffsetFromIndex(endIndex, true)[1];
            expect(verticalOffsetEnd).to.be.greaterThan(lastVerticalOffsetEnd, 'vertical offset at line end increases');
            lastVerticalOffsetEnd = verticalOffsetEnd;
        }
    });

    it('findOffsetFromIndex and findIndexOffsetFromOffset are symmetrical', () => {
        const textHelper = new TextHelper();
        textHelper.text = MULTILINE_TEXT;

        for (let i = 0; i <= MULTILINE_LENGTH; i++) {
            const offset = textHelper.findOffsetFromIndex(i);
            const [iMapped, offsetMapped] = textHelper.findIndexOffsetFromOffset(offset);
            expect(i).to.be.equal(iMapped, 'index is symmetrical');
            expect(offset).to.be.deep.equal(offsetMapped, 'offset is symmetrical');
        }
    });

    it('findOffsetFromIndex and findIndexOffsetFromOffset are symmetrical when wrapped in normal mode', () => {
        const textHelper = new TextHelper();
        textHelper.text = MULTILINE_TEXT;

        const measuredWidth = textHelper.width;
        expect(measuredWidth).to.be.greaterThan(0, 'width is non-zero');

        textHelper.wrapMode = WrapMode.Normal;
        textHelper.maxWidth = measuredWidth / 2;

        for (let i = 0; i <= MULTILINE_LENGTH; i++) {
            const offset = textHelper.findOffsetFromIndex(i);
            const [iMapped, offsetMapped] = textHelper.findIndexOffsetFromOffset(offset);
            expect(i).to.be.equal(iMapped, 'index is symmetrical');
            expect(offset).to.be.deep.equal(offsetMapped, 'offset is symmetrical');
        }
    });

    it('findOffsetFromIndex and findIndexOffsetFromOffset are symmetrical when wrapped in shrink mode', () => {
        const textHelper = new TextHelper();
        textHelper.text = MULTILINE_TEXT;

        const measuredWidth = textHelper.width;
        expect(measuredWidth).to.be.greaterThan(0, 'width is non-zero');

        textHelper.wrapMode = WrapMode.Shrink;
        textHelper.maxWidth = measuredWidth / 2;

        for (let i = 0; i <= MULTILINE_LENGTH; i++) {
            const offset = textHelper.findOffsetFromIndex(i);
            const [iMapped, offsetMapped] = textHelper.findIndexOffsetFromOffset(offset);
            expect(i).to.be.equal(iMapped, 'index is symmetrical');
            expect(offset).to.be.deep.equal(offsetMapped, 'offset is symmetrical');
        }
    });
});
