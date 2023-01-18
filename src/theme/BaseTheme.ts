import type { FlexAlignment2D } from './FlexAlignment2D';
import type { ThemeProperties } from './ThemeProperties';
import { TextAlignMode } from '../helpers/TextHelper';
import type { Alignment2D } from './Alignment2D';
import { FlexAlignment } from './FlexAlignment';
import type { FillStyle } from './FillStyle';
import type { Padding } from './Padding';
import { Alignment } from './Alignment';
import type { Theme } from './Theme';

/**
 * The base class for {@link Widget} and {@link Theme}. The backbone of the
 * theming system.
 *
 * @category Theme
 */
export class BaseTheme implements ThemeProperties {
    /** See {@link BaseTheme#fallbackTheme} */
    private _fallbackTheme?: Theme;
    /** Listener for theme fallback */
    private listener: ((property: string | null) => void) | null = null;

    /**
     * The fallback theme. If this theme has a missing property, the fallback
     * theme's property will be used instead. This will automatically
     * (un)subscribe to/from the fallback theme.
     */
    protected get fallbackTheme(): Theme | undefined {
        return this._fallbackTheme;
    }

    protected set fallbackTheme(newTheme: Theme | undefined) {
        if(this._fallbackTheme === newTheme)
            return;

        // Unsubscribe from old theme
        const oldTheme = this._fallbackTheme;
        if(typeof oldTheme !== 'undefined' && this.listener !== null)
            oldTheme.unsubscribe(this.listener);

        // Subscribe to new theme
        if(typeof newTheme !== 'undefined') {
            this.listener = (property: string | null) => this.onThemeUpdated(property);
            newTheme.subscribe(this.listener);
        }

        // Set theme
        this._fallbackTheme = newTheme;

        // Notify that the fallback theme has changed
        this.onThemeUpdated();
    }

    /**
     * Called when the fallback theme changes. Does nothing by default.
     *
     * @param property - The property name of the theme property that was updated. If a general theme update, then this will be null and all theme properties should be treated as changed.
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    protected onThemeUpdated(property: string | null = null): void {}

    /** Create a new BaseTheme */
    constructor(properties?: ThemeProperties, fallbackTheme?: Theme) {
        this._fallbackTheme = fallbackTheme;

        if(typeof properties === 'undefined')
            return;

        // XXX BASETHEME CTOR AUTO-GENERATED CODE START
        this._canvasFill = properties.canvasFill;
        this._containerPadding = properties.containerPadding;
        this._containerAlignment = properties.containerAlignment;
        this._multiContainerSpacing = properties.multiContainerSpacing;
        this._multiContainerAlignment = properties.multiContainerAlignment;
        this._primaryFill = properties.primaryFill;
        this._accentFill = properties.accentFill;
        this._backgroundFill = properties.backgroundFill;
        this._backgroundGlowFill = properties.backgroundGlowFill;
        this._sliderMinLength = properties.sliderMinLength;
        this._sliderThickness = properties.sliderThickness;
        this._bodyTextFont = properties.bodyTextFont;
        this._bodyTextFill = properties.bodyTextFill;
        this._bodyTextHeight = properties.bodyTextHeight;
        this._bodyTextSpacing = properties.bodyTextSpacing;
        this._bodyTextAlign = properties.bodyTextAlign;
        this._checkboxLength = properties.checkboxLength;
        this._checkboxInnerPadding = properties.checkboxInnerPadding;
        this._inputBackgroundFill = properties.inputBackgroundFill;
        this._inputSelectBackgroundFill = properties.inputSelectBackgroundFill;
        this._inputTextFont = properties.inputTextFont;
        this._inputTextFill = properties.inputTextFill;
        this._inputTextFillDisabled = properties.inputTextFillDisabled;
        this._inputTextFillInvalid = properties.inputTextFillInvalid;
        this._inputTextHeight = properties.inputTextHeight;
        this._inputTextSpacing = properties.inputTextSpacing;
        this._inputTextInnerPadding = properties.inputTextInnerPadding;
        this._inputTextMinWidth = properties.inputTextMinWidth;
        this._inputTextAlign = properties.inputTextAlign;
        this._blinkRate = properties.blinkRate;
        this._cursorThickness = properties.cursorThickness;
        this._scrollBarThickness = properties.scrollBarThickness;
        this._scrollBarMinPercent = properties.scrollBarMinPercent;
        this._scrollBarMinPixels = properties.scrollBarMinPixels;
        this._radioButtonLength = properties.radioButtonLength;
        this._radioButtonInnerPadding = properties.radioButtonInnerPadding;
        // XXX BASETHEME CTOR AUTO-GENERATED CODE END
    }

    // XXX BASETHEME AUTO-GENERATED CODE START
    /** See {@link BaseTheme#canvasFill}. For internal use only. */
    private _canvasFill?: FillStyle;

    get canvasFill(): FillStyle {
        return this._canvasFill ?? this._fallbackTheme?.canvasFill ?? 'rgba(0,0,0,0.5)';
    }

    set canvasFill(value: FillStyle | undefined) {
        if(this._canvasFill !== value) {
            this._canvasFill = value;
            this.onThemeUpdated('canvasFill');
        }
    }

    /** See {@link BaseTheme#containerPadding}. For internal use only. */
    private _containerPadding?: Padding;

    get containerPadding(): Padding {
        return this._containerPadding ?? this._fallbackTheme?.containerPadding ?? <Padding>{left: 4, right: 4, top: 4, bottom: 4};
    }

    set containerPadding(value: Padding | undefined) {
        if(this._containerPadding !== value) {
            this._containerPadding = value;
            this.onThemeUpdated('containerPadding');
        }
    }

    /** See {@link BaseTheme#containerAlignment}. For internal use only. */
    private _containerAlignment?: Alignment2D;

    get containerAlignment(): Alignment2D {
        return this._containerAlignment ?? this._fallbackTheme?.containerAlignment ?? <Alignment2D>{horizontal: Alignment.Start, vertical: Alignment.Start};
    }

    set containerAlignment(value: Alignment2D | undefined) {
        if(this._containerAlignment !== value) {
            this._containerAlignment = value;
            this.onThemeUpdated('containerAlignment');
        }
    }

    /** See {@link BaseTheme#multiContainerSpacing}. For internal use only. */
    private _multiContainerSpacing?: number;

    get multiContainerSpacing(): number {
        return this._multiContainerSpacing ?? this._fallbackTheme?.multiContainerSpacing ?? 4;
    }

    set multiContainerSpacing(value: number | undefined) {
        if(this._multiContainerSpacing !== value) {
            this._multiContainerSpacing = value;
            this.onThemeUpdated('multiContainerSpacing');
        }
    }

    /** See {@link BaseTheme#multiContainerAlignment}. For internal use only. */
    private _multiContainerAlignment?: FlexAlignment2D;

    get multiContainerAlignment(): FlexAlignment2D {
        return this._multiContainerAlignment ?? this._fallbackTheme?.multiContainerAlignment ?? <FlexAlignment2D>{main: FlexAlignment.SpaceBetween, cross: Alignment.Stretch};
    }

    set multiContainerAlignment(value: FlexAlignment2D | undefined) {
        if(this._multiContainerAlignment !== value) {
            this._multiContainerAlignment = value;
            this.onThemeUpdated('multiContainerAlignment');
        }
    }

    /** See {@link BaseTheme#primaryFill}. For internal use only. */
    private _primaryFill?: FillStyle;

    get primaryFill(): FillStyle {
        return this._primaryFill ?? this._fallbackTheme?.primaryFill ?? 'rgb(0,127,255)';
    }

    set primaryFill(value: FillStyle | undefined) {
        if(this._primaryFill !== value) {
            this._primaryFill = value;
            this.onThemeUpdated('primaryFill');
        }
    }

    /** See {@link BaseTheme#accentFill}. For internal use only. */
    private _accentFill?: FillStyle;

    get accentFill(): FillStyle {
        return this._accentFill ?? this._fallbackTheme?.accentFill ?? 'rgb(0,195,255)';
    }

    set accentFill(value: FillStyle | undefined) {
        if(this._accentFill !== value) {
            this._accentFill = value;
            this.onThemeUpdated('accentFill');
        }
    }

    /** See {@link BaseTheme#backgroundFill}. For internal use only. */
    private _backgroundFill?: FillStyle;

    get backgroundFill(): FillStyle {
        return this._backgroundFill ?? this._fallbackTheme?.backgroundFill ?? 'rgb(32,32,32)';
    }

    set backgroundFill(value: FillStyle | undefined) {
        if(this._backgroundFill !== value) {
            this._backgroundFill = value;
            this.onThemeUpdated('backgroundFill');
        }
    }

    /** See {@link BaseTheme#backgroundGlowFill}. For internal use only. */
    private _backgroundGlowFill?: FillStyle;

    get backgroundGlowFill(): FillStyle {
        return this._backgroundGlowFill ?? this._fallbackTheme?.backgroundGlowFill ?? 'rgb(48,48,48)';
    }

    set backgroundGlowFill(value: FillStyle | undefined) {
        if(this._backgroundGlowFill !== value) {
            this._backgroundGlowFill = value;
            this.onThemeUpdated('backgroundGlowFill');
        }
    }

    /** See {@link BaseTheme#sliderMinLength}. For internal use only. */
    private _sliderMinLength?: number;

    get sliderMinLength(): number {
        return this._sliderMinLength ?? this._fallbackTheme?.sliderMinLength ?? 100;
    }

    set sliderMinLength(value: number | undefined) {
        if(this._sliderMinLength !== value) {
            this._sliderMinLength = value;
            this.onThemeUpdated('sliderMinLength');
        }
    }

    /** See {@link BaseTheme#sliderThickness}. For internal use only. */
    private _sliderThickness?: number;

    get sliderThickness(): number {
        return this._sliderThickness ?? this._fallbackTheme?.sliderThickness ?? 10;
    }

    set sliderThickness(value: number | undefined) {
        if(this._sliderThickness !== value) {
            this._sliderThickness = value;
            this.onThemeUpdated('sliderThickness');
        }
    }

    /** See {@link BaseTheme#bodyTextFont}. For internal use only. */
    private _bodyTextFont?: string;

    get bodyTextFont(): string {
        return this._bodyTextFont ?? this._fallbackTheme?.bodyTextFont ?? '1rem sans-serif';
    }

    set bodyTextFont(value: string | undefined) {
        if(this._bodyTextFont !== value) {
            this._bodyTextFont = value;
            this.onThemeUpdated('bodyTextFont');
        }
    }

    /** See {@link BaseTheme#bodyTextFill}. For internal use only. */
    private _bodyTextFill?: FillStyle;

    get bodyTextFill(): FillStyle {
        return this._bodyTextFill ?? this._fallbackTheme?.bodyTextFill ?? 'white';
    }

    set bodyTextFill(value: FillStyle | undefined) {
        if(this._bodyTextFill !== value) {
            this._bodyTextFill = value;
            this.onThemeUpdated('bodyTextFill');
        }
    }

    /** See {@link BaseTheme#bodyTextHeight}. For internal use only. */
    private _bodyTextHeight?: number | null;

    get bodyTextHeight(): number | null {
        return this._bodyTextHeight ?? this._fallbackTheme?.bodyTextHeight ?? null;
    }

    set bodyTextHeight(value: number | null | undefined) {
        if(this._bodyTextHeight !== value) {
            this._bodyTextHeight = value;
            this.onThemeUpdated('bodyTextHeight');
        }
    }

    /** See {@link BaseTheme#bodyTextSpacing}. For internal use only. */
    private _bodyTextSpacing?: number | null;

    get bodyTextSpacing(): number | null {
        return this._bodyTextSpacing ?? this._fallbackTheme?.bodyTextSpacing ?? null;
    }

    set bodyTextSpacing(value: number | null | undefined) {
        if(this._bodyTextSpacing !== value) {
            this._bodyTextSpacing = value;
            this.onThemeUpdated('bodyTextSpacing');
        }
    }

    /** See {@link BaseTheme#bodyTextAlign}. For internal use only. */
    private _bodyTextAlign?: TextAlignMode | number;

    get bodyTextAlign(): TextAlignMode | number {
        return this._bodyTextAlign ?? this._fallbackTheme?.bodyTextAlign ?? TextAlignMode.Start;
    }

    set bodyTextAlign(value: TextAlignMode | number | undefined) {
        if(this._bodyTextAlign !== value) {
            this._bodyTextAlign = value;
            this.onThemeUpdated('bodyTextAlign');
        }
    }

    /** See {@link BaseTheme#checkboxLength}. For internal use only. */
    private _checkboxLength?: number;

    get checkboxLength(): number {
        return this._checkboxLength ?? this._fallbackTheme?.checkboxLength ?? 12;
    }

    set checkboxLength(value: number | undefined) {
        if(this._checkboxLength !== value) {
            this._checkboxLength = value;
            this.onThemeUpdated('checkboxLength');
        }
    }

    /** See {@link BaseTheme#checkboxInnerPadding}. For internal use only. */
    private _checkboxInnerPadding?: number;

    get checkboxInnerPadding(): number {
        return this._checkboxInnerPadding ?? this._fallbackTheme?.checkboxInnerPadding ?? 2;
    }

    set checkboxInnerPadding(value: number | undefined) {
        if(this._checkboxInnerPadding !== value) {
            this._checkboxInnerPadding = value;
            this.onThemeUpdated('checkboxInnerPadding');
        }
    }

    /** See {@link BaseTheme#inputBackgroundFill}. For internal use only. */
    private _inputBackgroundFill?: FillStyle;

    get inputBackgroundFill(): FillStyle {
        return this._inputBackgroundFill ?? this._fallbackTheme?.inputBackgroundFill ?? 'white';
    }

    set inputBackgroundFill(value: FillStyle | undefined) {
        if(this._inputBackgroundFill !== value) {
            this._inputBackgroundFill = value;
            this.onThemeUpdated('inputBackgroundFill');
        }
    }

    /** See {@link BaseTheme#inputSelectBackgroundFill}. For internal use only. */
    private _inputSelectBackgroundFill?: FillStyle;

    get inputSelectBackgroundFill(): FillStyle {
        return this._inputSelectBackgroundFill ?? this._fallbackTheme?.inputSelectBackgroundFill ?? 'rgb(0,195,255)';
    }

    set inputSelectBackgroundFill(value: FillStyle | undefined) {
        if(this._inputSelectBackgroundFill !== value) {
            this._inputSelectBackgroundFill = value;
            this.onThemeUpdated('inputSelectBackgroundFill');
        }
    }

    /** See {@link BaseTheme#inputTextFont}. For internal use only. */
    private _inputTextFont?: string;

    get inputTextFont(): string {
        return this._inputTextFont ?? this._fallbackTheme?.inputTextFont ?? '1rem monospace';
    }

    set inputTextFont(value: string | undefined) {
        if(this._inputTextFont !== value) {
            this._inputTextFont = value;
            this.onThemeUpdated('inputTextFont');
        }
    }

    /** See {@link BaseTheme#inputTextFill}. For internal use only. */
    private _inputTextFill?: FillStyle;

    get inputTextFill(): FillStyle {
        return this._inputTextFill ?? this._fallbackTheme?.inputTextFill ?? 'black';
    }

    set inputTextFill(value: FillStyle | undefined) {
        if(this._inputTextFill !== value) {
            this._inputTextFill = value;
            this.onThemeUpdated('inputTextFill');
        }
    }

    /** See {@link BaseTheme#inputTextFillDisabled}. For internal use only. */
    private _inputTextFillDisabled?: FillStyle;

    get inputTextFillDisabled(): FillStyle {
        return this._inputTextFillDisabled ?? this._fallbackTheme?.inputTextFillDisabled ?? 'grey';
    }

    set inputTextFillDisabled(value: FillStyle | undefined) {
        if(this._inputTextFillDisabled !== value) {
            this._inputTextFillDisabled = value;
            this.onThemeUpdated('inputTextFillDisabled');
        }
    }

    /** See {@link BaseTheme#inputTextFillInvalid}. For internal use only. */
    private _inputTextFillInvalid?: FillStyle;

    get inputTextFillInvalid(): FillStyle {
        return this._inputTextFillInvalid ?? this._fallbackTheme?.inputTextFillInvalid ?? 'red';
    }

    set inputTextFillInvalid(value: FillStyle | undefined) {
        if(this._inputTextFillInvalid !== value) {
            this._inputTextFillInvalid = value;
            this.onThemeUpdated('inputTextFillInvalid');
        }
    }

    /** See {@link BaseTheme#inputTextHeight}. For internal use only. */
    private _inputTextHeight?: number | null;

    get inputTextHeight(): number | null {
        return this._inputTextHeight ?? this._fallbackTheme?.inputTextHeight ?? null;
    }

    set inputTextHeight(value: number | null | undefined) {
        if(this._inputTextHeight !== value) {
            this._inputTextHeight = value;
            this.onThemeUpdated('inputTextHeight');
        }
    }

    /** See {@link BaseTheme#inputTextSpacing}. For internal use only. */
    private _inputTextSpacing?: number | null;

    get inputTextSpacing(): number | null {
        return this._inputTextSpacing ?? this._fallbackTheme?.inputTextSpacing ?? null;
    }

    set inputTextSpacing(value: number | null | undefined) {
        if(this._inputTextSpacing !== value) {
            this._inputTextSpacing = value;
            this.onThemeUpdated('inputTextSpacing');
        }
    }

    /** See {@link BaseTheme#inputTextInnerPadding}. For internal use only. */
    private _inputTextInnerPadding?: number;

    get inputTextInnerPadding(): number {
        return this._inputTextInnerPadding ?? this._fallbackTheme?.inputTextInnerPadding ?? 2;
    }

    set inputTextInnerPadding(value: number | undefined) {
        if(this._inputTextInnerPadding !== value) {
            this._inputTextInnerPadding = value;
            this.onThemeUpdated('inputTextInnerPadding');
        }
    }

    /** See {@link BaseTheme#inputTextMinWidth}. For internal use only. */
    private _inputTextMinWidth?: number;

    get inputTextMinWidth(): number {
        return this._inputTextMinWidth ?? this._fallbackTheme?.inputTextMinWidth ?? 100;
    }

    set inputTextMinWidth(value: number | undefined) {
        if(this._inputTextMinWidth !== value) {
            this._inputTextMinWidth = value;
            this.onThemeUpdated('inputTextMinWidth');
        }
    }

    /** See {@link BaseTheme#inputTextAlign}. For internal use only. */
    private _inputTextAlign?: TextAlignMode | number;

    get inputTextAlign(): TextAlignMode | number {
        return this._inputTextAlign ?? this._fallbackTheme?.inputTextAlign ?? TextAlignMode.Start;
    }

    set inputTextAlign(value: TextAlignMode | number | undefined) {
        if(this._inputTextAlign !== value) {
            this._inputTextAlign = value;
            this.onThemeUpdated('inputTextAlign');
        }
    }

    /** See {@link BaseTheme#blinkRate}. For internal use only. */
    private _blinkRate?: number;

    get blinkRate(): number {
        return this._blinkRate ?? this._fallbackTheme?.blinkRate ?? 0.8;
    }

    set blinkRate(value: number | undefined) {
        if(this._blinkRate !== value) {
            this._blinkRate = value;
            this.onThemeUpdated('blinkRate');
        }
    }

    /** See {@link BaseTheme#cursorThickness}. For internal use only. */
    private _cursorThickness?: number;

    get cursorThickness(): number {
        return this._cursorThickness ?? this._fallbackTheme?.cursorThickness ?? 1;
    }

    set cursorThickness(value: number | undefined) {
        if(this._cursorThickness !== value) {
            this._cursorThickness = value;
            this.onThemeUpdated('cursorThickness');
        }
    }

    /** See {@link BaseTheme#scrollBarThickness}. For internal use only. */
    private _scrollBarThickness?: number;

    get scrollBarThickness(): number {
        return this._scrollBarThickness ?? this._fallbackTheme?.scrollBarThickness ?? 8;
    }

    set scrollBarThickness(value: number | undefined) {
        if(this._scrollBarThickness !== value) {
            this._scrollBarThickness = value;
            this.onThemeUpdated('scrollBarThickness');
        }
    }

    /** See {@link BaseTheme#scrollBarMinPercent}. For internal use only. */
    private _scrollBarMinPercent?: number;

    get scrollBarMinPercent(): number {
        return this._scrollBarMinPercent ?? this._fallbackTheme?.scrollBarMinPercent ?? 0.1;
    }

    set scrollBarMinPercent(value: number | undefined) {
        if(this._scrollBarMinPercent !== value) {
            this._scrollBarMinPercent = value;
            this.onThemeUpdated('scrollBarMinPercent');
        }
    }

    /** See {@link BaseTheme#scrollBarMinPixels}. For internal use only. */
    private _scrollBarMinPixels?: number;

    get scrollBarMinPixels(): number {
        return this._scrollBarMinPixels ?? this._fallbackTheme?.scrollBarMinPixels ?? 20;
    }

    set scrollBarMinPixels(value: number | undefined) {
        if(this._scrollBarMinPixels !== value) {
            this._scrollBarMinPixels = value;
            this.onThemeUpdated('scrollBarMinPixels');
        }
    }

    /** See {@link BaseTheme#radioButtonLength}. For internal use only. */
    private _radioButtonLength?: number;

    get radioButtonLength(): number {
        return this._radioButtonLength ?? this._fallbackTheme?.radioButtonLength ?? 12;
    }

    set radioButtonLength(value: number | undefined) {
        if(this._radioButtonLength !== value) {
            this._radioButtonLength = value;
            this.onThemeUpdated('radioButtonLength');
        }
    }

    /** See {@link BaseTheme#radioButtonInnerPadding}. For internal use only. */
    private _radioButtonInnerPadding?: number;

    get radioButtonInnerPadding(): number {
        return this._radioButtonInnerPadding ?? this._fallbackTheme?.radioButtonInnerPadding ?? 2;
    }

    set radioButtonInnerPadding(value: number | undefined) {
        if(this._radioButtonInnerPadding !== value) {
            this._radioButtonInnerPadding = value;
            this.onThemeUpdated('radioButtonInnerPadding');
        }
    }

    // XXX BASETHEME AUTO-GENERATED CODE END
}
