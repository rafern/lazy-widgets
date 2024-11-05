import { watchField } from '../decorators/FlagFields.js';
import { ClickState } from '../helpers/ClickState.js';
import { FillStyle } from '../theme/FillStyle.js';
import { DynMsg } from '../core/Strings.js';
import { Theme } from '../theme/Theme.js';
import { Button } from './Button.js';
import { ClickableWidgetProperties } from './ClickableWidgetProperties.js';
import { SingleParentXMLInputConfig } from '../xml/SingleParentXMLInputConfig.js';
import type { ThemeProperties } from '../theme/ThemeProperties.js';
import type { Widget, WidgetProperties } from './Widget.js';
import type { Rect } from '../helpers/Rect.js';
import type { WidgetAutoXML } from '../xml/WidgetAutoXML.js';
/**
 * Optional FilledButton constructor properties.
 *
 * @category Widget
 */
export interface FilledButtonProperties extends WidgetProperties {
    /** Sets {@link FilledButton#forced}. */
    forced?: boolean;
}

/**
 * A {@link Button} which overrides the canvas colour, meaning that it has a
 * filled background.
 *
 * Can be constrained to a specific type of children.
 *
 * This button version can also be "forced down"; the button becomes similar to
 * being pressed, visually. Useful for implementing widgets such as
 * {@link ShiftKey}.
 *
 * @category Widget
 */
export class FilledButton<W extends Widget = Widget> extends Button<W> {
    static override autoXML: WidgetAutoXML = {
        name: 'filled-button',
        inputConfig: SingleParentXMLInputConfig
    };

    /** Theme property used for overriding the canvas colour. */
    private backgroundProperty = 'backgroundFill';
    /** Is the button currently forced down? */
    @watchField(FilledButton.prototype.updateBackground)
    forced;
    /** The inherited theme for the child */
    private childTheme: Theme;

    constructor(child: W, properties?: Readonly<FilledButtonProperties & ClickableWidgetProperties>) {
        super(child, properties);

        this.forced = properties?.forced ?? false;

        // Make theme that will be inherited by child. Later, this theme's
        // canvasFill property will be changed, notifying the child. Make the
        // child inherit the theme. fallbackTheme is also later set when this
        // widget inherits a theme
        this.childTheme = new Theme(<ThemeProperties>{
            canvasFill: this.getBackgroundFill(),
        });
        this.child.inheritedTheme = this.childTheme;
    }

    protected override activate(): void {
        super.activate();
        this.updateBackground();
    }

    /**
     * Update the background fill.
     *
     * Sets {@link FilledButton#backgroundProperty} depending on
     * {@link FilledButton#forced} and {@link ButtonClickHelper#clickState},
     * sets {@link FilledButton#childTheme}.{@link Theme#canvasFill} and marks
     * the widget as dirty.
     */
    private updateBackground(): void {
        const oldProperty = this.backgroundProperty;

        if(this.forced) {
            this.backgroundProperty = 'primaryFill';
        } else {
            switch(this.clickHelper.clickState) {
            case ClickState.Hold:
                this.backgroundProperty = 'accentFill';
                break;
            case ClickState.Hover:
                this.backgroundProperty = 'backgroundGlowFill';
                break;
            default:
                this.backgroundProperty = 'backgroundFill';
                break;
            }
        }

        // Update canvasFill property of child's theme
        if(oldProperty !== this.backgroundProperty) {
            this.markWholeAsDirty();
            this.childTheme.canvasFill = this.getBackgroundFill();
        }
    }

    private getBackgroundFill(): FillStyle {
        switch(this.backgroundProperty) {
        case 'primaryFill':
            return this.primaryFill;
        case 'accentFill':
            return this.accentFill;
        case 'backgroundGlowFill':
            return this.backgroundGlowFill;
        case 'backgroundFill':
            return this.backgroundFill;
        default:
            throw new Error(DynMsg.INVALID_BACKGROUND_FILL(this.backgroundProperty));
        }
    }

    override set inheritedTheme(theme: Theme | undefined) {
        if(theme === this.fallbackTheme) {
            return;
        }

        this.fallbackTheme = theme;
        this.childTheme.fallbackTheme = theme;
    }

    override get inheritedTheme(): Theme | undefined {
        return this.fallbackTheme;
    }

    protected override onThemeUpdated(property: string | null = null): void {
        if(property === null) {
            this._layoutDirty = true;
            this.markWholeAsDirty();
            this.childTheme.canvasFill = this.getBackgroundFill();
        } else if(property === this.backgroundProperty) {
            this.markWholeAsDirty();
            this.childTheme.canvasFill = this.getBackgroundFill();
        } else if(property === 'containerPadding') {
            this._layoutDirty = true;
        } else if(property === 'containerAlignment') {
            this._layoutDirty = true;
        }
    }

    protected override handlePreLayoutUpdate() {
        if (this.clickHelper.clickStateChanged) {
            this.updateBackground();
        }

        super.handlePreLayoutUpdate();
    }

    protected override handlePainting(dirtyRects: Array<Rect>): void {
        // Paint brackground
        const ctx = this.viewport.context;
        ctx.save();
        ctx.fillStyle = this.getBackgroundFill();
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();

        super.handlePainting(dirtyRects);
    }
}
