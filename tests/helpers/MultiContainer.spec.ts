import { expect } from 'chai';
import { Alignment, Container, Label, Root, Row, Spacing, type Widget, WidgetProperties } from '../../src/index.js';

type TestElement = [
    widget: Widget,
    test: (i: number, widget: Widget, row: Row) => unknown,
];

function setupTestRoot(elements: TestElement[], properties?: Readonly<WidgetProperties>) {
    const row = new Row<Widget>([], properties);
    for (const elem of elements) {
        row.add(elem[0]);
    }

    const root = new Root(row);
    root.preLayoutUpdate();
    root.resolveLayout();

    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        elem[1](i, elem[0], row);
    }

    return row;
}

function basicSpacing(minWidth: number, maxWidth = Infinity, flex = 0, flexShrink = 0, flexBasis: number | null = null, expectedWidth?: number | null, delta = 1): TestElement {
    if (expectedWidth === undefined) {
        expectedWidth = minWidth;
    }

    return [
        new Spacing({ flex, flexShrink, flexBasis, minWidth, maxWidth }),
        (i, widget) => {
            if (expectedWidth !== null) {
                expect(widget.idealDimensions[0], `Widget at index ${i}`).approximately(expectedWidth, delta);
            }
        }
    ];
}

function intrinsicallySizedSpacing(intrinsicSize: number, flex: number, flexShrink: number, flexBasis: number, expectedWidth: number, delta = 1): TestElement {
    return [
        new Container(new Spacing({ minWidth: intrinsicSize, minHeight: intrinsicSize, flex: 0 }), {
            flex, flexShrink, flexBasis,
            containerPadding: { left: 0, right: 0, top: 0, bottom: 0 },
            containerAlignment: { horizontal: Alignment.SoftStretch, vertical: Alignment.SoftStretch }
        }),
        (i, widget) => {
            expect(widget.idealDimensions[0], `Widget at index ${i}`).approximately(expectedWidth, delta);
        }
    ];
}

describe('MultiContainer tests', () => {
    it('Basic layouts have the right sizes', () => {
        const row = setupTestRoot([
            basicSpacing(200),
            basicSpacing(100),
            basicSpacing(200),
        ], {
            multiContainerSpacing: 10,
        });

        expect(row.idealDimensions[0]).to.equal(520);
    });

    it('Flex has no effect when unconstrained', () => {
        const row = setupTestRoot([
            basicSpacing(200, Infinity, 10),
            basicSpacing(100, Infinity, 5),
            basicSpacing(200, Infinity, 1),
        ], {
            multiContainerSpacing: 10,
        });

        expect(row.idealDimensions[0]).to.equal(520);
    });

    it('Flex distributes space correctly when constrained', () => {
        const row = setupTestRoot([
            basicSpacing(200, Infinity, 1, 0, 0, 250),
            basicSpacing(100, Infinity, 2, 0, 0, 500),
            basicSpacing(200, Infinity, 1, 0, 0, 250),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.idealDimensions[0]).to.equal(1020);
    });

    it('Flex distributes space correctly when constrained and respects minimum element length', () => {
        const row = setupTestRoot([
            basicSpacing(300, Infinity, 1, 0, 0, 300),
            basicSpacing(200, Infinity, 2, 0, 0, 400),
            basicSpacing(300, Infinity, 1, 0, 0, 300),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.idealDimensions[0]).to.equal(1020);
    });

    it('Flex distributes space correctly when constrained and respects maximum element length', () => {
        const row = setupTestRoot([
            basicSpacing(300, Infinity, 1, 0, 0, 333.333),
            basicSpacing(200, 333, 2, 0, 0, 333.333),
            basicSpacing(300, Infinity, 1, 0, 0, 333.333),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.idealDimensions[0]).to.equal(1020);
    });

    it('Flex shrinks space correctly when constrained', () => {
        const elems = [
            basicSpacing(0, Infinity, 0, 1, 500, null),
            basicSpacing(0, Infinity, 0, 2, 500, null),
            basicSpacing(0, Infinity, 0, 1, 500, null),
        ];

        const row = setupTestRoot(elems, {
            multiContainerSpacing: 10,
            maxWidth: 1020,
        });

        expect(elems[0][0].idealDimensions[0]).to.equal(elems[2][0].idealDimensions[0]);
        expect(elems[1][0].idealDimensions[0]).to.be.lessThan(elems[0][0].idealDimensions[0]);
        expect(elems[0][0].idealDimensions[0] + elems[1][0].idealDimensions[0] + elems[2][0].idealDimensions[0] + 20).to.equal(row.idealDimensions[0]);
        expect(row.idealDimensions[0]).to.equal(1020);
    });

    it('Flex shrinks space correctly when constrained and respects minimum element length', () => {
        const elems = [
            basicSpacing(0, Infinity, 0, 1, 1000, null),
            basicSpacing(500, Infinity, 0, 1, 1000),
            basicSpacing(0, Infinity, 0, 1, 1000, null),
        ];

        const row = setupTestRoot(elems, {
            multiContainerSpacing: 10,
            maxWidth: 1020,
        });

        expect(elems[0][0].idealDimensions[0]).to.equal(elems[2][0].idealDimensions[0]);
        expect(elems[0][0].idealDimensions[0] + elems[1][0].idealDimensions[0] + elems[2][0].idealDimensions[0] + 20).to.equal(row.idealDimensions[0]);
        expect(row.idealDimensions[0]).to.equal(1020);
    });

    it('Flex distributes space correctly when using a flexBasis of 0 and growing', () => {
        const elems = [
            intrinsicallySizedSpacing(1000, 1, 0, 0, 333.333),
            intrinsicallySizedSpacing(1000, 1, 0, 0, 333.333),
            intrinsicallySizedSpacing(1000, 1, 0, 0, 333.333),
        ];

        const row = setupTestRoot(elems, {
            multiContainerSpacing: 10,
            minWidth: 1020,
            maxWidth: 1020,
        });

        expect(row.idealDimensions[0]).to.equal(1020);
    });

    // XXX we don't use intrinsic length as a minimum, unlike CSS. we enforce a
    //     strict basis if it's set, to make it easier to balance
    //     multi-containers
    it('Flex makes dimensionless widgets when using a flexBasis of 0 and shrinking', () => {
        const elems = [
            intrinsicallySizedSpacing(1000, 0, 1, 0, 0),
            intrinsicallySizedSpacing(1000, 0, 1, 0, 0),
            intrinsicallySizedSpacing(1000, 0, 1, 0, 0),
        ];

        const row = setupTestRoot(elems, {
            multiContainerSpacing: 10,
            minWidth: 1020,
            maxWidth: 1020,
        });

        expect(row.idealDimensions[0]).to.equal(1020);
    });

    // XXX we don't want to follow the CSS spec's small ratio behaviour
    it('Flex can handle tiny ratios near zero without deviating from normal behaviour', () => {
        const row = setupTestRoot([
            basicSpacing(200, Infinity, 1e-32, 0, 0, 250),
            basicSpacing(100, Infinity, 2e-32, 0, 0, 500),
            basicSpacing(200, Infinity, 1e-32, 0, 0, 250),
        ], {
            multiContainerSpacing: 10,
            minWidth: 1020,
        });

        expect(row.idealDimensions[0]).to.equal(1020);
    });

    // XXX this might seem like a weird thing to test for, but this is a
    //     recurring issue. this is because a label's height depends on its
    //     width due to wrapping
    it('Flex can distribute labels without cross-length growing unnecessarily', () => {
        const testText = 'Somewhat long test wrapping text';
        const elems: TestElement[] = [];
        for (let i = 0; i < 3; i++) {
            elems.push([
                new Label(testText, { flexBasis: 0, flex: 1 }),
                () => {}, // don't check width yet
            ]);
        }

        const row = setupTestRoot(elems, {
            multiContainerSpacing: 10,
            minWidth: 1020,
            maxWidth: 1020,
        });

        const idealWidth = elems[0][0].idealDimensions[0];
        for (let i = 1; i < 3; i++) {
            expect(elems[i][0].idealDimensions[0]).to.be.approximately(idealWidth, 1);
        }

        expect(row.idealDimensions[0]).to.equal(1020);

        setupTestRoot([
            [
                new Label(testText, { flexBasis: 0, flex: 1 }),
                (_i, widget) => {
                    expect(widget.idealDimensions[1]).to.be.approximately(elems[0][0].idealDimensions[1], 1);
                },
            ],
        ], {
            minWidth: idealWidth,
            maxWidth: idealWidth,
        })
    });
});
