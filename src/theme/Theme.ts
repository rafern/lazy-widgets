import type { ThemeProperties } from './ThemeProperties';
import { BaseTheme } from './BaseTheme';

/**
 * Provides styling for {@link Widget | Widgets}.
 *
 * @category Theme
 */
export class Theme extends BaseTheme {
    /** Listeners that are listening for changes in this theme (or fallback) */
    protected subscribers: Set<(property: string | null) => void>;

    /** Create a new Theme */
    constructor(properties?: ThemeProperties, fallbackTheme?: Theme) {
        super(properties, fallbackTheme);
        this.subscribers = new Set();
    }

    override get fallbackTheme(): Theme | undefined {
        return super.fallbackTheme;
    }

    override set fallbackTheme(newTheme: Theme | undefined) {
        super.fallbackTheme = newTheme;
    }

    protected override onThemeUpdated(property: string | null = null): void {
        // Notify all subscribers
        for(const listener of this.subscribers)
            listener(property);
    }

    /**
     * Subscribe to this theme. When a change occurs in the theme, the passed
     * listener callback will be called. The argument used for the callback will
     * be null if the theme's fallback has changed and therefore all properties
     * are to be assumed as changed, else, the argument will be a string
     * containing the name of the theme property that changed.
     */
    subscribe(listener: (property: string | null) => void): void {
        this.subscribers.add(listener);
    }

    /**
     * Unsubscribe from this theme; removes the listener callback from the list
     * of subscribers.
     */
    unsubscribe(listener: (property: string | null) => void): void {
        this.subscribers.delete(listener);
    }
}