import { EventEmitter } from 'events';
import internal from 'stream';

/** The Audio Outputs type */
type AudioOutputs = "mono" | "stereo" | "left" | "right";
/** The "active" / "disabled" Player Filters */
interface PlayerFilters {
    /** Sets nightcore to false, and vaporwave to false */
    custom: boolean;
    /** Sets custom to false, and vaporwave to false */
    nightcore: boolean;
    /** Sets custom to false, and nightcore to false */
    vaporwave: boolean;
    /** If rotation filter is enabled / not */
    rotation: boolean;
    /** if karaoke filter is enabled / not */
    karaoke: boolean;
    /** if tremolo filter is enabled / not */
    tremolo: boolean;
    /** if vibrato filter is enabled / not */
    vibrato: boolean;
    lowPass: boolean;
    /** audio Output (default stereo, mono sounds the fullest and best for not-stereo tracks) */
    audioOutput: AudioOutputs;
    /** Lavalink Volume FILTER (not player Volume, think of it as a gain booster) */
    volume: boolean;
    /** Filters for the Lavalink Filter Plugin */
    lavalinkFilterPlugin: {
        /** if echo filter is enabled / not */
        echo: boolean;
        /** if reverb filter is enabled / not */
        reverb: boolean;
    };
    lavalinkLavaDspxPlugin: {
        /** if lowPass filter is enabled / not */
        lowPass: boolean;
        /** if highPass filter is enabled / not */
        highPass: boolean;
        /** if normalization filter is enabled / not */
        normalization: boolean;
        /** if echo filter is enabled / not */
        echo: boolean;
    };
}
/**
 * There are 15 bands (0-14) that can be changed.
 * "gain" is the multiplier for the given band.
 * The default value is 0.
 *  Valid values range from -0.25 to 1.0, where -0.25 means the given band is completely muted, and 0.25 means it is doubled.
 * Modifying the gain could also change the volume of the output.
 */
interface EQBand {
    /** On what band position (0-14) it should work */
    band: IntegerNumber | number;
    /** The gain (-0.25 to 1.0) */
    gain: FloatNumber | number;
}
/**
 * Uses equalization to eliminate part of a band, usually targeting vocals.
 */
interface KaraokeFilter {
    /** The level (0 to 1.0 where 0.0 is no effect and 1.0 is full effect) */
    level?: number;
    /** The mono level (0 to 1.0 where 0.0 is no effect and 1.0 is full effect) */
    monoLevel?: number;
    /** The filter band (in Hz) */
    filterBand?: number;
    /**	The filter width */
    filterWidth?: number;
}
/**
 * Changes the speed, pitch, and rate
 */
interface TimescaleFilter {
    /** The playback speed 0.0 ≤ x */
    speed?: number;
    /** The pitch 0.0 ≤ x */
    pitch?: number;
    /** The rate 0.0 ≤ x */
    rate?: number;
}
/**
 * Uses amplification to create a shuddering effect, where the volume quickly oscillates.
 * Demo: https://en.wikipedia.org/wiki/File:Fuse_Electronics_Tremolo_MK-III_Quick_Demo.ogv
 */
interface TremoloFilter {
    /** The frequency 0.0 < x */
    frequency?: number;
    /** The tremolo depth 0.0 < x ≤ 1.0 */
    depth?: number;
}
/**
 * Similar to tremolo. While tremolo oscillates the volume, vibrato oscillates the pitch.
 */
interface VibratoFilter {
    /** The frequency 0.0 < x ≤ 14.0 */
    frequency?: number;
    /** The vibrato depth 0.0 < x ≤ 1.0 */
    depth?: number;
}
/**
 * Rotates the sound around the stereo channels/user headphones (aka Audio Panning).
 * It can produce an effect similar to https://youtu.be/QB9EB8mTKcc (without the reverb).
 */
interface RotationFilter {
    /** The frequency of the audio rotating around the listener in Hz. 0.2 is similar to the example video above */
    rotationHz?: number;
}
/**
 * Distortion effect. It can generate some pretty unique audio effects.
 */
interface DistortionFilter {
    sinOffset?: number;
    sinScale?: number;
    cosOffset?: number;
    cosScale?: number;
    tanOffset?: number;
    tanScale?: number;
    offset?: number;
    scale?: number;
}
/**
 * Mixes both channels (left and right), with a configurable factor on how much each channel affects the other.
 * With the defaults, both channels are kept independent of each other.
 * Setting all factors to 0.5 means both channels get the same audio.
 */
interface ChannelMixFilter {
    /** The left to left channel mix factor (0.0 ≤ x ≤ 1.0) */
    leftToLeft?: number;
    /** The left to right channel mix factor (0.0 ≤ x ≤ 1.0) */
    leftToRight?: number;
    /** The right to left channel mix factor (0.0 ≤ x ≤ 1.0) */
    rightToLeft?: number;
    /** The right to right channel mix factor (0.0 ≤ x ≤ 1.0) */
    rightToRight?: number;
}
/**
 * Higher frequencies get suppressed, while lower frequencies pass through this filter, thus the name low pass.
 * Any smoothing values equal to or less than 1.0 will disable the filter.
 */
interface LowPassFilter {
    /** The smoothing factor (1.0 < x) */
    smoothing?: number;
}
/**
 * Filter Data stored in the Client and partially sent to Lavalink
 */
interface FilterData {
    volume?: number;
    karaoke?: KaraokeFilter;
    timescale?: TimescaleFilter;
    tremolo?: TremoloFilter;
    vibrato?: VibratoFilter;
    rotation?: RotationFilter;
    distortion?: DistortionFilter;
    channelMix?: ChannelMixFilter;
    lowPass?: LowPassFilter;
    pluginFilters?: {
        "lavalink-filter-plugin"?: {
            "echo"?: {
                delay?: number;
                decay?: number;
            };
            "reverb"?: {
                delays?: number[];
                gains?: number[];
            };
        };
        "high-pass"?: {
            cutoffFrequency?: number;
            boostFactor?: number;
        };
        "low-pass"?: {
            cutoffFrequency?: number;
            boostFactor?: number;
        };
        normalization?: {
            maxAmplitude?: number;
            adaptive?: boolean;
        };
        echo?: {
            echoLength?: number;
            decay?: number;
        };
    };
}
/**
 * Actual Filter Data sent to Lavalink
 */
interface LavalinkFilterData extends FilterData {
    equalizer?: EQBand[];
}

declare enum DebugEvents {
    SetSponsorBlock = "SetSponsorBlock",
    DeleteSponsorBlock = "DeleteSponsorBlock",
    TrackEndReplaced = "TrackEndReplaced",
    AutoplayExecution = "AutoplayExecution",
    AutoplayNoSongsAdded = "AutoplayNoSongsAdded",
    AutoplayThresholdSpamLimiter = "AutoplayThresholdSpamLimiter",
    TriggerQueueEmptyInterval = "TriggerQueueEmptyInterval",
    QueueEnded = "QueueEnded",
    TrackStartNewSongsOnly = "TrackStartNewSongsOnly",
    TrackStartNoTrack = "TrackStartNoTrack",
    ResumingFetchingError = "ResumingFetchingError",
    PlayerUpdateNoPlayer = "PlayerUpdateNoPlayer",
    PlayerUpdateFilterFixApply = "PlayerUpdateFilterFixApply",
    PlayerUpdateSuccess = "PlayerUpdateSuccess",
    HeartBeatTriggered = "HeartBeatTriggered",
    NoSocketOnDestroy = "NoSocketOnDestroy",
    SocketTerminateHeartBeatTimeout = "SocketTerminateHeartBeatTimeout",
    TryingConnectWhileConnected = "TryingConnectWhileConnected",
    LavaSearchNothingFound = "LavaSearchNothingFound",
    SearchNothingFound = "SearchNothingFound",
    ValidatingBlacklistLinks = "ValidatingBlacklistLinks",
    ValidatingWhitelistLinks = "ValidatingWhitelistLinks",
    TrackErrorMaxTracksErroredPerTime = "TrackErrorMaxTracksErroredPerTime",
    TrackStuckMaxTracksErroredPerTime = "TrackStuckMaxTracksErroredPerTime",
    PlayerDestroyingSomewhereElse = "PlayerDestroyingSomewhereElse",
    PlayerCreateNodeNotFound = "PlayerCreateNodeNotFound",
    PlayerPlayQueueEmptyTimeoutClear = "PlayerPlayQueueEmptyTimeoutClear",
    PlayerPlayWithTrackReplace = "PlayerPlayWithTrackReplace",
    PlayerPlayUnresolvedTrack = "PlayerPlayUnresolvedTrack",
    PlayerPlayUnresolvedTrackFailed = "PlayerPlayUnresolvedTrackFailed",
    PlayerVolumeAsFilter = "PlayerVolumeAsFilter",
    BandcampSearchLokalEngine = "BandcampSearchLokalEngine",
    PlayerChangeNode = "PlayerChangeNode",
    BuildTrackError = "BuildTrackError",
    TransformRequesterFunctionFailed = "TransformRequesterFunctionFailed",
    GetClosestTrackFailed = "GetClosestTrackFailed",
    PlayerDeleteInsteadOfDestroy = "PlayerDeleteInsteadOfDestroy",
    FailedToConnectToNodes = "FailedToConnectToNodes",
    NoAudioDebug = "NoAudioDebug",
    PlayerAutoReconnect = "PlayerAutoReconnect"
}
declare enum DestroyReasons {
    QueueEmpty = "QueueEmpty",
    NodeDestroy = "NodeDestroy",
    NodeDeleted = "NodeDeleted",
    LavalinkNoVoice = "LavalinkNoVoice",
    NodeReconnectFail = "NodeReconnectFail",
    Disconnected = "Disconnected",
    PlayerReconnectFail = "PlayerReconnectFail",
    PlayerChangeNodeFail = "PlayerChangeNodeFail",
    PlayerChangeNodeFailNoEligibleNode = "PlayerChangeNodeFailNoEligibleNode",
    ChannelDeleted = "ChannelDeleted",
    DisconnectAllNodes = "DisconnectAllNodes",
    ReconnectAllNodes = "ReconnectAllNodes",
    TrackErrorMaxTracksErroredPerTime = "TrackErrorMaxTracksErroredPerTime",
    TrackStuckMaxTracksErroredPerTime = "TrackStuckMaxTracksErroredPerTime"
}
declare enum DisconnectReasons {
    Disconnected = "Disconnected",
    DisconnectAllNodes = "DisconnectAllNodes"
}
declare const validSponsorBlocks: string[];
/**  The audio Outputs Data map declaration */
declare const audioOutputsData: Record<AudioOutputs, ChannelMixFilter>;
declare const EQList: {
    /** A Bassboost Equalizer, so high it distorts the audio */
    BassboostEarrape: EQBand[];
    /** A High and decent Bassboost Equalizer */
    BassboostHigh: EQBand[];
    /** A decent Bassboost Equalizer */
    BassboostMedium: EQBand[];
    /** A slight Bassboost Equalizer */
    BassboostLow: EQBand[];
    /** Makes the Music slightly "better" */
    BetterMusic: EQBand[];
    /** Makes the Music sound like rock music / sound rock music better */
    Rock: EQBand[];
    /** Makes the Music sound like Classic music / sound Classic music better */
    Classic: EQBand[];
    /** Makes the Music sound like Pop music / sound Pop music better */
    Pop: EQBand[];
    /** Makes the Music sound like Electronic music / sound Electronic music better */
    Electronic: EQBand[];
    /** Boosts all Bands slightly for louder and fuller sound */
    FullSound: EQBand[];
    /** Boosts basses + lower highs for a pro gaming sound */
    Gaming: EQBand[];
};

/**
 * The FilterManager for each player
 */
declare class FilterManager {
    /** The Equalizer bands currently applied to the Lavalink Server */
    equalizerBands: EQBand[];
    /** Private Util for the instaFix Filters option */
    filterUpdatedState: boolean;
    /** All "Active" / "disabled" Player Filters */
    filters: PlayerFilters;
    /** The Filter Data sent to Lavalink, only if the filter is enabled (ofc.) */
    data: FilterData;
    /** The Player assigned to this Filter Manager */
    player: Player;
    /** The Constructor for the FilterManager */
    constructor(player: Player);
    /**
     * Apply Player filters for lavalink filter sending data, if the filter is enabled / not
     */
    applyPlayerFilters(): Promise<void>;
    /**
     * Checks if the filters are correctly stated (active / not-active)
     * @param oldFilterTimescale
     * @returns
     */
    checkFiltersState(oldFilterTimescale?: Partial<TimescaleFilter>): boolean;
    /**
     * Reset all Filters
     */
    resetFilters(): Promise<PlayerFilters>;
    /**
     * Set the Filter Volume
     * @param volume
     * @returns
     */
    setVolume(volume: number): Promise<boolean>;
    /**
     * Set the AudioOutput Filter
     * @param type
     * @returns
     */
    setAudioOutput(type: AudioOutputs): Promise<AudioOutputs>;
    /**
     * Set custom filter.timescale#speed . This method disabled both: nightcore & vaporwave. use 1 to reset it to normal
     * @param speed
     * @returns
     */
    setSpeed(speed?: number): Promise<boolean>;
    /**
     * Set custom filter.timescale#pitch . This method disabled both: nightcore & vaporwave. use 1 to reset it to normal
     * @param speed
     * @returns
     */
    setPitch(pitch?: number): Promise<boolean>;
    /**
     * Set custom filter.timescale#rate . This method disabled both: nightcore & vaporwave. use 1 to reset it to normal
     * @param speed
     * @returns
     */
    setRate(rate?: number): Promise<boolean>;
    /**
     * Enables / Disables the rotation effect, (Optional: provide your Own Data)
     * @param rotationHz
     * @returns
     */
    toggleRotation(rotationHz?: number): Promise<boolean>;
    /**
     * Enables / Disables the Vibrato effect, (Optional: provide your Own Data)
     * @param frequency
     * @param depth
     * @returns
     */
    toggleVibrato(frequency?: number, depth?: number): Promise<boolean>;
    /**
     * Enables / Disables the Tremolo effect, (Optional: provide your Own Data)
     * @param frequency
     * @param depth
     * @returns
     */
    toggleTremolo(frequency?: number, depth?: number): Promise<boolean>;
    /**
     * Enables / Disables the LowPass effect, (Optional: provide your Own Data)
     * @param smoothing
     * @returns
     */
    toggleLowPass(smoothing?: number): Promise<boolean>;
    lavalinkLavaDspxPlugin: {
        /**
         * Enables / Disables the LowPass effect, (Optional: provide your Own Data)
         * @param boostFactor
         * @param cutoffFrequency
         * @returns
         */
        toggleLowPass: (boostFactor?: number, cutoffFrequency?: number) => Promise<boolean>;
        /**
         * Enables / Disables the HighPass effect, (Optional: provide your Own Data)
         * @param boostFactor
         * @param cutoffFrequency
         * @returns
         */
        toggleHighPass: (boostFactor?: number, cutoffFrequency?: number) => Promise<boolean>;
        /**
         * Enables / Disables the Normalization effect.
         * @param {number} [maxAmplitude=0.75] - The maximum amplitude of the audio.
         * @param {boolean} [adaptive=true] - Whether to use adaptive normalization or not.
         * @returns {Promise<boolean>} - The state of the filter after execution.
         */
        toggleNormalization: (maxAmplitude?: number, adaptive?: boolean) => Promise<boolean>;
        /**
         * Enables / Disables the Echo effect, IMPORTANT! Only works with the correct Lavalink Plugin installed. (Optional: provide your Own Data)
         * @param {number} [decay=0.5] - The decay of the echo effect.
         * @param {number} [echoLength=0.5] - The length of the echo effect.
         * @returns {Promise<boolean>} - The state of the filter after execution.
         */
        toggleEcho: (decay?: number, echoLength?: number) => Promise<boolean>;
    };
    lavalinkFilterPlugin: {
        /**
         * Enables / Disables the Echo effect, IMPORTANT! Only works with the correct Lavalink Plugin installed. (Optional: provide your Own Data)
         * @param delay
         * @param decay
         * @returns
         */
        toggleEcho: (delay?: number, decay?: number) => Promise<boolean>;
        /**
         * Enables / Disables the Echo effect, IMPORTANT! Only works with the correct Lavalink Plugin installed. (Optional: provide your Own Data)
         * @param delays
         * @param gains
         * @returns
         */
        toggleReverb: (delays?: number[], gains?: number[]) => Promise<boolean>;
    };
    /**
     * Enables / Disables a Nightcore-like filter Effect. Disables/Overrides both: custom and Vaporwave Filter
     * @param speed
     * @param pitch
     * @param rate
     * @returns
     */
    toggleNightcore(speed?: number, pitch?: number, rate?: number): Promise<boolean>;
    /**
     * Enables / Disables a Vaporwave-like filter Effect. Disables/Overrides both: custom and nightcore Filter
     * @param speed
     * @param pitch
     * @param rate
     * @returns
     */
    toggleVaporwave(speed?: number, pitch?: number, rate?: number): Promise<boolean>;
    /**
     * Enable / Disables a Karaoke like Filter Effect
     * @param level
     * @param monoLevel
     * @param filterBand
     * @param filterWidth
     * @returns
     */
    toggleKaraoke(level?: number, monoLevel?: number, filterBand?: number, filterWidth?: number): Promise<boolean>;
    /** Function to find out if currently there is a custom timescamle etc. filter applied */
    isCustomFilterActive(): boolean;
    /**
   * Sets the players equalizer band on-top of the existing ones.
   * @param bands
   */
    setEQ(bands: EQBand | EQBand[]): Promise<this>;
    /** Clears the equalizer bands. */
    clearEQ(): Promise<this>;
}

type LavalinkSourceNames = "youtube" | "youtubemusic" | "soundcloud" | "bandcamp" | "twitch";
type LavalinkPlugin_LavaSrc_SourceNames = "deezer" | "spotify" | "applemusic" | "yandexmusic" | "flowery-tts" | "vkmusic" | "tidal" | "qobuz";
type LavalinkPlugin_JioSaavn_SourceNames = "jiosaavn";
type SourceNames = LavalinkSourceNames | LavalinkPlugin_LavaSrc_SourceNames | LavalinkPlugin_JioSaavn_SourceNames;
interface LavalinkTrackInfo {
    identifier: string;
    title: string;
    author: string;
    length: number;
    artworkUrl: string | null;
    uri: string;
    sourceName: SourceNames;
    isSeekable: boolean;
    isStream: boolean;
    isrc: string | null;
}
interface TrackInfo {
    identifier: string;
    title: string;
    author: string;
    duration: number;
    artworkUrl: string | null;
    uri: string;
    sourceName: SourceNames;
    isSeekable: boolean;
    isStream: boolean;
    isrc: string | null;
}
interface PluginInfo {
    type?: "album" | "playlist" | "artist" | "recommendations" | string;
    albumName?: string;
    albumUrl?: string;
    albumArtUrl?: string;
    artistUrl?: string;
    artistArtworkUrl?: string;
    previewUrl?: string;
    isPreview?: boolean;
    totalTracks?: number;
    identifier?: string;
    artworkUrl?: string;
    author?: string;
    url?: string;
    uri?: string;
    clientData?: {
        previousTrack?: boolean;
        [key: string]: any;
    };
}
interface LavalinkTrack {
    encoded?: Base64;
    info: LavalinkTrackInfo;
    pluginInfo: Partial<PluginInfo>;
    userData?: anyObject;
}
interface Track {
    encoded?: Base64;
    info: TrackInfo;
    pluginInfo: Partial<PluginInfo>;
    requester?: unknown;
    userData?: anyObject;
}
interface UnresolvedTrackInfo extends Partial<TrackInfo> {
    title: string;
}
interface UnresolvedQuery extends UnresolvedTrackInfo {
    encoded?: Base64;
}
interface UnresolvedTrack {
    resolve: (player: Player) => Promise<void>;
    encoded?: Base64;
    info: UnresolvedTrackInfo;
    pluginInfo: Partial<PluginInfo>;
    userData?: anyObject;
    requester?: unknown;
}

declare class QueueSaver {
    private _;
    options: {
        maxPreviousTracks: number;
    };
    constructor(options: ManagerQueueOptions);
    /**
     * Get the queue for a guild
     * @param guildId The guild ID
     * @returns The queue for the guild
     */
    get(guildId: string): Promise<Partial<StoredQueue>>;
    /**
     * Delete the queue for a guild
     * @param guildId The guild ID
     * @returns The queue for the guild
     */
    delete(guildId: string): Promise<boolean | void>;
    /**
     * Set the queue for a guild
     * @param guildId The guild ID
     * @param valueToStringify The queue to set
     * @returns The queue for the guild
     */
    set(guildId: string, valueToStringify: StoredQueue): Promise<boolean | void>;
    /**
     * Sync the queue for a guild
     * @param guildId The guild ID
     * @returns The queue for the guild
     */
    sync(guildId: string): Promise<Partial<StoredQueue>>;
}
declare class DefaultQueueStore implements QueueStoreManager {
    private data;
    constructor();
    /**
     * Get the queue for a guild
     * @param guildId The guild ID
     * @returns The queue for the guild
     */
    get(guildId: string): StoredQueue;
    /**
     * Set the queue for a guild
     * @param guildId The guild ID
     * @param valueToStringify The queue to set
     * @returns The queue for the guild
     */
    set(guildId: string, valueToStringify: any): boolean;
    /**
     * Delete the queue for a guild
     * @param guildId The guild ID
     * @returns The queue for the guild
     */
    delete(guildId: string): boolean;
    /**
     * Stringify the queue for a guild
     * @param value The queue to stringify
     * @returns The stringified queue
     */
    stringify(value: StoredQueue | string): StoredQueue | string;
    /**
     * Parse the queue for a guild
     * @param value The queue to parse
     * @returns The parsed queue
     */
    parse(value: StoredQueue | string): Partial<StoredQueue>;
}
declare class Queue {
    readonly tracks: (Track | UnresolvedTrack)[];
    readonly previous: Track[];
    current: Track | null;
    options: {
        maxPreviousTracks: number;
    };
    private readonly guildId;
    private readonly QueueSaver;
    private managerUtils;
    private queueChanges;
    /**
     * Create a new Queue
     * @param guildId The guild ID
     * @param data The data to initialize the queue with
     * @param QueueSaver The queue saver to use
     * @param queueOptions
     */
    constructor(guildId: string, data?: Partial<StoredQueue>, QueueSaver?: QueueSaver, queueOptions?: ManagerQueueOptions);
    /**
     * Utils for a Queue
     */
    utils: {
        /**
         * Save the current cached Queue on the database/server (overides the server)
         */
        save: () => Promise<boolean | void>;
        /**
         * Sync the current queue database/server with the cached one
         * @returns {void}
         */
        sync: (override?: boolean, dontSyncCurrent?: boolean) => Promise<void>;
        destroy: () => Promise<boolean | void>;
        /**
         * @returns {{current:Track|null, previous:Track[], tracks:Track[]}}The Queue, but in a raw State, which allows easier handling for the QueueStoreManager
         */
        toJSON: () => StoredQueue;
        /**
         * Get the Total Duration of the Queue-Songs summed up
         * @returns {number}
         */
        totalDuration: () => number;
    };
    /**
     * Shuffles the current Queue, then saves it
     * @returns Amount of Tracks in the Queue
     */
    shuffle(): Promise<number>;
    /**
     * Add a Track to the Queue, and after saved in the "db" it returns the amount of the Tracks
     * @param {Track | Track[]} TrackOrTracks
     * @param {number} index At what position to add the Track
     * @returns {number} Queue-Size (for the next Tracks)
     */
    add(TrackOrTracks: Track | UnresolvedTrack | (Track | UnresolvedTrack)[], index?: number): any;
    /**
     * Splice the tracks in the Queue
     * @param {number} index Where to remove the Track
     * @param {number} amount How many Tracks to remove?
     * @param {Track | Track[]} TrackOrTracks Want to Add more Tracks?
     * @returns {Track} Spliced Track
     */
    splice(index: number, amount: number, TrackOrTracks?: Track | UnresolvedTrack | (Track | UnresolvedTrack)[]): any;
    /**
     * Remove stuff from the queue.tracks array
     *  - single Track | UnresolvedTrack
     *  - multiple Track | UnresovedTrack
     *  - at the index or multiple indexes
     * @param removeQueryTrack
     * @returns null (if nothing was removed) / { removed } where removed is an array with all removed elements
     *
     * @example
     * ```js
     * // remove single track
     *
     * const track = player.queue.tracks[4];
     * await player.queue.remove(track);
     *
     * // if you already have the index you can straight up pass it too
     * await player.queue.remove(4);
     *
     *
     * // if you want to remove multiple tracks, e.g. from position 4 to position 10 you can do smt like this
     * await player.queue.remove(player.queue.tracks.slice(4, 10)) // get's the tracks from 4 - 10, which then get's found in the remove function to be removed
     *
     * // I still highly suggest to use .splice!
     *
     * await player.queue.splice(4, 10); // removes at index 4, 10 tracks
     *
     * await player.queue.splice(1, 1); // removes at index 1, 1 track
     *
     * await player.queue.splice(4, 0, ...tracks) // removes 0 tracks at position 4, and then inserts all tracks after position 4.
     * ```
     */
    remove<T extends Track | UnresolvedTrack | number | Track[] | UnresolvedTrack[] | number[] | (number | Track | UnresolvedTrack)[]>(removeQueryTrack: T): Promise<{
        removed: (Track | UnresolvedTrack)[];
    } | null>;
    /**
     * Shifts the previous array, to return the last previous track & thus remove it from the previous queue
     * @returns
     *
     * @example
     * ```js
     * // example on how to play the previous track again
     * const previous = await player.queue.shiftPrevious(); // get the previous track and remove it from the previous queue array!!
     * if(!previous) return console.error("No previous track found");
     * await player.play({ clientTrack: previous }); // play it again
     * ```
     */
    shiftPrevious(): Promise<Track>;
}

declare class Player {
    /** Filter Manager per player */
    filterManager: FilterManager;
    /** circular reference to the lavalink Manager from the Player for easier use */
    LavalinkManager: LavalinkManager;
    /** Player options currently used, mutation doesn't affect player's state */
    options: PlayerOptions;
    /** The lavalink node assigned the the player, don't change it manually */
    node: LavalinkNode;
    /** The queue from the player */
    queue: Queue;
    /** The Guild Id of the Player */
    guildId: string;
    /** The Voice Channel Id of the Player */
    voiceChannelId: string | null;
    /** The Text Channel Id of the Player */
    textChannelId: string | null;
    /** States if the Bot is supposed to be outputting audio */
    playing: boolean;
    /** States if the Bot is paused or not */
    paused: boolean;
    /** Repeat Mode of the Player */
    repeatMode: RepeatMode;
    /** Player's ping */
    ping: {
        lavalink: number;
        ws: number;
    };
    /** The Display Volume */
    volume: number;
    /** The Volume Lavalink actually is outputting */
    lavalinkVolume: number;
    /** The current Positin of the player (Calculated) */
    get position(): number;
    /** The timestamp when the last position change update happened */
    lastPositionChange: number | null;
    /** The current Positin of the player (from Lavalink) */
    lastPosition: number;
    lastSavedPosition: number;
    /** When the player was created [Timestamp in Ms] (from lavalink) */
    createdTimeStamp: number;
    /** The Player Connection's State (from Lavalink) */
    connected: boolean | undefined;
    /** Voice Server Data (from Lavalink) */
    voice: LavalinkPlayerVoiceOptions;
    voiceState: {
        selfDeaf: boolean;
        selfMute: boolean;
        serverDeaf: boolean;
        serverMute: boolean;
        suppress: boolean;
    };
    /** Custom data for the player */
    private readonly data;
    /**
     * Create a new Player
     * @param options
     * @param LavalinkManager
     */
    constructor(options: PlayerOptions, LavalinkManager: LavalinkManager, dontEmitPlayerCreateEvent?: boolean);
    /**
     * Set custom data.
     * @param key
     * @param value
     */
    set(key: string, value: unknown): this;
    /**
     * Get custom data.
     * @param key
     */
    get<T>(key: string): T;
    /**
     * CLears all the custom data.
     */
    clearData(): this;
    /**
     * Get all custom Data
     */
    getAllData(): Record<string, unknown>;
    /**
     * Play the next track from the queue / a specific track, with playoptions for Lavalink
     * @param options
     */
    play(options?: Partial<PlayOptions>): any;
    /**
     * Set the Volume for the Player
     * @param volume The Volume in percent
     * @param ignoreVolumeDecrementer If it should ignore the volumedecrementer option
     */
    setVolume(volume: number, ignoreVolumeDecrementer?: boolean): Promise<this>;
    /**
     * Search for a track
     * @param query The query to search for
     * @param requestUser The user that requested the track
     * @param throwOnEmpty If an error should be thrown if no track is found
     * @returns The search result
     */
    lavaSearch(query: LavaSearchQuery, requestUser: unknown, throwOnEmpty?: boolean): Promise<LavaSearchResponse | SearchResult>;
    /**
     * Set the SponsorBlock
     * @param segments The segments to set
     */
    setSponsorBlock(segments?: SponsorBlockSegment[]): Promise<void>;
    /**
     * Get the SponsorBlock
     */
    getSponsorBlock(): Promise<SponsorBlockSegment[]>;
    /**
     * Delete the SponsorBlock
     */
    deleteSponsorBlock(): Promise<void>;
    /**
     *
     * @param query Query for your data
     * @param requestUser
     */
    search(query: SearchQuery, requestUser: unknown, throwOnEmpty?: boolean): Promise<UnresolvedSearchResult | SearchResult>;
    /**
     * Pause the player
     */
    pause(): Promise<this>;
    /**
     * Resume the Player
     */
    resume(): Promise<this>;
    /**
     * Seek to a specific Position
     * @param position
     */
    seek(position: number): Promise<this>;
    /**
     * Set the Repeatmode of the Player
     * @param repeatMode
     */
    setRepeatMode(repeatMode: RepeatMode): Promise<this>;
    /**
     * Skip the current song, or a specific amount of songs
     * @param amount provide the index of the next track to skip to
     */
    skip(skipTo?: number, throwError?: boolean): Promise<this>;
    /**
     * Clears the queue and stops playing. Does not destroy the Player and not leave the channel
     * @returns
     */
    stopPlaying(clearQueue?: boolean, executeAutoplay?: boolean): Promise<this>;
    /**
     * Connects the Player to the Voice Channel
     * @returns
     */
    connect(): Promise<this>;
    changeVoiceState(data: {
        voiceChannelId?: string;
        selfDeaf?: boolean;
        selfMute?: boolean;
    }): Promise<this>;
    /**
     * Disconnects the Player from the Voice Channel, but keeps the player in the cache
     * @param force If false it throws an error, if player thinks it's already disconnected
     * @returns
     */
    disconnect(force?: boolean): Promise<this>;
    destroy(reason?: DestroyReasons | string, disconnect?: boolean): Promise<this>;
    /**
     * Get the current lyrics of the track currently playing on the guild
     * @param guildId The guild id to get the current lyrics for
     * @param skipTrackSource If true, it will not try to get the lyrics from the track source
     * @returns The current lyrics
     * @example
     * ```ts
     * const lyrics = await player.getCurrentLyrics();
     * ```
     */
    getCurrentLyrics(skipTrackSource?: boolean): Promise<LyricsResult>;
    /**
     * Get the lyrics of a specific track
     * @param track The track to get the lyrics for
     * @param skipTrackSource If true, it will not try to get the lyrics from the track source
     * @returns The lyrics of the track
     * @example
     * ```ts
     * const lyrics = await player.getLyrics(player.queue.tracks[0], true);
     * ```
     */
    getLyrics(track: Track, skipTrackSource?: boolean): Promise<LyricsResult>;
    /**
     * Subscribe to the lyrics event on a specific guild to active live lyrics events
     * @returns The unsubscribe function
     * @example
     * ```ts
     * const lyrics = await player.subscribeLyrics();
     * ```
     */
    subscribeLyrics(): Promise<unknown>;
    /**
     * Unsubscribe from the lyrics event on a specific guild to disable live lyrics events
     * @returns The unsubscribe function
     * @example
     * ```ts
     * const lyrics = await player.unsubscribeLyrics();
     * ```
     */
    unsubscribeLyrics(): Promise<void>;
    /**
     * Move the player on a different Audio-Node
     * @param newNode New Node / New Node Id
     * @param checkSources If it should check if the sources are supported by the new node @default true
     * @return The new Node Id
     * @example
     * ```ts
     * const changeNode = await player.changeNode(newNode, true);
     * ```
     */
    changeNode(newNode: LavalinkNode | string, checkSources?: boolean): Promise<string>;
    /**
     * Move the player to a different node. If no node is provided, it will find the least used node that is not the same as the current node.
     * @param node the id of the node to move to
     * @returns the player
     * @throws RangeError if there is no available nodes.
     * @throws Error if the node to move to is the same as the current node.
     */
    moveNode(node?: string): Promise<string | this>;
    /** Converts the Player including Queue to a Json state */
    toJSON(): PlayerJson;
}

interface StoredQueue {
    current: Track | null;
    previous: Track[];
    tracks: (Track | UnresolvedTrack)[];
}
interface QueueStoreManager {
    /** @async get a Value (MUST RETURN UNPARSED!) */
    get: (guildId: string) => Awaitable<StoredQueue | string>;
    /** @async Set a value inside a guildId (MUST BE UNPARSED) */
    set: (guildId: string, value: StoredQueue | string) => Awaitable<void | boolean>;
    /** @async Delete a Database Value based of it's guildId */
    delete: (guildId: string) => Awaitable<void | boolean>;
    /** @async Transform the value(s) inside of the QueueStoreManager (IF YOU DON'T NEED PARSING/STRINGIFY, then just return the value) */
    stringify: (value: StoredQueue | string) => Awaitable<StoredQueue | string>;
    /** @async Parse the saved value back to the Queue (IF YOU DON'T NEED PARSING/STRINGIFY, then just return the value) */
    parse: (value: StoredQueue | string) => Awaitable<Partial<StoredQueue>>;
}
interface ManagerQueueOptions<CustomPlayerT extends Player = Player> {
    /** Maximum Amount of tracks for the queue.previous array. Set to 0 to not save previous songs. Defaults to 25 Tracks */
    maxPreviousTracks?: number;
    /** Custom Queue Store option */
    queueStore?: QueueStoreManager;
    /** Custom Queue Watcher class */
    queueChangesWatcher?: QueueChangesWatcher;
}
interface QueueChangesWatcher {
    /** get a Value (MUST RETURN UNPARSED!) */
    tracksAdd: (guildId: string, tracks: (Track | UnresolvedTrack)[], position: number, oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => void;
    /** Set a value inside a guildId (MUST BE UNPARSED) */
    tracksRemoved: (guildId: string, tracks: (Track | UnresolvedTrack)[], position: number | number[], oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => void;
    /** Set a value inside a guildId (MUST BE UNPARSED) */
    shuffled: (guildId: string, oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => void;
}

type DestroyReasonsType = keyof typeof DestroyReasons | string;
type DisconnectReasonsType = keyof typeof DisconnectReasons | string;
interface PlayerJson {
    /** Guild Id where the player was playing in */
    guildId: string;
    /** Options provided to the player */
    options: PlayerOptions;
    /** Voice Channel Id the player was playing in */
    voiceChannelId: string;
    /** Text Channel Id the player was synced to */
    textChannelId?: string;
    /** Position the player was at */
    position: number;
    /** Lavalink's position the player was at */
    lastPosition: number;
    /** Last time the position was sent from lavalink */
    lastPositionChange: number | null;
    /** Volume in % from the player (without volumeDecrementer) */
    volume: number;
    /** Real Volume used in lavalink (with the volumeDecrementer) */
    lavalinkVolume: number;
    /** The repeatmode from the player */
    repeatMode: RepeatMode;
    /** Pause state */
    paused: boolean;
    /** Wether the player was playing or not */
    playing: boolean;
    /** When the player was created */
    createdTimeStamp?: number;
    /** All current used fitlers Data */
    filters: FilterData;
    /** The player's ping object */
    ping: {
        /** Ping to the voice websocket server */
        ws: number;
        /** Avg. calc. Ping to the lavalink server */
        lavalink: number;
    };
    /** Equalizer Bands used in lavalink */
    equalizer: EQBand[];
    /** The Id of the last used node */
    nodeId?: string;
    /** The SessionId of the node */
    nodeSessionId?: string;
    /** The stored queue */
    queue?: StoredQueue;
}
type RepeatMode = "queue" | "track" | "off";
interface PlayerOptions {
    /** Guild id of the player */
    guildId: string;
    /** The Voice Channel Id */
    voiceChannelId: string;
    /** The Text Channel Id of the Player */
    textChannelId?: string;
    /** instantly change volume with the one play request */
    volume?: number;
    /** VC Region for node selections */
    vcRegion?: string;
    /** if it should join deafened */
    selfDeaf?: boolean;
    /** If it should join muted */
    selfMute?: boolean;
    /** If it should use a specific lavalink node */
    node?: LavalinkNode | string;
    /** If when applying filters, it should use the insta apply filters fix  */
    instaUpdateFiltersFix?: boolean;
    /** If a volume should be applied via filters instead of lavalink-volume */
    applyVolumeAsFilter?: boolean;
    /** Custom Data for the player get/set datastorage */
    customData?: anyObject;
}
type anyObject = {
    [key: string | number]: string | number | null | anyObject;
};
interface BasePlayOptions {
    /** The position to start the track. */
    position?: number;
    /** The position to end the track. */
    endTime?: number;
    /** If to start "paused" */
    paused?: boolean;
    /** The Volume to start with */
    volume?: number;
    /** The Lavalink Filters to use | only with the new REST API */
    filters?: Partial<LavalinkFilterData>;
    /** Voice Update for Lavalink */
    voice?: LavalinkPlayerVoiceOptions;
}
interface LavalinkPlayOptions extends BasePlayOptions {
    /** Which Track to play | don't provide, if it should pick from the Queue */
    track?: {
        /** The track encoded base64 string to use instead of the one from the queue system */
        encoded?: Base64 | null;
        /** The identifier of the track to use */
        identifier?: string;
        /** Custom User Data for the track to provide, will then be on the userData object from the track */
        userData?: anyObject;
        /** The Track requester for when u provide encodedTrack / identifer */
        requester?: unknown;
    };
}
interface PlayOptions extends LavalinkPlayOptions {
    /** Whether to not replace the track if a play payload is sent. */
    noReplace?: boolean;
    /** Adds track on queue and skips to it */
    clientTrack?: Track | UnresolvedTrack;
}

/** Ability to manipulate fetch requests */
type ModifyRequest = (options: RequestInit & {
    path: string;
    extraQueryUrlParams?: URLSearchParams;
}) => void;
type SponsorBlockSegment = "sponsor" | "selfpromo" | "interaction" | "intro" | "outro" | "preview" | "music_offtopic" | "filler";
/**
 * Node Options for creating a lavalink node
 */
interface LavalinkNodeOptions {
    /** The Lavalink Server-Ip / Domain-URL */
    host: string;
    /** The Lavalink Connection Port */
    port: number;
    /** The Lavalink Password / Authorization-Key */
    authorization: string;
    /** Does the Server use ssl (https) */
    secure?: boolean;
    /** RESUME THE PLAYER? by providing a sessionid on the node-creation */
    sessionId?: string;
    /** Add a Custom ID to the node, for later use */
    id?: string;
    /** Voice Regions of this Node */
    regions?: string[];
    /** The retryAmount for the node. */
    retryAmount?: number;
    /** The retryDelay for the node. */
    retryDelay?: number;
    /** signal for cancelling requests - default: AbortSignal.timeout(options.requestSignalTimeoutMS || 10000) - put <= 0 to disable */
    requestSignalTimeoutMS?: number;
    /** Close on error */
    closeOnError?: boolean;
    /** Heartbeat interval , set to <= 0 to disable heartbeat system */
    heartBeatInterval?: 30000;
    /** Recommended, to check wether the client is still connected or not on the stats endpoint */
    enablePingOnStatsCheck?: boolean;
}
/**
 * Memory Stats object from lavalink
 */
interface MemoryStats {
    /** The free memory of the allocated amount. */
    free: number;
    /** The used memory of the allocated amount. */
    used: number;
    /** The total allocated memory. */
    allocated: number;
    /** The reservable memory. */
    reservable: number;
}
/**
 * CPU Stats object from lavalink
 */
interface CPUStats {
    /** The core amount the host machine has. */
    cores: number;
    /** The system load. */
    systemLoad: number;
    /** The lavalink load. */
    lavalinkLoad: number;
}
/**
 * FrameStats Object from lavalink
 */
interface FrameStats {
    /** The amount of sent frames. */
    sent?: number;
    /** The amount of nulled frames. */
    nulled?: number;
    /** The amount of deficit frames. */
    deficit?: number;
}
/**
 * BaseNodeStats object from Lavalink
 */
interface BaseNodeStats {
    /** The amount of players on the node. */
    players: number;
    /** The amount of playing players on the node. */
    playingPlayers: number;
    /** The uptime for the node. */
    uptime: number;
    /** The memory stats for the node. */
    memory: MemoryStats;
    /** The cpu stats for the node. */
    cpu: CPUStats;
    /** The frame stats for the node. */
    frameStats: FrameStats;
}
/**
 * Interface for nodeStats from lavalink
 */
interface NodeStats extends BaseNodeStats {
    /** The frame stats for the node. */
    frameStats: FrameStats;
}
/**
 * Entire lavalink information object from lavalink
 */
interface LavalinkInfo {
    /** The version of this Lavalink server */
    version: VersionObject;
    /** The millisecond unix timestamp when this Lavalink jar was built */
    buildTime: number;
    /** The git information of this Lavalink server */
    git: GitObject;
    /** The JVM version this Lavalink server runs on */
    jvm: string;
    /** The Lavaplayer version being used by this server */
    lavaplayer: string;
    /** The enabled source managers for this server */
    sourceManagers: string[];
    /** The enabled filters for this server */
    filters: string[];
    /** The enabled plugins for this server */
    plugins: PluginObject[];
}
/**
 * Lavalink's version object from lavalink
 */
interface VersionObject {
    /** The full version string of this Lavalink server */
    semver: string;
    /** The major version of this Lavalink server */
    major: number;
    /** The minor version of this Lavalink server */
    minor: number;
    /** The patch version of this Lavalink server */
    patch: internal;
    /** The pre-release version according to semver as a . separated list of identifiers */
    preRelease?: string;
    /** The build metadata according to semver as a . separated list of identifiers */
    build?: string;
}
/**
 * Git information object from lavalink
 */
interface GitObject {
    /** The branch this Lavalink server was built on */
    branch: string;
    /** The commit this Lavalink server was built on */
    commit: string;
    /** The millisecond unix timestamp for when the commit was created */
    commitTime: string;
}
/**
 * Lavalink's plugins object from lavalink's plugin
 */
interface PluginObject {
    /** The name of the plugin */
    name: string;
    /** The version of the plugin */
    version: string;
}
interface LyricsResult {
    /**The name of the source */
    sourceName: string;
    /**The name of the provider */
    provider: string;
    /**The result text */
    text: string | null;
    /**The lyrics lines */
    lines: LyricsLine[];
    /**Information about the plugin */
    plugin: PluginInfo;
}
interface LyricsLine {
    /**The millisecond timestamp */
    timestamp: number;
    /**The line duration in milliseconds */
    duration: number | null;
    /**The line text */
    line: string;
    /**Information about the plugin */
    plugin: PluginInfo;
}
type LavalinkNodeIdentifier = string;
interface NodeManagerEvents {
    /**
     * Emitted when a Node is created.
     * @event Manager.nodeManager#create
     */
    "create": (node: LavalinkNode) => void;
    /**
     * Emitted when a Node is destroyed.
     * @event Manager.nodeManager#destroy
     */
    "destroy": (node: LavalinkNode, destroyReason?: DestroyReasonsType) => void;
    /**
     * Emitted when a Node is connected.
     * @event Manager.nodeManager#connect
     */
    "connect": (node: LavalinkNode) => void;
    /**
     * Emitted when a Node is reconnecting.
     * @event Manager.nodeManager#reconnecting
    */
    "reconnecting": (node: LavalinkNode) => void;
    /**
     * Emitted When a node starts to reconnect (if you have a reconnection delay, the reconnecting event will be emitted after the retryDelay.)
     * Useful to check wether the internal node reconnect system works or not
     * @event Manager.nodeManager#reconnectinprogress
     */
    "reconnectinprogress": (node: LavalinkNode) => void;
    /**
     * Emitted when a Node is disconnects.
     * @event Manager.nodeManager#disconnect
    */
    "disconnect": (node: LavalinkNode, reason: {
        code?: number;
        reason?: string;
    }) => void;
    /**
     * Emitted when a Node is error.
     * @event Manager.nodeManager#error
    */
    "error": (node: LavalinkNode, error: Error, payload?: unknown) => void;
    /**
     * Emits every single Node event.
     * @event Manager.nodeManager#raw
    */
    "raw": (node: LavalinkNode, payload: unknown) => void;
    /**
     * Emits when the node connects resumed. You then need to create all players within this event for your usecase.
     * Aka for that you need to be able to save player data like vc channel + text channel in a db and then sync it again
     * @event Manager.nodeManager#nodeResumed
     */
    "resumed": (node: LavalinkNode, payload: {
        resumed: true;
        sessionId: string;
        op: "ready";
    }, players: LavalinkPlayer[] | InvalidLavalinkRestRequest) => void;
}

declare const TrackSymbol: unique symbol;
declare const UnresolvedTrackSymbol: unique symbol;
declare const QueueSymbol: unique symbol;
declare const NodeSymbol: unique symbol;
/**
 * Parses Node Connection Url: "lavalink://<nodeId>:<nodeAuthorization(Password)>@<NodeHost>:<NodePort>"
 * @param connectionUrl
 * @returns
 */
declare function parseLavalinkConnUrl(connectionUrl: string): {
    authorization: string;
    id: string;
    host: string;
    port: number;
};
declare class ManagerUtils {
    LavalinkManager: LavalinkManager | undefined;
    constructor(LavalinkManager?: LavalinkManager);
    buildPluginInfo(data: any, clientData?: any): any;
    buildTrack(data: LavalinkTrack | Track, requester: unknown): Track;
    /**
     * Builds a UnresolvedTrack to be resolved before being played  .
     * @param query
     * @param requester
     */
    buildUnresolvedTrack(query: UnresolvedQuery | UnresolvedTrack, requester: unknown): UnresolvedTrack;
    /**
     * Validate if a data is equal to a node
     * @param data
     */
    isNode(data: LavalinkNode): boolean;
    getTransformedRequester(requester: unknown): unknown;
    /**
     * Validate if a data is equal to node options
     * @param data
     */
    isNodeOptions(data: LavalinkNodeOptions): boolean;
    /**
     * Validate if a data is equal to a track
     * @param data the Track to validate
     * @returns
     */
    isTrack(data: Track | UnresolvedTrack): data is Track;
    /**
     * Checks if the provided argument is a valid UnresolvedTrack.
     * @param track
     */
    isUnresolvedTrack(data: UnresolvedTrack | Track): data is UnresolvedTrack;
    /**
     * Checks if the provided argument is a valid UnresolvedTrack.
     * @param track
     */
    isUnresolvedTrackQuery(data: UnresolvedQuery): boolean;
    getClosestTrack(data: UnresolvedTrack, player: Player): Promise<Track | undefined>;
    validateQueryString(node: LavalinkNode, queryString: string, sourceString?: LavalinkSearchPlatform): void;
    transformQuery(query: SearchQuery): {
        query: string;
        extraQueryUrlParams: URLSearchParams;
        source: any;
    };
    transformLavaSearchQuery(query: LavaSearchQuery): {
        query: string;
        types: string[];
        source: any;
    };
    validateSourceString(node: LavalinkNode, sourceString: SearchPlatform): void;
}
/**
 * Separate interface for the constructor so that emitted js does not have a constructor that overwrites itself
 *
 * @internal
 */
interface MiniMap<K, V> extends Map<K, V> {
    constructor: MiniMapConstructor;
}
declare class MiniMap<K, V> extends Map<K, V> {
    constructor(data?: [K, V][]);
    /**
     * Identical to
     * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
     * but returns a MiniMap instead of an Array.
     *
     * @param fn The function to test with (should return boolean)
     * @param thisArg Value to use as `this` when executing function
     *
     * @example
     * miniMap.filter(user => user.username === 'Bob');
     */
    filter<K2 extends K>(fn: (value: V, key: K, miniMap: this) => key is K2): MiniMap<K2, V>;
    filter<V2 extends V>(fn: (value: V, key: K, miniMap: this) => value is V2): MiniMap<K, V2>;
    filter(fn: (value: V, key: K, miniMap: this) => boolean): MiniMap<K, V>;
    filter<This, K2 extends K>(fn: (this: This, value: V, key: K, miniMap: this) => key is K2, thisArg: This): MiniMap<K2, V>;
    filter<This, V2 extends V>(fn: (this: This, value: V, key: K, miniMap: this) => value is V2, thisArg: This): MiniMap<K, V2>;
    filter<This>(fn: (this: This, value: V, key: K, miniMap: this) => boolean, thisArg: This): MiniMap<K, V>;
    toJSON(): [K, V][];
    /**
     * Maps each item to another value into an array. Identical in behavior to
     * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
     *
     * @param fn Function that produces an element of the new array, taking three arguments
     * @param thisArg Value to use as `this` when executing function
     *
     * @example
     * miniMap.map(user => user.tag);
     */
    map<T>(fn: (value: V, key: K, miniMap: this) => T): T[];
    map<This, T>(fn: (this: This, value: V, key: K, miniMap: this) => T, thisArg: This): T[];
}
declare function queueTrackEnd(player: Player, dontShiftQueue?: boolean): Promise<Track>;
declare function safeStringify(obj: any, padding?: number): string;

/** Helper for generating Opaque types. */
type Opaque<T, K> = T & {
    __opaque__: K;
};
/** Opqaue tyep for integernumber */
type IntegerNumber = Opaque<number, 'Int'>;
/** Opqaue tyep for floatnumber */
type FloatNumber = Opaque<number, 'Float'>;
type LavaSrcSearchPlatformBase = "spsearch" | "sprec" | "amsearch" | "dzsearch" | "dzisrc" | "dzrec" | "ymsearch" | "ymrec" | "vksearch" | "vkrec" | "tdsearch" | "tdrec" | "qbsearch" | "qbisrc" | "qbrec";
type LavaSrcSearchPlatform = LavaSrcSearchPlatformBase | "ftts";
type JioSaavnSearchPlatform = "jssearch" | "jsrec";
type DuncteSearchPlatform = "speak" | "phsearch" | "pornhub" | "porn" | "tts";
type NazhaClientSearchPlatform = "bcsearch";
type NazhaClientSearchPlatformResolve = "bandcamp" | "bc";
type LavalinkSearchPlatform = "ytsearch" | "ytmsearch" | "scsearch" | "bcsearch" | LavaSrcSearchPlatform | DuncteSearchPlatform | JioSaavnSearchPlatform | NazhaClientSearchPlatform;
type ClientCustomSearchPlatformUtils = "local" | "http" | "https" | "link" | "uri";
type ClientSearchPlatform = ClientCustomSearchPlatformUtils | // for file/link requests
"youtube" | "yt" | "youtube music" | "youtubemusic" | "ytm" | "musicyoutube" | "music youtube" | "soundcloud" | "sc" | "am" | "apple music" | "applemusic" | "apple" | "musicapple" | "music apple" | "sp" | "spsuggestion" | "spotify" | "spotify.com" | "spotifycom" | "dz" | "deezer" | "yandex" | "yandex music" | "yandexmusic" | "vk" | "vk music" | "vkmusic" | "tidal" | "tidal music" | "qobuz" | "flowerytts" | "flowery" | "flowery.tts" | NazhaClientSearchPlatformResolve | NazhaClientSearchPlatform | "js" | "jiosaavn" | "td" | "tidal" | "tdrec";
type SearchPlatform = LavalinkSearchPlatform | ClientSearchPlatform;
type SourcesRegex = "YoutubeRegex" | "YoutubeMusicRegex" | "SoundCloudRegex" | "SoundCloudMobileRegex" | "DeezerTrackRegex" | "DeezerArtistRegex" | "DeezerEpisodeRegex" | "DeezerMixesRegex" | "DeezerPageLinkRegex" | "DeezerPlaylistRegex" | "DeezerAlbumRegex" | "AllDeezerRegex" | "AllDeezerRegexWithoutPageLink" | "SpotifySongRegex" | "SpotifyPlaylistRegex" | "SpotifyArtistRegex" | "SpotifyEpisodeRegex" | "SpotifyShowRegex" | "SpotifyAlbumRegex" | "AllSpotifyRegex" | "mp3Url" | "m3uUrl" | "m3u8Url" | "mp4Url" | "m4aUrl" | "wavUrl" | "aacpUrl" | "tiktok" | "mixcloud" | "musicYandex" | "radiohost" | "bandcamp" | "jiosaavn" | "appleMusic" | "tidal" | "TwitchTv" | "vimeo";
interface PlaylistInfo {
    /** The playlist name */
    name: string;
    /** The playlist title (same as name) */
    title: string;
    /** The playlist Author */
    author?: string;
    /** The playlist Thumbnail */
    thumbnail?: string;
    /** A Uri to the playlist */
    uri?: string;
    /** The playlist selected track. */
    selectedTrack: Track | null;
    /** The duration of the entire playlist. (calcualted) */
    duration: number;
}
interface SearchResult {
    loadType: LoadTypes;
    exception: Exception | null;
    pluginInfo: PluginInfo;
    playlist: PlaylistInfo | null;
    tracks: Track[];
}
interface UnresolvedSearchResult {
    loadType: LoadTypes;
    exception: Exception | null;
    pluginInfo: PluginInfo;
    playlist: PlaylistInfo | null;
    tracks: UnresolvedTrack[];
}
/**
 * @internal
 */
interface MiniMapConstructor {
    new (): MiniMap<unknown, unknown>;
    new <K, V>(entries?: ReadonlyArray<readonly [K, V]> | null): MiniMap<K, V>;
    new <K, V>(iterable: Iterable<readonly [K, V]>): MiniMap<K, V>;
    readonly prototype: MiniMap<unknown, unknown>;
    readonly [Symbol.species]: MiniMapConstructor;
}
type PlayerEvents = TrackStartEvent | TrackEndEvent | TrackStuckEvent | TrackExceptionEvent | WebSocketClosedEvent | SponsorBlockSegmentEvents | LyricsEvent;
type Severity = "COMMON" | "SUSPICIOUS" | "FAULT";
interface Exception {
    /** Severity of the error */
    severity: Severity;
    /** Nodejs Error */
    error?: Error;
    /** Message by lavalink */
    message: string;
    /** Cause by lavalink */
    cause: string;
    /** causeStackTrace by lavalink */
    causeStackTrace: string;
}
interface PlayerEvent {
    op: "event";
    type: PlayerEventType;
    guildId: string;
}
interface TrackStartEvent extends PlayerEvent {
    type: "TrackStartEvent";
    track: LavalinkTrack;
}
interface TrackEndEvent extends PlayerEvent {
    type: "TrackEndEvent";
    track: LavalinkTrack;
    reason: TrackEndReason;
}
interface TrackExceptionEvent extends PlayerEvent {
    type: "TrackExceptionEvent";
    exception?: Exception;
    track: LavalinkTrack;
    error: string;
}
interface TrackStuckEvent extends PlayerEvent {
    type: "TrackStuckEvent";
    thresholdMs: number;
    track: LavalinkTrack;
}
interface WebSocketClosedEvent extends PlayerEvent {
    type: "WebSocketClosedEvent";
    code: number;
    byRemote: boolean;
    reason: string;
}
/**
 * Types & Events for Sponsorblock-plugin from Lavalink: https://github.com/topi314/Sponsorblock-Plugin#segmentsloaded
 */
type SponsorBlockSegmentEvents = SponsorBlockSegmentSkipped | SponsorBlockSegmentsLoaded | SponsorBlockChapterStarted | SponsorBlockChaptersLoaded;
type SponsorBlockSegmentEventType = "SegmentSkipped" | "SegmentsLoaded" | "ChaptersLoaded" | "ChapterStarted";
interface SponsorBlockSegmentsLoaded extends PlayerEvent {
    type: "SegmentsLoaded";
    segments: {
        category: string;
        start: number;
        end: number;
    }[];
}
interface SponsorBlockSegmentSkipped extends PlayerEvent {
    type: "SegmentSkipped";
    segment: {
        category: string;
        start: number;
        end: number;
    };
}
interface SponsorBlockChapterStarted extends PlayerEvent {
    type: "ChapterStarted";
    /** The Chapter which started */
    chapter: {
        /** The Name of the Chapter */
        name: string;
        start: number;
        end: number;
        duration: number;
    };
}
interface SponsorBlockChaptersLoaded extends PlayerEvent {
    type: "ChaptersLoaded";
    /** All Chapters loaded */
    chapters: {
        /** The Name of the Chapter */
        name: string;
        start: number;
        end: number;
        duration: number;
    }[];
}
/**
 * Types & Events for Lyrics plugin from Lavalink: https://github.com/topi314/LavaLyrics
 */
type LyricsEvent = LyricsFoundEvent | LyricsNotFoundEvent | LyricsLineEvent;
type LyricsEventType = "LyricsFoundEvent" | "LyricsNotFoundEvent" | "LyricsLineEvent";
interface LyricsFoundEvent extends PlayerEvent {
    /** The lyricsfound event */
    type: "LyricsFoundEvent";
    /** The guildId */
    guildId: string;
    /** The lyrics */
    lyrics: LyricsResult;
}
interface LyricsFoundEvent extends PlayerEvent {
    /** The lyricsfound event */
    type: "LyricsFoundEvent";
    /** The guildId */
    guildId: string;
    /** The lyrics */
    lyrics: LyricsResult;
}
interface LyricsNotFoundEvent extends PlayerEvent {
    /**The lyricsnotfound event*/
    type: "LyricsNotFoundEvent";
    /**The guildId*/
    guildId: string;
}
interface LyricsNotFoundEvent extends PlayerEvent {
    /**The lyricsnotfound event*/
    type: "LyricsNotFoundEvent";
    /**The guildId*/
    guildId: string;
}
interface LyricsLineEvent extends PlayerEvent {
    /**The lyricsline event*/
    type: "LyricsLineEvent";
    /** The guildId */
    guildId: string;
    /** The line number */
    lineIndex: number;
    /** The line */
    line: LyricsLine;
    /**skipped is true if the line was skipped */
    skipped: boolean;
}
interface LyricsLineEvent extends PlayerEvent {
    /**The lyricsline event*/
    type: "LyricsLineEvent";
    /** The guildId */
    guildId: string;
    /** The line number */
    lineIndex: number;
    /** The line */
    line: LyricsLine;
    /**skipped is true if the line was skipped */
    skipped: boolean;
}
type LoadTypes = "track" | "playlist" | "search" | "error" | "empty";
type State = "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "DISCONNECTING" | "DESTROYING";
type PlayerEventType = "TrackStartEvent" | "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent" | SponsorBlockSegmentEventType | LyricsEventType;
type TrackEndReason = "finished" | "loadFailed" | "stopped" | "replaced" | "cleanup";
interface InvalidLavalinkRestRequest {
    /** Rest Request Data for when it was made */
    timestamp: number;
    /** Status of the request */
    status: number;
    /** Specific Errro which was sent */
    error: string;
    /** Specific Message which was created */
    message?: string;
    /** The specific error trace from the request */
    trace?: unknown;
    /** Path of where it's from */
    path: string;
}
interface LavalinkPlayerVoice {
    /** The Voice Token */
    token: string;
    /** The Voice Server Endpoint  */
    endpoint: string;
    /** The Voice SessionId */
    sessionId: string;
    /** Wether or not the player is connected */
    connected?: boolean;
    /** The Ping to the voice server */
    ping?: number;
}
type LavalinkPlayerVoiceOptions = Omit<LavalinkPlayerVoice, 'connected' | 'ping'>;
interface FailingAddress {
    /** The failing address */
    failingAddress: string;
    /** The timestamp when the address failed */
    failingTimestamp: number;
    /** The timestamp when the address failed as a pretty string */
    failingTime: string;
}
type RoutePlannerTypes = "RotatingIpRoutePlanner" | "NanoIpRoutePlanner" | "RotatingNanoIpRoutePlanner" | "BalancingIpRoutePlanner";
interface RoutePlanner {
    class?: RoutePlannerTypes;
    details?: {
        /** The ip block being used */
        ipBlock: {
            /** The type of the ip block */
            type: "Inet4Address" | "Inet6Address";
            /** 	The size of the ip block */
            size: string;
        };
        /** The failing addresses */
        failingAddresses: FailingAddress[];
        /** The number of rotations */
        rotateIndex?: string;
        /** The current offset in the block	 */
        ipIndex?: string;
        /** The current address being used	 */
        currentAddress?: string;
        /** The current offset in the ip block */
        currentAddressIndex?: string;
        /** The information in which /64 block ips are chosen. This number increases on each ban. */
        blockIndex?: string;
    };
}
interface Session {
    /** Wether or not session is resuming or not */
    resuming: boolean;
    /** For how long a session is lasting while not connected */
    timeout: number;
}
interface GuildShardPayload {
    /** The OP code */
    op: number;
    /** Data to send  */
    d: {
        /** Guild id to apply voice settings */
        guild_id: string;
        /** channel to move/connect to, or null to leave it */
        channel_id: string | null;
        /** wether or not mute yourself */
        self_mute: boolean;
        /** wether or not deafen yourself */
        self_deaf: boolean;
    };
}
interface PlayerUpdateInfo {
    /** guild id of the player */
    guildId: string;
    /** Player options to provide to lavalink */
    playerOptions: LavalinkPlayOptions;
    /** Whether or not replace the current track with the new one (true is recommended) */
    noReplace?: boolean;
}
interface LavalinkPlayer {
    /** Guild Id of the player */
    guildId: string;
    /** IF playing a track, all of the track information */
    track?: LavalinkTrack;
    /** Lavalink volume (mind volumedecrementer) */
    volume: number;
    /** Wether it's paused or not */
    paused: boolean;
    /** Voice Endpoint data */
    voice: LavalinkPlayerVoice;
    /** All Audio Filters */
    filters: Partial<LavalinkFilterData>;
    /** Lavalink-Voice-State Variables */
    state: {
        /** Time since connection established */
        time: number;
        /** Position of the track */
        position: number;
        /** COnnected or not */
        connected: boolean;
        /** Ping to voice server */
        ping: number;
    };
}
interface ChannelDeletePacket {
    /** Packet key for channel delete */
    t: "CHANNEL_DELETE";
    /** data which is sent and relevant */
    d: {
        /** guild id */
        guild_id: string;
        /** Channel id */
        id: string;
    };
}
interface VoiceState {
    /** OP key from lavalink */
    op: "voiceUpdate";
    /** GuildId provided by lavalink */
    guildId: string;
    /** Event data */
    event: VoiceServer;
    /** Session Id of the voice connection */
    sessionId?: string;
    /** guild id of the voice channel */
    guild_id: string;
    /** user id from the voice connection */
    user_id: string;
    /** Session Id of the voice connection */
    session_id: string;
    /** Voice Channel Id */
    channel_id: string;
    /** Server Mute status */
    mute: boolean;
    /** Server Deaf status */
    deaf: boolean;
    /** Self Deaf status */
    self_deaf: boolean;
    /** Self Mute status */
    self_mute: boolean;
    /** Self Video (Camera) status */
    self_video: boolean;
    /** Self Stream status */
    self_stream: boolean;
    /** Wether the user requests to speak (stage channel) */
    request_to_speak_timestamp: boolean;
    /** Self suppressed status (stage channel) */
    suppress: boolean;
}
/** The Base64 decodes tring by lavalink */
type Base64 = string;
interface VoiceServer {
    /** Voice Token */
    token: string;
    /** Guild Id of the voice server connection */
    guild_id: string;
    /** Server Endpoint */
    endpoint: string;
}
interface VoicePacket {
    /** Voice Packet Keys to send */
    t?: "VOICE_SERVER_UPDATE" | "VOICE_STATE_UPDATE";
    /** Voice Packets to send */
    d: VoiceState | VoiceServer;
}
interface NodeMessage extends NodeStats {
    /** The type of the event */
    type: PlayerEventType;
    /** what ops are applying to that event */
    op: "stats" | "playerUpdate" | "event";
    /** The specific guild id for that message */
    guildId: string;
}
/** Specific types to filter for lavasearch, will be filtered to correct types */
type LavaSearchType = "track" | "album" | "artist" | "playlist" | "text" | "tracks" | "albums" | "artists" | "playlists" | "texts";
interface LavaSearchFilteredResponse {
    /** The Information of a playlist provided by lavasearch */
    info: PlaylistInfo;
    /** additional plugin information */
    pluginInfo: PluginInfo;
    /** List of tracks  */
    tracks: Track[];
}
interface LavaSearchResponse {
    /** An array of tracks, only present if track is in types */
    tracks: Track[];
    /** An array of albums, only present if album is in types */
    albums: LavaSearchFilteredResponse[];
    /** 	An array of artists, only present if artist is in types */
    artists: LavaSearchFilteredResponse[];
    /** 	An array of playlists, only present if playlist is in types */
    playlists: LavaSearchFilteredResponse[];
    /** An array of text results, only present if text is in types */
    texts: {
        text: string;
        pluginInfo: PluginInfo;
    }[];
    /** Addition result data provided by plugins */
    pluginInfo: PluginInfo;
}
/** SearchQuery Object for raw lavalink requests */
type SearchQuery = {
    /** lavalink search Query / identifier string */
    query: string;
    /** Extra url query params to use, e.g. for flowertts */
    extraQueryUrlParams?: URLSearchParams;
    /** Source to append to the search query string */
    source?: SearchPlatform;
} | /** Our just the search query / identifier string */ string;
/** SearchQuery Object for Lavalink LavaSearch Plugin requests */
type LavaSearchQuery = {
    /** lavalink search Query / identifier string */
    query: string;
    /** Source to append to the search query string */
    source: LavaSrcSearchPlatformBase;
    /** The Types to filter the search to */
    types?: LavaSearchType[];
};
type Awaitable<T> = Promise<T> | T;

/**
 * Lavalink Node creator class
 */
declare class LavalinkNode {
    private heartBeatPingTimestamp;
    private heartBeatPongTimestamp;
    get heartBeatPing(): number;
    private heartBeatInterval?;
    private pingTimeout?;
    isAlive: boolean;
    /** The provided Options of the Node */
    options: LavalinkNodeOptions;
    /** The amount of rest calls the node has made. */
    calls: number;
    /** Stats from lavalink, will be updated via an interval by lavalink. */
    stats: NodeStats;
    /** The current sessionId, only present when connected */
    sessionId?: string | null;
    /** Wether the node resuming is enabled or not */
    resuming: {
        enabled: boolean;
        timeout: number | null;
    };
    /** Actual Lavalink Information of the Node */
    info: LavalinkInfo | null;
    /** The Node Manager of this Node */
    private NodeManager;
    /** The Reconnection Timeout */
    private reconnectTimeout?;
    /** The Reconnection Attempt counter */
    private reconnectAttempts;
    /** The Socket of the Lavalink */
    private socket;
    /** Version of what the Lavalink Server should be */
    private version;
    /**
     * Create a new Node
     * @param options Lavalink Node Options
     * @param manager Node Manager
     *
     *
     * @example
     * ```ts
     * // don't create a node manually, instead use:
     *
     * client.lavalink.nodeManager.createNode(options)
     * ```
     */
    constructor(options: LavalinkNodeOptions, manager: NodeManager);
    /**
     * Raw Request util function
     * @param endpoint endpoint string
     * @param modify modify the request
     * @param extraQueryUrlParams UrlSearchParams to use in a encodedURI, useful for example for flowertts
     * @returns object containing request and option information
     *
     * @example
     * ```ts
     * player.node.rawRequest(`/loadtracks?identifier=Never gonna give you up`, (options) => options.method = "GET");
     * ```
     */
    private rawRequest;
    /**
     * Makes an API call to the Node. Should only be used for manual parsing like for not supported plugins
     * @param endpoint The endpoint that we will make the call to
     * @param modify Used to modify the request before being sent
     * @returns The returned data
     *
     * @example
     * ```ts
     * player.node.request(`/loadtracks?identifier=Never gonna give you up`, (options) => options.method = "GET", false);
     * ```
     */
    request(endpoint: string, modify: ModifyRequest | undefined, parseAsText: true): Promise<string>;
    request(endpoint: string, modify?: ModifyRequest, parseAsText?: false): Promise<any>;
    /**
     * Search something raw on the node, please note only add tracks to players of that node
     * @param query SearchQuery Object
     * @param requestUser Request User for creating the player(s)
     * @param throwOnEmpty Wether to throw on an empty result or not
     * @returns Searchresult
     *
     * @example
     * ```ts
     * // use player.search() instead
     * player.node.search({ query: "Never gonna give you up by Rick Astley", source: "soundcloud" }, interaction.user);
     * player.node.search({ query: "https://deezer.com/track/123456789" }, interaction.user);
     * ```
     */
    search(query: SearchQuery, requestUser: unknown, throwOnEmpty?: boolean): Promise<SearchResult>;
    /**
     * Search something using the lavaSearchPlugin (filtered searches by types)
     * @param query LavaSearchQuery Object
     * @param requestUser Request User for creating the player(s)
     * @param throwOnEmpty Wether to throw on an empty result or not
     * @returns LavaSearchresult (SearchResult if link is provided)
     *
     * @example
     * ```ts
     * // use player.search() instead
     * player.node.lavaSearch({ types: ["playlist", "album"], query: "Rick Astley", source: "spotify" }, interaction.user);
     * ```
     */
    lavaSearch(query: LavaSearchQuery, requestUser: unknown, throwOnEmpty?: boolean): Promise<LavaSearchResponse | SearchResult>;
    /**
     * Update the Player State on the Lavalink Server
     * @param data data to send to lavalink and sync locally
     * @returns result from lavalink
     *
     * @example
     * ```ts
     * // use player.search() instead
     * player.node.updatePlayer({ guildId: player.guildId, playerOptions: { paused: true } }); // example to pause it
     * ```
     */
    updatePlayer(data: PlayerUpdateInfo): Promise<LavalinkPlayer>;
    /**
     * Destroys the Player on the Lavalink Server
     * @param guildId
     * @returns request result
     *
     * @example
     * ```ts
     * // use player.destroy() instead
     * player.node.destroyPlayer(player.guildId);
     * ```
     */
    destroyPlayer(guildId: any): Promise<void>;
    /**
     * Connect to the Lavalink Node
     * @param sessionId Provide the Session Id of the previous connection, to resume the node and it's player(s)
     * @returns void
     *
     * @example
     * ```ts
     * player.node.connect(); // if provided on bootup in managerOptions#nodes, this will be called automatically when doing lavalink.init()
     *
     * // or connect from a resuming session:
     * player.node.connect("sessionId");
     * ```
     */
    connect(sessionId?: string): void;
    private heartBeat;
    /**
     * Get the id of the node
     *
     * @example
     * ```ts
     * const nodeId = player.node.id;
     * console.log("node id is: ", nodeId)
     * ```
     */
    get id(): string;
    /**
     * Destroys the Node-Connection (Websocket) and all player's of the node
     * @param destroyReason Destroy Reason to use when destroying the players
     * @param deleteNode wether to delete the nodte from the nodes list too, if false it will emit a disconnect. @default true
     * @param movePlayers whether to movePlayers to different eligible connected node. If false players won't be moved @default false
     * @returns void
     *
     * @example
     * Destroys node and its players
     * ```ts
     * player.node.destroy("custom Player Destroy Reason", true);
     * ```
     * destroys only the node and moves its players to different connected node.
     * ```ts
     * player.node.destroy("custom Player Destroy Reason", true, true);
     * ```
     */
    destroy(destroyReason?: DestroyReasonsType, deleteNode?: boolean, movePlayers?: boolean): void;
    /**
     * Disconnects the Node-Connection (Websocket)
     * @param disconnectReason Disconnect Reason to use when disconnecting Node
     * @returns void
     *
     * Also the node will not get re-connected again.
     *
     * @example
     * ```ts
     * player.node.destroy("custom Player Destroy Reason", true);
     * ```
     */
    disconnect(disconnectReason?: DisconnectReasonsType): void;
    /**
     * Returns if connected to the Node.
     *
     * @example
     * ```ts
     * const isConnected = player.node.connected;
     * console.log("node is connected: ", isConnected ? "yes" : "no")
     * ```
     */
    get connected(): boolean;
    /**
     * Returns the current ConnectionStatus
     *
     * @example
     * ```ts
     * try {
     *     const statusOfConnection = player.node.connectionStatus;
     *     console.log("node's connection status is:", statusOfConnection)
     * } catch (error) {
     *     console.error("no socket available?", error)
     * }
     * ```
     */
    get connectionStatus(): string;
    /**
     * Gets all Players of a Node
     * @returns array of players inside of lavalink
     *
     * @example
     * ```ts
     * const node = lavalink.nodes.get("NODEID");
     * const playersOfLavalink = await node?.fetchAllPlayers();
     * ```
     */
    fetchAllPlayers(): Promise<LavalinkPlayer[] | InvalidLavalinkRestRequest | null>;
    /**
     * Gets specific Player Information
     * @returns lavalink player object if player exists on lavalink
     *
     * @example
     * ```ts
     * const node = lavalink.nodes.get("NODEID");
     * const playerInformation = await node?.fetchPlayer("guildId");
     * ```
     */
    fetchPlayer(guildId: string): Promise<LavalinkPlayer | InvalidLavalinkRestRequest | null>;
    /**
     * Updates the session with and enables/disables resuming and timeout
     * @param resuming Whether resuming is enabled for this session or not
     * @param timeout The timeout in seconds (default is 60s)
     * @returns the result of the request
     *
     * @example
     * ```ts
     * const node = player.node || lavalink.nodes.get("NODEID");
     * await node?.updateSession(true, 180e3); // will enable resuming for 180seconds
     * ```
     */
    updateSession(resuming?: boolean, timeout?: number): Promise<Session | InvalidLavalinkRestRequest | null>;
    /**
     * Decode Track or Tracks
     */
    decode: {
        /**
         * Decode a single track into its info
         * @param encoded valid encoded base64 string from a track
         * @param requester the requesteruser for building the track
         * @returns decoded track from lavalink
         *
         * @example
         * ```ts
         * const encodedBase64 = 'QAACDgMACk5vIERpZ2dpdHkAC0JsYWNrc3RyZWV0AAAAAAAEo4AABjkxNjQ5NgABAB9odHRwczovL2RlZXplci5jb20vdHJhY2svOTE2NDk2AQBpaHR0cHM6Ly9lLWNkbnMtaW1hZ2VzLmR6Y2RuLm5ldC9pbWFnZXMvY292ZXIvZGFlN2EyNjViNzlmYjcxMjc4Y2RlMjUwNDg0OWQ2ZjcvMTAwMHgxMDAwLTAwMDAwMC04MC0wLTAuanBnAQAMVVNJUjE5NjAwOTc4AAZkZWV6ZXIBAChObyBEaWdnaXR5OiBUaGUgVmVyeSBCZXN0IE9mIEJsYWNrc3RyZWV0AQAjaHR0cHM6Ly93d3cuZGVlemVyLmNvbS9hbGJ1bS8xMDMyNTQBACJodHRwczovL3d3dy5kZWV6ZXIuY29tL2FydGlzdC8xODYxAQBqaHR0cHM6Ly9lLWNkbnMtaW1hZ2VzLmR6Y2RuLm5ldC9pbWFnZXMvYXJ0aXN0L2YxNmNhYzM2ZmVjMzkxZjczN2I3ZDQ4MmY1YWM3M2UzLzEwMDB4MTAwMC0wMDAwMDAtODAtMC0wLmpwZwEAT2h0dHBzOi8vY2RuLXByZXZpZXctYS5kemNkbi5uZXQvc3RyZWFtL2MtYTE1Yjg1NzFhYTYyMDBjMDQ0YmY1OWM3NmVkOTEyN2MtNi5tcDMAAAAAAAAAAAA=';
         * const track = await player.node.decode.singleTrack(encodedBase64, interaction.user);
         * ```
         */
        singleTrack: (encoded: Base64, requester: unknown) => Promise<Track>;
        /**
         * Decodes multiple tracks into their info
         * @param encodeds valid encoded base64 string array from all tracks
         * @param requester the requesteruser for building the tracks
         * @returns array of all tracks you decoded
         *
         * @example
         * ```ts
         * const encodedBase64_1 = 'QAACDgMACk5vIERpZ2dpdHkAC0JsYWNrc3RyZWV0AAAAAAAEo4AABjkxNjQ5NgABAB9odHRwczovL2RlZXplci5jb20vdHJhY2svOTE2NDk2AQBpaHR0cHM6Ly9lLWNkbnMtaW1hZ2VzLmR6Y2RuLm5ldC9pbWFnZXMvY292ZXIvZGFlN2EyNjViNzlmYjcxMjc4Y2RlMjUwNDg0OWQ2ZjcvMTAwMHgxMDAwLTAwMDAwMC04MC0wLTAuanBnAQAMVVNJUjE5NjAwOTc4AAZkZWV6ZXIBAChObyBEaWdnaXR5OiBUaGUgVmVyeSBCZXN0IE9mIEJsYWNrc3RyZWV0AQAjaHR0cHM6Ly93d3cuZGVlemVyLmNvbS9hbGJ1bS8xMDMyNTQBACJodHRwczovL3d3dy5kZWV6ZXIuY29tL2FydGlzdC8xODYxAQBqaHR0cHM6Ly9lLWNkbnMtaW1hZ2VzLmR6Y2RuLm5ldC9pbWFnZXMvYXJ0aXN0L2YxNmNhYzM2ZmVjMzkxZjczN2I3ZDQ4MmY1YWM3M2UzLzEwMDB4MTAwMC0wMDAwMDAtODAtMC0wLmpwZwEAT2h0dHBzOi8vY2RuLXByZXZpZXctYS5kemNkbi5uZXQvc3RyZWFtL2MtYTE1Yjg1NzFhYTYyMDBjMDQ0YmY1OWM3NmVkOTEyN2MtNi5tcDMAAAAAAAAAAAA=';
         * const encodedBase64_2 = 'QAABJAMAClRhbGsgYSBMb3QACjQwNHZpbmNlbnQAAAAAAAHr1gBxTzpodHRwczovL2FwaS12Mi5zb3VuZGNsb3VkLmNvbS9tZWRpYS9zb3VuZGNsb3VkOnRyYWNrczo4NTE0MjEwNzYvMzUyYTRiOTAtNzYxOS00M2E5LWJiOGItMjIxMzE0YzFjNjNhL3N0cmVhbS9obHMAAQAsaHR0cHM6Ly9zb3VuZGNsb3VkLmNvbS80MDR2aW5jZW50L3RhbGstYS1sb3QBADpodHRwczovL2kxLnNuZGNkbi5jb20vYXJ0d29ya3MtRTN1ek5Gc0Y4QzBXLTAtb3JpZ2luYWwuanBnAQAMUVpITkExOTg1Nzg0AApzb3VuZGNsb3VkAAAAAAAAAAA=';
         * const tracks = await player.node.decode.multipleTracks([encodedBase64_1, encodedBase64_2], interaction.user);
         * ```
         */
        multipleTracks: (encodeds: Base64[], requester: unknown) => Promise<Track[]>;
    };
    lyrics: {
        /**
         * Get the lyrics of a track
         * @param track the track to get the lyrics for
         * @param skipTrackSource wether to skip the track source or not
         * @returns the lyrics of the track
         * @example
         *
         * ```ts
         * const lyrics = await player.node.lyrics.get(track, true);
         * // use it of player instead:
         * // const lyrics = await player.getLyrics(track, true);
         * ```
         */
        get: (track: Track, skipTrackSource?: boolean) => Promise<LyricsResult | null>;
        /**
         * Get the lyrics of the current playing track
         *
         * @param guildId the guild id of the player
         * @param skipTrackSource wether to skip the track source or not
         * @returns the lyrics of the current playing track
         * @example
         * ```ts
         * const lyrics = await player.node.lyrics.getCurrent(guildId);
         * // use it of player instead:
         * // const lyrics = await player.getCurrentLyrics();
         * ```
         */
        getCurrent: (guildId: string, skipTrackSource?: boolean) => Promise<LyricsResult | null>;
        /**
         * subscribe to lyrics updates for a guild
         * @param guildId the guild id of the player
         * @returns request data of the request
         *
         * @example
         * ```ts
         * await player.node.lyrics.subscribe(guildId);
         * // use it of player instead:
         * // const lyrics = await player.subscribeLyrics();
         * ```
         */
        subscribe: (guildId: string) => Promise<unknown>;
        /**
         * unsubscribe from lyrics updates for a guild
         * @param guildId the guild id of the player
         * @returns request data of the request
         *
         * @example
         * ```ts
         * await player.node.lyrics.unsubscribe(guildId);
         * // use it of player instead:
         * // const lyrics = await player.unsubscribeLyrics();
         * ```
         */
        unsubscribe: (guildId: string) => Promise<void>;
    };
    /**
     * Request Lavalink statistics.
     * @returns the lavalink node stats
     *
     * @example
     * ```ts
     * const lavalinkStats = await player.node.fetchStats();
     * ```
     */
    fetchStats(): Promise<BaseNodeStats>;
    /**
     * Request Lavalink version.
     * @returns the current used lavalink version
     *
     * @example
     * ```ts
     * const lavalinkVersion = await player.node.fetchVersion();
     * ```
     */
    fetchVersion(): Promise<string>;
    /**
     * Request Lavalink information.
     * @returns lavalink info object
     *
     * @example
     * ```ts
     * const lavalinkInfo = await player.node.fetchInfo();
     * const availablePlugins:string[] = lavalinkInfo.plugins.map(plugin => plugin.name);
     * const availableSources:string[] = lavalinkInfo.sourceManagers;
     * ```
     */
    fetchInfo(): Promise<LavalinkInfo>;
    /**
     * Lavalink's Route Planner Api
     */
    routePlannerApi: {
        /**
         * Get routplanner Info from Lavalink for ip rotation
         * @returns the status of the routeplanner
         *
         * @example
         * ```ts
         * const routePlannerStatus = await player.node.routePlannerApi.getStatus();
         * const usedBlock = routePlannerStatus.details?.ipBlock;
         * const currentIp = routePlannerStatus.currentAddress;
         * ```
         */
        getStatus: () => Promise<RoutePlanner>;
        /**
         * Release blacklisted IP address into pool of IPs for ip rotation
         * @param address IP address
         * @returns request data of the request
         *
         * @example
         * ```ts
         * await player.node.routePlannerApi.unmarkFailedAddress("ipv6address");
         * ```
         */
        unmarkFailedAddress: (address: string) => Promise<unknown>;
        /**
         * Release all blacklisted IP addresses into pool of IPs
         * @returns request data of the request
         *
         * @example
         * ```ts
         * await player.node.routePlannerApi.unmarkAllFailedAddresses();
         * ```
         */
        unmarkAllFailedAddresses: () => Promise<unknown>;
    };
    /** @private Utils for validating the */
    private validate;
    /**
     * Sync the data of the player you make an action to lavalink to
     * @param data data to use to update the player
     * @param res result data from lavalink, to override, if available
     * @returns boolean
     */
    private syncPlayerData;
    /**
     * Get the rest Adress for making requests
     */
    private get restAddress();
    /**
     * Reconnect to the lavalink node
     * @param instaReconnect @default false wether to instantly try to reconnect
     * @returns void
     *
     * @example
     * ```ts
     * await player.node.reconnect();
     * ```
     */
    private reconnect;
    /** @private util function for handling opening events from websocket */
    private open;
    /** @private util function for handling closing events from websocket */
    private close;
    /** @private util function for handling error events from websocket */
    private error;
    /** @private util function for handling message events from websocket */
    private message;
    /** @private middleware util function for handling all kind of events from websocket */
    private handleEvent;
    private getTrackOfPayload;
    /** @private util function for handling trackStart event */
    private trackStart;
    /** @private util function for handling trackEnd event */
    private trackEnd;
    /** @private util function for handling trackStuck event */
    private trackStuck;
    /** @private util function for handling trackError event */
    private trackError;
    /** @private util function for handling socketClosed event */
    private socketClosed;
    /** @private util function for handling SponsorBlock Segmentloaded event */
    private SponsorBlockSegmentLoaded;
    /** @private util function for handling SponsorBlock SegmentSkipped event */
    private SponsorBlockSegmentSkipped;
    /** @private util function for handling SponsorBlock Chaptersloaded event */
    private SponsorBlockChaptersLoaded;
    /** @private util function for handling SponsorBlock Chaptersstarted event */
    private SponsorBlockChapterStarted;
    /**
     * Get the current sponsorblocks for the sponsorblock plugin
     * @param player passthrough the player
     * @returns sponsorblock seggment from lavalink
     *
     * @example
     * ```ts
     * // use it on the player via player.getSponsorBlock();
     * const sponsorBlockSegments = await player.node.getSponsorBlock(player);
     * ```
     */
    getSponsorBlock(player: Player): Promise<SponsorBlockSegment[]>;
    /**
     * Set the current sponsorblocks for the sponsorblock plugin
     * @param player passthrough the player
     * @returns void
     *
     * @example
     * ```ts
     * // use it on the player via player.setSponsorBlock();
     * const sponsorBlockSegments = await player.node.setSponsorBlock(player, ["sponsor", "selfpromo"]);
     * ```
     */
    setSponsorBlock(player: Player, segments?: SponsorBlockSegment[]): Promise<void>;
    /**
     * Delete the sponsorblock plugins
     * @param player passthrough the player
     * @returns void
     *
     * @example
     * ```ts
     * // use it on the player via player.deleteSponsorBlock();
     * const sponsorBlockSegments = await player.node.deleteSponsorBlock(player);
     * ```
     */
    deleteSponsorBlock(player: Player): Promise<void>;
    /** private util function for handling the queue end event */
    private queueEnd;
    /**
     * Emitted whenever a line of lyrics gets emitted
     * @event
     * @param {Player} player The player that emitted the event
     * @param {Track} track The track that emitted the event
     * @param {LyricsLineEvent} payload The payload of the event
     */
    private LyricsLine;
    /**
     * Emitted whenever the lyrics for a track got found
     * @event
     * @param {Player} player The player that emitted the event
     * @param {Track} track The track that emitted the event
     * @param {LyricsFoundEvent} payload The payload of the event
     */
    private LyricsFound;
    /**
     * Emitted whenever the lyrics for a track got not found
     * @event
     * @param {Player} player The player that emitted the event
     * @param {Track} track The track that emitted the event
     * @param {LyricsNotFoundEvent} payload The payload of the event
     */
    private LyricsNotFound;
}

declare class NodeManager extends EventEmitter {
    /**
     * Emit an event
     * @param event The event to emit
     * @param args The arguments to pass to the event
     * @returns
     */
    emit<Event extends keyof NodeManagerEvents>(event: Event, ...args: Parameters<NodeManagerEvents[Event]>): boolean;
    /**
     * Add an event listener
     * @param event The event to listen to
     * @param listener The listener to add
     * @returns
     */
    on<Event extends keyof NodeManagerEvents>(event: Event, listener: NodeManagerEvents[Event]): this;
    /**
     * Add an event listener that only fires once
     * @param event The event to listen to
     * @param listener The listener to add
     * @returns
     */
    once<Event extends keyof NodeManagerEvents>(event: Event, listener: NodeManagerEvents[Event]): this;
    /**
     * Remove an event listener
     * @param event The event to remove the listener from
     * @param listener The listener to remove
     * @returns
     */
    off<Event extends keyof NodeManagerEvents>(event: Event, listener: NodeManagerEvents[Event]): this;
    /**
     * Remove an event listener
     * @param event The event to remove the listener from
     * @param listener The listener to remove
     * @returns
     */
    removeListener<Event extends keyof NodeManagerEvents>(event: Event, listener: NodeManagerEvents[Event]): this;
    /**
     * The LavalinkManager that created this NodeManager
     */
    LavalinkManager: LavalinkManager;
    /**
     * A map of all nodes in the nodeManager
     */
    nodes: MiniMap<string, LavalinkNode>;
    /**
     * @param LavalinkManager The LavalinkManager that created this NodeManager
     */
    constructor(LavalinkManager: LavalinkManager);
    /**
     * Disconnects all Nodes from lavalink ws sockets
     * @param deleteAllNodes if the nodes should also be deleted from nodeManager.nodes
     * @param destroyPlayers if the players should be destroyed
     * @returns amount of disconnected Nodes
     */
    disconnectAll(deleteAllNodes?: boolean, destroyPlayers?: boolean): Promise<number>;
    /**
     * Connects all not connected nodes
     * @returns Amount of connected Nodes
     */
    connectAll(): Promise<number>;
    /**
     * Forcefully reconnects all nodes
     * @returns amount of nodes
     */
    reconnectAll(): Promise<number>;
    /**
     * Create a node and add it to the nodeManager
     * @param options The options for the node
     * @returns The node that was created
     */
    createNode(options: LavalinkNodeOptions): LavalinkNode;
    /**
     * Get the nodes sorted for the least usage, by a sorttype
     * @param sortType The type of sorting to use
     * @returns
     */
    leastUsedNodes(sortType?: "memory" | "cpuLavalink" | "cpuSystem" | "calls" | "playingPlayers" | "players"): LavalinkNode[];
    /**
     * Delete a node from the nodeManager and destroy it
     * @param node The node to delete
     * @param movePlayers whether to movePlayers to different connected node before deletion. @default false
     * @returns
     *
     * @example
     * Deletes the node
     * ```ts
     * client.lavalink.nodeManager.deleteNode("nodeId to delete");
     * ```
     * Moves players to a different node before deleting
     * ```ts
     * client.lavalink.nodeManager.deleteNode("nodeId to delete", true);
     * ```
     */
    deleteNode(node: LavalinkNodeIdentifier | LavalinkNode, movePlayers?: boolean): void;
}

/**
 * The events from the lavalink Manager
 */
interface LavalinkManagerEvents<CustomPlayerT extends Player = Player> {
    /**
     * Emitted when a Track started playing.
     * @event Manager#trackStart
     */
    "trackStart": (player: CustomPlayerT, track: Track | null, payload: TrackStartEvent) => void;
    /**
     * Emitted when a Track finished.
     * @event Manager#trackEnd
     */
    "trackEnd": (player: CustomPlayerT, track: Track | null, payload: TrackEndEvent) => void;
    /**
     * Emitted when a Track got stuck while playing.
     * @event Manager#trackStuck
     */
    "trackStuck": (player: CustomPlayerT, track: Track | null, payload: TrackStuckEvent) => void;
    /**
     * Emitted when a Track errored.
     * @event Manager#trackError
     */
    "trackError": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: TrackExceptionEvent) => void;
    /**
     * Emitted when the Playing finished and no more tracks in the queue.
     * @event Manager#queueEnd
     */
    "queueEnd": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: TrackEndEvent | TrackStuckEvent | TrackExceptionEvent) => void;
    /**
     * Emitted when a Player is created.
     * @event Manager#playerCreate
     */
    "playerCreate": (player: CustomPlayerT) => void;
    /**
     * Emitted when a Player is moved within the channel.
     * @event Manager#playerMove
     */
    "playerMove": (player: CustomPlayerT, oldVoiceChannelId: string, newVoiceChannelId: string) => void;
    /**
     * Emitted when a Player is disconnected from a channel.
     * @event Manager#playerDisconnect
     */
    "playerDisconnect": (player: CustomPlayerT, voiceChannelId: string) => void;
    /**
     * Emitted when a Node-Socket got closed for a specific Player.
     * Usually emits when the audio websocket to discord is closed, This can happen for various reasons (normal and abnormal), e.g. when using an expired voice server update. 4xxx codes are usually bad.
     *
     * So this is just information, normally lavalink should handle disconnections
     *
     * Discord Docs:
     * @link https://discord.com/developers/docs/topics/opcodes-and-status-codes#voice-voice-close-event-codes
     *
     * Lavalink Docs:
     * @link https://lavalink.dev/api/websocket.html#websocketclosedevent
     * @event Manager#playerSocketClosed
     */
    "playerSocketClosed": (player: CustomPlayerT, payload: WebSocketClosedEvent) => void;
    /**
     * Emitted when a Player get's destroyed
     * @event Manager#playerDestroy
     */
    "playerDestroy": (player: CustomPlayerT, destroyReason?: DestroyReasonsType) => void;
    /**
     * Always emits when the player (on lavalink side) got updated
     * @event Manager#playerUpdate
     */
    "playerUpdate": (oldPlayerJson: PlayerJson, newPlayer: CustomPlayerT) => void;
    /**
     * Emitted when the player's selfMuted or serverMuted state changed (true -> false | false -> true)
     * @event Manager#playerMuteChange
     */
    "playerMuteChange": (player: CustomPlayerT, selfMuted: boolean, serverMuted: boolean) => void;
    /**
     * Emitted when the player's selfDeafed or serverDeafed state changed (true -> false | false -> true)
     * @event Manager#playerDeafChange
     */
    "playerDeafChange": (player: CustomPlayerT, selfDeafed: boolean, serverDeafed: boolean) => void;
    /**
     * Emitted when the player's suppressed (true -> false | false -> true)
     * @event Manager#playerSuppressChange
     */
    "playerSuppressChange": (player: CustomPlayerT, suppress: boolean) => void;
    /**
     * Emitted when the player's queue got empty, and the timeout started
     * @event Manager#playerQueueEmptyStart
     */
    "playerQueueEmptyStart": (player: CustomPlayerT, timeoutMs: number) => void;
    /**
     * Emitted when the player's queue got empty, and the timeout finished leading to destroying the player
     * @event Manager#playerQueueEmptyEnd
     */
    "playerQueueEmptyEnd": (player: CustomPlayerT) => void;
    /**
     * Emitted when the player's queue got empty, and the timeout got cancelled becuase a track got re-added to it.
     * @event Manager#playerQueueEmptyEnd
     */
    "playerQueueEmptyCancel": (player: CustomPlayerT) => void;
    /**
     * Emitted, when a user joins the voice channel, while there is a player existing
     * @event Manager#playerQueueEmptyStart
     */
    "playerVoiceJoin": (player: CustomPlayerT, userId: string) => void;
    /**
     * Emitted, when a user leaves the voice channel, while there is a player existing
     * @event Manager#playerQueueEmptyEnd
     */
    "playerVoiceLeave": (player: CustomPlayerT, userId: string) => void;
    /**
     * SPONSORBLOCK-PLUGIN EVENT
     * Emitted when Segments are loaded
     * @link https://github.com/topi314/Sponsorblock-Plugin#segmentsloaded
     * @event Manager#trackError
     */
    "SegmentsLoaded": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: SponsorBlockSegmentsLoaded) => void;
    /**
     * SPONSORBLOCK-PLUGIN EVENT
     * Emitted when a specific Segment was skipped
     * @link https://github.com/topi314/Sponsorblock-Plugin#segmentskipped
     * @event Manager#trackError
     */
    "SegmentSkipped": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: SponsorBlockSegmentSkipped) => void;
    /**
     * SPONSORBLOCK-PLUGIN EVENT
     * Emitted when a specific Chapter starts playing
     * @link https://github.com/topi314/Sponsorblock-Plugin#chapterstarted
     * @event Manager#trackError
     */
    "ChapterStarted": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: SponsorBlockChapterStarted) => void;
    /**
     * SPONSORBLOCK-PLUGIN EVENT
     * Emitted when Chapters are loaded
     * @link https://github.com/topi314/Sponsorblock-Plugin#chaptersloaded
     * @event Manager#trackError
     */
    "ChaptersLoaded": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: SponsorBlockChaptersLoaded) => void;
    /**
     * Nazha-Client Debug Event
     * Emitted for several erros, and logs within Nazha-Client, if managerOptions.advancedOptions.enableDebugEvents is true
     * Useful for debugging the Nazha-Client
     *
     * @event Manager#debug
     */
    "debug": (eventKey: DebugEvents, eventData: {
        message: string;
        state: "log" | "warn" | "error";
        error?: Error | string;
        functionLayer: string;
    }) => void;
    /**
     * Emitted when a Lyrics line is received
     * @link https://github.com/topi314/LavaLyrics
     * @event Manager#LyricsLine
     */
    "LyricsLine": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: LyricsLineEvent) => void;
    /**
     * Emitted when a Lyrics is found
     * @link https://github.com/topi314/LavaLyrics
     * @event Manager#LyricsFound
     */
    "LyricsFound": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: LyricsFoundEvent) => void;
    /**
     * Emitted when a Lyrics is not found
     * @link https://github.com/topi314/LavaLyrics
     * @event Manager#LyricsNotFound
     */
    "LyricsNotFound": (player: CustomPlayerT, track: Track | UnresolvedTrack | null, payload: LyricsNotFoundEvent) => void;
    "playerResumed": (player: CustomPlayerT, track: Track | UnresolvedTrack | null) => void;
    "playerPaused": (player: CustomPlayerT, track: Track | UnresolvedTrack | null) => void;
}
/**
 * The Bot client Options needed for the manager
 */
interface BotClientOptions {
    /** Bot Client Id */
    id: string;
    /** Bot Client Username */
    username?: string;
    /** So users can pass entire objects / classes */
    [x: string | number | symbol]: unknown;
}
/** Sub Manager Options, for player specific things */
interface ManagerPlayerOptions<CustomPlayerT extends Player = Player> {
    /** If the Lavalink Volume should be decremented by x number */
    volumeDecrementer?: number;
    /** How often it should update the the player Position */
    clientBasedPositionUpdateInterval?: number;
    /** What should be used as a searchPlatform, if no source was provided during the query */
    defaultSearchPlatform?: SearchPlatform;
    /** Applies the volume via a filter, not via the lavalink volume transformer */
    applyVolumeAsFilter?: boolean;
    /** Transforms the saved data of a requested user */
    requesterTransformer?: (requester: unknown) => unknown;
    /** What Nazha-Client should do when the player reconnects */
    onDisconnect?: {
        /** Try to reconnect? -> If fails -> Destroy */
        autoReconnect?: boolean;
        /** Only try to reconnect if there are tracks in the queue */
        autoReconnectOnlyWithTracks?: boolean;
        /** Instantly destroy player (overrides autoReconnect) | Don't provide == disable feature*/
        destroyPlayer?: boolean;
    };
    /** Minimum time to play the song before autoPlayFunction is executed (prevents error spamming) Set to 0 to disable it @default 10000 */
    minAutoPlayMs?: number;
    /** Allows you to declare how many tracks are allowed to error/stuck within a time-frame before player is destroyed @default "{threshold: 35000, maxAmount: 3 }" */
    maxErrorsPerTime?: {
        /** The threshold time to count errors (recommended is 35s) */
        threshold: number;
        /** The max amount of errors within the threshold time which are allowed before destroying the player (when errors > maxAmount -> player.destroy()) */
        maxAmount: number;
    };
    onEmptyQueue?: {
        /** Get's executed onEmptyQueue -> You can do any track queue previous transformations, if you add a track to the queue -> it will play it, if not queueEnd will execute! */
        autoPlayFunction?: (player: CustomPlayerT, lastPlayedTrack: Track) => Promise<void>;
        destroyAfterMs?: number;
    };
    useUnresolvedData?: boolean;
}
type DeepRequired<T> = {
    [K in keyof T]-?: NonNullable<T[K]> extends object ? DeepRequired<NonNullable<T[K]>> : NonNullable<T[K]>;
};
type RequiredManagerOptions<T extends Player> = DeepRequired<ManagerOptions<T>>;
type PlayerConstructor<T extends Player = Player> = new (options: PlayerOptions, LavalinkManager: LavalinkManager, dontEmitPlayerCreateEvent?: boolean) => T;
/** Manager Options used to create the manager */
interface ManagerOptions<CustomPlayerT extends Player = Player> {
    /** The Node Options, for all Nodes! (on init) */
    nodes: LavalinkNodeOptions[];
    /** @async The Function to send the voice connection changes from Lavalink to Discord */
    sendToShard: (guildId: string, payload: GuildShardPayload) => void;
    /** The Bot Client's Data for Authorization */
    client?: BotClientOptions;
    /** QueueOptions for all Queues */
    queueOptions?: ManagerQueueOptions<CustomPlayerT>;
    /** PlayerOptions for all Players */
    playerOptions?: ManagerPlayerOptions<CustomPlayerT>;
    /** The player class you want to use when creating a player. (can be extendable) */
    playerClass?: PlayerConstructor<CustomPlayerT>;
    /** If it should skip to the next Track on TrackEnd / TrackError etc. events */
    autoSkip?: boolean;
    /** If it should automatically move the player to the next node when node is down */
    autoMove?: boolean;
    /** If it should skip to the next Track if track.resolve errors while trying to play a track. */
    autoSkipOnResolveError?: boolean;
    /** If it should emit only new (unique) songs and not when a looping track (or similar) is plaid, default false */
    emitNewSongsOnly?: boolean;
    /** Only allow link requests with links either matching some of that regExp or including some of that string */
    linksWhitelist?: (RegExp | string)[];
    /** Never allow link requests with links either matching some of that regExp or including some of that string (doesn't even allow if it's whitelisted) */
    linksBlacklist?: (RegExp | string)[];
    /** If links should be allowed or not. If set to false, it will throw an error if a link was provided. */
    linksAllowed?: boolean;
    /** Advanced Options for the Library, which may or may not be "library breaking" */
    advancedOptions?: {
        /** Max duration for that the filter fix duration works (in ms) - default is 8mins */
        maxFilterFixDuration?: number;
        /** Enable Debug event */
        enableDebugEvents?: boolean;
        /** optional */
        debugOptions?: {
            /** For logging custom searches */
            logCustomSearches?: boolean;
            /** logs for debugging the "no-Audio" playing error */
            noAudio?: boolean;
            /** For Logging the Destroy function */
            playerDestroy?: {
                /** To show the debug reason at all times. */
                debugLog?: boolean;
                /** If you get 'Error: Use Player#destroy("reason") not LavalinkManager#deletePlayer() to stop the Player' put it on true */
                dontThrowError?: boolean;
            };
        };
    };
}

declare class LavalinkManager<CustomPlayerT extends Player = Player> extends EventEmitter {
    /**
     * Emit an event
     * @param event The event to emit
     * @param args The arguments to pass to the event
     * @returns
     */
    emit<Event extends keyof LavalinkManagerEvents<CustomPlayerT>>(event: Event, ...args: Parameters<LavalinkManagerEvents<CustomPlayerT>[Event]>): boolean;
    /**
     * Add an event listener
     * @param event The event to listen to
     * @param listener The listener to add
     * @returns
     */
    on<Event extends keyof LavalinkManagerEvents<CustomPlayerT>>(event: Event, listener: LavalinkManagerEvents<CustomPlayerT>[Event]): this;
    /**
     * Add an event listener that only fires once
     * @param event The event to listen to
     * @param listener The listener to add
     * @returns
     */
    once<Event extends keyof LavalinkManagerEvents<CustomPlayerT>>(event: Event, listener: LavalinkManagerEvents<CustomPlayerT>[Event]): this;
    /**
     * Remove an event listener
     * @param event The event to remove the listener from
     * @param listener The listener to remove
     * @returns
     */
    off<Event extends keyof LavalinkManagerEvents<CustomPlayerT>>(event: Event, listener: LavalinkManagerEvents<CustomPlayerT>[Event]): this;
    /**
     * Remove an event listener
     * @param event The event to remove the listener from
     * @param listener The listener to remove
     * @returns
     */
    removeListener<Event extends keyof LavalinkManagerEvents<CustomPlayerT>>(event: Event, listener: LavalinkManagerEvents<CustomPlayerT>[Event]): this;
    /** The Options of LavalinkManager (changeable) */
    options: ManagerOptions<CustomPlayerT>;
    /** LavalinkManager's NodeManager to manage all Nodes */
    nodeManager: NodeManager;
    /** LavalinkManager's Utils Class */
    utils: ManagerUtils;
    /** Wether the manager was initiated or not */
    initiated: boolean;
    /** All Players stored in a MiniMap */
    readonly players: MiniMap<string, CustomPlayerT>;
    /**
     * Applies the options provided by the User
     * @param options
     * @returns
     */
    private applyOptions;
    /**
     * Validates the current manager's options
     * @param options
     */
    private validateOptions;
    /**
     * Create the Lavalink Manager
     * @param options
     *
     * @example
     * ```ts
     * //const client = new Client({...}); // create your BOT Client (e.g. via discord.js)
     * client.lavalink = new LavalinkManager({
     *   nodes: [
     *     {
     *       authorization: "yourverystrongpassword",
     *       host: "localhost",
     *       port: 2333,
     *       id: "testnode"
     *     },
     *     sendToShard(guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
     *     client: {
     *       id: process.env.CLIENT_ID,
     *       username: "TESTBOT"
     *     },
     *     // optional Options:
     *     autoSkip: true,
     *     playerOptions: {
     *       applyVolumeAsFilter: false,
     *       clientBasedPositionUpdateInterval: 150,
     *       defaultSearchPlatform: "ytmsearch",
     *       volumeDecrementer: 0.75,
     *       //requesterTransformer: YourRequesterTransformerFunction,
     *       onDisconnect: {
     *         autoReconnect: true,
     *         destroyPlayer: false
     *       },
     *       onEmptyQueue: {
     *         destroyAfterMs: 30_000,
     *         //autoPlayFunction: YourAutoplayFunction,
     *       },
     *       useUnresolvedData: true
     *     },
     *     queueOptions: {
     *       maxPreviousTracks: 25,
     *       //queueStore: yourCustomQueueStoreManagerClass,
     *       //queueChangesWatcher: yourCustomQueueChangesWatcherClass
     *     },
     *     linksBlacklist: [],
     *     linksWhitelist: [],
     *     advancedOptions: {
     *       maxFilterFixDuration: 600_000,
     *       debugOptions: {
     *         noAudio: false,
     *         playerDestroy: {
     *           dontThrowError: false,
     *           debugLogs: false
     *         }
     *       }
     *     }
     *   ]
     * })
     * ```
     */
    constructor(options: ManagerOptions<CustomPlayerT>);
    /**
     * Get a Player from Lava
     * @param guildId The guildId of the player
     *
     * @example
     * ```ts
     * const player = client.lavalink.getPlayer(interaction.guildId);
     * ```
     * A quicker and easier way than doing:
     * ```ts
     * const player = client.lavalink.players.get(interaction.guildId);
     * ```
     * @returns
     */
    getPlayer(guildId: string): CustomPlayerT | undefined;
    /**
     * Create a Music-Player. If a player exists, then it returns it before creating a new one
     * @param options
     * @returns
     *
     * @example
     * ```ts
     * const player = client.lavalink.createPlayer({
     *   guildId: interaction.guildId,
     *   voiceChannelId: interaction.member.voice.channelId,
     *   // everything below is optional
     *   textChannelId: interaction.channelId,
     *   volume: 100,
     *   selfDeaf: true,
     *   selfMute: false,
     *   instaUpdateFiltersFix: true,
     *   applyVolumeAsFilter: false
     *   //only needed if you want to autopick node by region (configured by you)
     *   // vcRegion: interaction.member.voice.rtcRegion,
     *   // provide a specific node
     *   // node: client.lavalink.nodeManager.leastUsedNodes("memory")[0]
     * });
     * ```
     */
    createPlayer(options: PlayerOptions): CustomPlayerT;
    /**
     * Destroy a player with optional destroy reason and disconnect it from the voice channel
     * @param guildId
     * @param destroyReason
     * @returns
     *
     * @example
     * ```ts
     * client.lavalink.destroyPlayer(interaction.guildId, "forcefully destroyed the player");
     * // recommend to do it on the player tho: player.destroy("forcefully destroyed the player");
     * ```
     */
    destroyPlayer(guildId: string, destroyReason?: string): Promise<void | CustomPlayerT>;
    /**
     * Delete's a player from the cache without destroying it on lavalink (only works when it's disconnected)
     * @param guildId
     * @returns
     *
     * @example
     * ```ts
     * client.lavalink.deletePlayer(interaction.guildId);
     * // shouldn't be used except you know what you are doing.
     * ```
     */
    deletePlayer(guildId: string): boolean | void;
    /**
     * Checks wether the the lib is useable based on if any node is connected
     *
     * @example
     * ```ts
     * if(!client.lavalink.useable) return console.error("can'T search yet, because there is no useable lavalink node.")
     * // continue with code e.g. createing a player and searching
     * ```
     */
    get useable(): boolean;
    /**
     * Initiates the Manager, creates all nodes and connects all of them
     * @param clientData
     *
     * @example
     * ```ts
     * // on the bot ready event
     * client.on("ready", () => {
     *   client.lavalink.init({
     *     id: client.user.id,
     *     username: client.user.username
     *   });
     * });
     * ```
     */
    init(clientData: BotClientOptions): Promise<this>;
    /**
     * Sends voice data to the Lavalink server.
     * ! Without this the library won't work
     * @param data
     *
     * @example
     *
     * ```ts
     * // on the bot "raw" event
     * client.on("raw", (d) => {
     *   // required in order to send audio updates and register channel deletion etc.
     *   client.lavalink.sendRawData(d)
     * })
     * ```
     */
    sendRawData(data: VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket): Promise<void>;
}

/** Default Sources Record, to allow source parsing with multiple inputs. */
declare const DefaultSources: Record<SearchPlatform, LavalinkSearchPlatform | ClientCustomSearchPlatformUtils>;
/** Lavalink Plugins definiton */
declare const LavalinkPlugins: {
    DuncteBot_Plugin: string;
    LavaSrc: string;
    GoogleCloudTTS: string;
    LavaSearch: string;
    Jiosaavn_Plugin: string;
    LavalinkFilterPlugin: string;
    JavaTimedLyricsPlugin: string;
};
/** Lavalink Sources regexes for url validations */
declare const SourceLinksRegexes: Record<SourcesRegex, RegExp>;

export { type AudioOutputs, type Awaitable, type Base64, type BaseNodeStats, type BasePlayOptions, type BotClientOptions, type CPUStats, type ChannelDeletePacket, type ChannelMixFilter, type ClientCustomSearchPlatformUtils, type ClientSearchPlatform, DebugEvents, type DeepRequired, DefaultQueueStore, DefaultSources, DestroyReasons, type DestroyReasonsType, DisconnectReasons, type DisconnectReasonsType, type DistortionFilter, type DuncteSearchPlatform, type EQBand, EQList, type Exception, type FailingAddress, type FilterData, FilterManager, type FloatNumber, type FrameStats, type GitObject, type GuildShardPayload, type IntegerNumber, type InvalidLavalinkRestRequest, type JioSaavnSearchPlatform, type KaraokeFilter, type LavaSearchFilteredResponse, type LavaSearchQuery, type LavaSearchResponse, type LavaSearchType, type LavaSrcSearchPlatform, type LavaSrcSearchPlatformBase, type LavalinkFilterData, type LavalinkInfo, LavalinkManager, type LavalinkManagerEvents, LavalinkNode, type LavalinkNodeIdentifier, type LavalinkNodeOptions, type LavalinkPlayOptions, type LavalinkPlayer, type LavalinkPlayerVoice, type LavalinkPlayerVoiceOptions, type LavalinkPlugin_JioSaavn_SourceNames, type LavalinkPlugin_LavaSrc_SourceNames, LavalinkPlugins, type LavalinkSearchPlatform, type LavalinkSourceNames, type LavalinkTrack, type LavalinkTrackInfo, type LoadTypes, type LowPassFilter, type LyricsEvent, type LyricsEventType, type LyricsFoundEvent, type LyricsLine, type LyricsLineEvent, type LyricsNotFoundEvent, type LyricsResult, type ManagerOptions, type ManagerPlayerOptions, type ManagerQueueOptions, ManagerUtils, type MemoryStats, MiniMap, type MiniMapConstructor, type ModifyRequest, type NazhaClientSearchPlatform, type NazhaClientSearchPlatformResolve, NodeManager, type NodeManagerEvents, type NodeMessage, type NodeStats, NodeSymbol, type Opaque, type PlayOptions, Player, type PlayerEvent, type PlayerEventType, type PlayerEvents, type PlayerFilters, type PlayerJson, type PlayerOptions, type PlayerUpdateInfo, type PlaylistInfo, type PluginInfo, type PluginObject, Queue, type QueueChangesWatcher, QueueSaver, type QueueStoreManager, QueueSymbol, type RepeatMode, type RequiredManagerOptions, type RotationFilter, type RoutePlanner, type RoutePlannerTypes, type SearchPlatform, type SearchQuery, type SearchResult, type Session, type Severity, SourceLinksRegexes, type SourceNames, type SourcesRegex, type SponsorBlockChapterStarted, type SponsorBlockChaptersLoaded, type SponsorBlockSegment, type SponsorBlockSegmentEventType, type SponsorBlockSegmentEvents, type SponsorBlockSegmentSkipped, type SponsorBlockSegmentsLoaded, type State, type StoredQueue, type TimescaleFilter, type Track, type TrackEndEvent, type TrackEndReason, type TrackExceptionEvent, type TrackInfo, type TrackStartEvent, type TrackStuckEvent, TrackSymbol, type TremoloFilter, type UnresolvedQuery, type UnresolvedSearchResult, type UnresolvedTrack, type UnresolvedTrackInfo, UnresolvedTrackSymbol, type VersionObject, type VibratoFilter, type VoicePacket, type VoiceServer, type VoiceState, type WebSocketClosedEvent, type anyObject, audioOutputsData, parseLavalinkConnUrl, queueTrackEnd, safeStringify, validSponsorBlocks };
