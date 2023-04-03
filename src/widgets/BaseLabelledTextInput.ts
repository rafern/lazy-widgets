import { Spacing, SpacingProperties } from './Spacing';
import { TextInput } from './TextInput';
import { Row } from './Row';
import { ArtificialConstraint } from './ArtificialConstraint';

import type { ValidatedVariable } from '../state/ValidatedVariable';
import type { TextInputProperties } from './TextInput';
import type { LabelProperties } from './BaseLabel';
import type { LayoutConstraints } from '../core/LayoutConstraints';
import type { Widget } from './Widget';

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
    constructor(label: Widget, properties?: Readonly<LabelledTextInputProperties>, propertiesNoID?: Readonly<LabelledTextInputProperties>, variable?: ValidatedVariable<string, unknown>) {
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
