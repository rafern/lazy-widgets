import type { TextAlignMode } from '../helpers/TextHelper';
import type { FlexAlignment2D } from './FlexAlignment2D';
import type { Alignment2D } from './Alignment2D';
import type { FillStyle } from './FillStyle';
import type { Padding } from './Padding';

/**
 * Something which contains all properties of a theme. Use this interface for
 * creating new {@link Theme | themes}.
 *
 * @category Theme
 */
export interface ThemeProperties {
    // XXX THEMEPROPERTIES AUTO-GENERATED CODE START
    /** The canvas background {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style}. */
    canvasFill?: FillStyle;
    /** The {@link Padding} used in {@link Container}. */
    containerPadding?: Padding;
    /** The alignment in {@link Container} for when there is extra space. */
    containerAlignment?: Alignment2D;
    /** The spacing length between widgets in {@link MultiContainer}. */
    multiContainerSpacing?: number;
    /** The alignment in {@link MultiContainer} for when there is unused space. */
    multiContainerAlignment?: FlexAlignment2D;
    /** The primary {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style}. Usually a saturated colour used for filling boxes that need to stand out. */
    primaryFill?: FillStyle;
    /** The accent {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style}. Usually a saturated colour more saturated than {@link ThemeProperties#primaryFill} used for highlighting boxes which use PrimaryFill. */
    accentFill?: FillStyle;
    /** The background {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style}. Used for widgets with a background (as in, a background above the canvas background). */
    backgroundFill?: FillStyle;
    /** The background glow {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style}. Used for highlighting boxes which use {@link ThemeProperties#backgroundFill}. */
    backgroundGlowFill?: FillStyle;
    /** The minimum length of a {@link Slider} */
    sliderMinLength?: number;
    /** The thickness of a {@link Slider} */
    sliderThickness?: number;
    /** The {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font | font style} used for body text (most regular text). */
    bodyTextFont?: string;
    /** The {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style} used for body text (most regular text). */
    bodyTextFill?: FillStyle;
    /** The height of each line of text in body text (most regular text). If null, it will be automatically detected. */
    bodyTextHeight?: number | null;
    /** The spacing between each line of text in body text (most regular text). If null, it will be automatically detected. */
    bodyTextSpacing?: number | null;
    /** The default text alignment mode of body text (most regular text). */
    bodyTextAlign?: TextAlignMode | number;
    /** The length in pixels used for {@link Checkbox}. */
    checkboxLength?: number;
    /** The {@link Padding} used for {@link Checkbox} between the accent box shown when ticked and the background box. */
    checkboxInnerPadding?: number;
    /** The background {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style} used for input widgets like {@link TextInput}. */
    inputBackgroundFill?: FillStyle;
    /** The background {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style} used for input widgets like {@link TextInput} when text is selected. */
    inputSelectBackgroundFill?: FillStyle;
    /** The {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font | font style} used for text in input widgets like {@link TextInput}. */
    inputTextFont?: string;
    /** The {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style} used for text in input widgets like {@link TextInput}. */
    inputTextFill?: FillStyle;
    /** The {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style} used for text in input widgets like {@link TextInput} when disabled. */
    inputTextFillDisabled?: FillStyle;
    /** The {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle | fill style} used for text in input widgets like {@link TextInput} when invalid. */
    inputTextFillInvalid?: FillStyle;
    /** The height of each line of text in input widgets like {@link TextInput}. If null, it will be automatically detected. */
    inputTextHeight?: number | null;
    /** The spacing between each line of text in input widgets like {@link TextInput}. If null, it will be automatically detected. */
    inputTextSpacing?: number | null;
    /** The {@link Padding} between text and border used for text input widgets like {@link TextInput}. */
    inputTextInnerPadding?: number;
    /** The default minimum width of text input widgets like {@link TextInput}. */
    inputTextMinWidth?: number;
    /** The default text alignment mode of text input widgets like {@link TextInput}. */
    inputTextAlign?: TextAlignMode | number;
    /** The blink rate of text cursors in text input widgets like {@link TextInput}. Value in "blinks" per second. */
    blinkRate?: number;
    /** The thickness of a text cursor in pixels. */
    cursorThickness?: number;
    /** The thickness of a {@link ScrollableViewportWidget}'s scrollbar in pixels. */
    scrollBarThickness?: number;
    /** The minimum length of the filled part of a {@link ScrollableViewportWidget}'s scrollbar in percentage of total length. */
    scrollBarMinPercent?: number;
    /** The minimum length of the filled part of a {@link ScrollableViewportWidget}'s scrollbar in pixels. */
    scrollBarMinPixels?: number;
    /** Similar to {@link ThemeProperties#checkboxLength}, but for {@link RadioButton}. */
    radioButtonLength?: number;
    /** Similar to {@link ThemeProperties#checkboxInnerPadding}, but for {@link RadioButton}. */
    radioButtonInnerPadding?: number;
    // XXX THEMEPROPERTIES AUTO-GENERATED CODE END
}