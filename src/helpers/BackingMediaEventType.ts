export enum BackingMediaEventType {
    /**
     * The backing media has been loaded. Note that this can fire multiple times
     * and there is no "unloaded" event.
     */
    Loaded = 'loaded',
    /** The backing media should be re-painted. */
    Dirty = 'dirty',
    /**
     * The backing media was resized. Note that this doesn't necessarily mean
     * that the media should be re-painted.
     */
    Resized = 'resized',
}
