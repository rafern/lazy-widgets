import { Spacing, SpacingProperties } from './Spacing.js';
import { TextInput } from './TextInput.js';
import { Row } from './Row.js';
import { ArtificialConstraint } from './ArtificialConstraint.js';
import type { TextInputProperties } from './TextInput.js';
import type { LabelProperties } from './BaseLabel.js';
import type { LayoutConstraints } from '../core/LayoutConstraints.js';
import type { Widget } from './Widget.js';
import { type Box } from '../state/Box.js';
import { type ValidatedBox } from '../state/ValidatedBox.js';

export interface LabelledTextInputProperties extends LabelProperties, SpacingProperties, TextInputProperties {
    textInputConstraints?: LayoutConstraints;
}

const newlineFilter = (text: string) => text.indexOf('\n') === -1;

/**
 * Base class for {@link LabelledTextInput} and {@link LiveLabelledTextInput}.
 *
 * @category Widget
 */
export abstract class BaseLabelledTextInput extends Row {
    constructor(label: Widget, properties?: Readonly<LabelledTextInputProperties>, propertiesNoID?: Readonly<LabelledTextInputProperties>, variable?: ValidatedBox<string, unknown> | Box<string>) {
        super([
            label,
            new Spacing(propertiesNoID),
            new ArtificialConstraint(
                new TextInput(variable, {
                    inputFilter: newlineFilter,
                    wrapText: false,
                    ...propertiesNoID
                }),
                properties?.textInputConstraints ?? [150, 150, 0, Infinity]
            )
        ], properties);
    }
}
