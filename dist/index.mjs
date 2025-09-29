// src/structures/LavalinkManager.ts
import { EventEmitter as EventEmitter2 } from "events";

// src/structures/Constants.ts
var DebugEvents = /* @__PURE__ */ ((DebugEvents2) => {
  DebugEvents2["SetSponsorBlock"] = "SetSponsorBlock";
  DebugEvents2["DeleteSponsorBlock"] = "DeleteSponsorBlock";
  DebugEvents2["TrackEndReplaced"] = "TrackEndReplaced";
  DebugEvents2["AutoplayExecution"] = "AutoplayExecution";
  DebugEvents2["AutoplayNoSongsAdded"] = "AutoplayNoSongsAdded";
  DebugEvents2["AutoplayThresholdSpamLimiter"] = "AutoplayThresholdSpamLimiter";
  DebugEvents2["TriggerQueueEmptyInterval"] = "TriggerQueueEmptyInterval";
  DebugEvents2["QueueEnded"] = "QueueEnded";
  DebugEvents2["TrackStartNewSongsOnly"] = "TrackStartNewSongsOnly";
  DebugEvents2["TrackStartNoTrack"] = "TrackStartNoTrack";
  DebugEvents2["ResumingFetchingError"] = "ResumingFetchingError";
  DebugEvents2["PlayerUpdateNoPlayer"] = "PlayerUpdateNoPlayer";
  DebugEvents2["PlayerUpdateFilterFixApply"] = "PlayerUpdateFilterFixApply";
  DebugEvents2["PlayerUpdateSuccess"] = "PlayerUpdateSuccess";
  DebugEvents2["HeartBeatTriggered"] = "HeartBeatTriggered";
  DebugEvents2["NoSocketOnDestroy"] = "NoSocketOnDestroy";
  DebugEvents2["SocketTerminateHeartBeatTimeout"] = "SocketTerminateHeartBeatTimeout";
  DebugEvents2["TryingConnectWhileConnected"] = "TryingConnectWhileConnected";
  DebugEvents2["LavaSearchNothingFound"] = "LavaSearchNothingFound";
  DebugEvents2["SearchNothingFound"] = "SearchNothingFound";
  DebugEvents2["ValidatingBlacklistLinks"] = "ValidatingBlacklistLinks";
  DebugEvents2["ValidatingWhitelistLinks"] = "ValidatingWhitelistLinks";
  DebugEvents2["TrackErrorMaxTracksErroredPerTime"] = "TrackErrorMaxTracksErroredPerTime";
  DebugEvents2["TrackStuckMaxTracksErroredPerTime"] = "TrackStuckMaxTracksErroredPerTime";
  DebugEvents2["PlayerDestroyingSomewhereElse"] = "PlayerDestroyingSomewhereElse";
  DebugEvents2["PlayerCreateNodeNotFound"] = "PlayerCreateNodeNotFound";
  DebugEvents2["PlayerPlayQueueEmptyTimeoutClear"] = "PlayerPlayQueueEmptyTimeoutClear";
  DebugEvents2["PlayerPlayWithTrackReplace"] = "PlayerPlayWithTrackReplace";
  DebugEvents2["PlayerPlayUnresolvedTrack"] = "PlayerPlayUnresolvedTrack";
  DebugEvents2["PlayerPlayUnresolvedTrackFailed"] = "PlayerPlayUnresolvedTrackFailed";
  DebugEvents2["PlayerVolumeAsFilter"] = "PlayerVolumeAsFilter";
  DebugEvents2["BandcampSearchLokalEngine"] = "BandcampSearchLokalEngine";
  DebugEvents2["PlayerChangeNode"] = "PlayerChangeNode";
  DebugEvents2["BuildTrackError"] = "BuildTrackError";
  DebugEvents2["TransformRequesterFunctionFailed"] = "TransformRequesterFunctionFailed";
  DebugEvents2["GetClosestTrackFailed"] = "GetClosestTrackFailed";
  DebugEvents2["PlayerDeleteInsteadOfDestroy"] = "PlayerDeleteInsteadOfDestroy";
  DebugEvents2["FailedToConnectToNodes"] = "FailedToConnectToNodes";
  DebugEvents2["NoAudioDebug"] = "NoAudioDebug";
  DebugEvents2["PlayerAutoReconnect"] = "PlayerAutoReconnect";
  return DebugEvents2;
})(DebugEvents || {});
var DestroyReasons = /* @__PURE__ */ ((DestroyReasons2) => {
  DestroyReasons2["QueueEmpty"] = "QueueEmpty";
  DestroyReasons2["NodeDestroy"] = "NodeDestroy";
  DestroyReasons2["NodeDeleted"] = "NodeDeleted";
  DestroyReasons2["LavalinkNoVoice"] = "LavalinkNoVoice";
  DestroyReasons2["NodeReconnectFail"] = "NodeReconnectFail";
  DestroyReasons2["Disconnected"] = "Disconnected";
  DestroyReasons2["PlayerReconnectFail"] = "PlayerReconnectFail";
  DestroyReasons2["PlayerChangeNodeFail"] = "PlayerChangeNodeFail";
  DestroyReasons2["PlayerChangeNodeFailNoEligibleNode"] = "PlayerChangeNodeFailNoEligibleNode";
  DestroyReasons2["ChannelDeleted"] = "ChannelDeleted";
  DestroyReasons2["DisconnectAllNodes"] = "DisconnectAllNodes";
  DestroyReasons2["ReconnectAllNodes"] = "ReconnectAllNodes";
  DestroyReasons2["TrackErrorMaxTracksErroredPerTime"] = "TrackErrorMaxTracksErroredPerTime";
  DestroyReasons2["TrackStuckMaxTracksErroredPerTime"] = "TrackStuckMaxTracksErroredPerTime";
  return DestroyReasons2;
})(DestroyReasons || {});
var DisconnectReasons = /* @__PURE__ */ ((DisconnectReasons2) => {
  DisconnectReasons2["Disconnected"] = "Disconnected";
  DisconnectReasons2["DisconnectAllNodes"] = "DisconnectAllNodes";
  return DisconnectReasons2;
})(DisconnectReasons || {});
var validSponsorBlocks = ["sponsor", "selfpromo", "interaction", "intro", "outro", "preview", "music_offtopic", "filler"];
var audioOutputsData = {
  mono: {
    // totalLeft: 1, totalRight: 1
    leftToLeft: 0.5,
    //each channel should in total 0 | 1, 0 === off, 1 === on, 0.5+0.5 === 1
    leftToRight: 0.5,
    rightToLeft: 0.5,
    rightToRight: 0.5
  },
  stereo: {
    // totalLeft: 1, totalRight: 1
    leftToLeft: 1,
    leftToRight: 0,
    rightToLeft: 0,
    rightToRight: 1
  },
  left: {
    // totalLeft: 1, totalRight: 0
    leftToLeft: 1,
    leftToRight: 0,
    rightToLeft: 1,
    rightToRight: 0
  },
  right: {
    // totalLeft: 0, totalRight: 1
    leftToLeft: 0,
    leftToRight: 1,
    rightToLeft: 0,
    rightToRight: 1
  }
};
var EQList = {
  /** A Bassboost Equalizer, so high it distorts the audio */
  BassboostEarrape: [
    { band: 0, gain: 0.6 * 0.375 },
    { band: 1, gain: 0.67 * 0.375 },
    { band: 2, gain: 0.67 * 0.375 },
    { band: 3, gain: 0.4 * 0.375 },
    { band: 4, gain: -0.5 * 0.375 },
    { band: 5, gain: 0.15 * 0.375 },
    { band: 6, gain: -0.45 * 0.375 },
    { band: 7, gain: 0.23 * 0.375 },
    { band: 8, gain: 0.35 * 0.375 },
    { band: 9, gain: 0.45 * 0.375 },
    { band: 10, gain: 0.55 * 0.375 },
    { band: 11, gain: -0.6 * 0.375 },
    { band: 12, gain: 0.55 * 0.375 },
    { band: 13, gain: -0.5 * 0.375 },
    { band: 14, gain: -0.75 * 0.375 }
  ],
  /** A High and decent Bassboost Equalizer */
  BassboostHigh: [
    { band: 0, gain: 0.6 * 0.25 },
    { band: 1, gain: 0.67 * 0.25 },
    { band: 2, gain: 0.67 * 0.25 },
    { band: 3, gain: 0.4 * 0.25 },
    { band: 4, gain: -0.5 * 0.25 },
    { band: 5, gain: 0.15 * 0.25 },
    { band: 6, gain: -0.45 * 0.25 },
    { band: 7, gain: 0.23 * 0.25 },
    { band: 8, gain: 0.35 * 0.25 },
    { band: 9, gain: 0.45 * 0.25 },
    { band: 10, gain: 0.55 * 0.25 },
    { band: 11, gain: -0.6 * 0.25 },
    { band: 12, gain: 0.55 * 0.25 },
    { band: 13, gain: -0.5 * 0.25 },
    { band: 14, gain: -0.75 * 0.25 }
  ],
  /** A decent Bassboost Equalizer */
  BassboostMedium: [
    { band: 0, gain: 0.6 * 0.1875 },
    { band: 1, gain: 0.67 * 0.1875 },
    { band: 2, gain: 0.67 * 0.1875 },
    { band: 3, gain: 0.4 * 0.1875 },
    { band: 4, gain: -0.5 * 0.1875 },
    { band: 5, gain: 0.15 * 0.1875 },
    { band: 6, gain: -0.45 * 0.1875 },
    { band: 7, gain: 0.23 * 0.1875 },
    { band: 8, gain: 0.35 * 0.1875 },
    { band: 9, gain: 0.45 * 0.1875 },
    { band: 10, gain: 0.55 * 0.1875 },
    { band: 11, gain: -0.6 * 0.1875 },
    { band: 12, gain: 0.55 * 0.1875 },
    { band: 13, gain: -0.5 * 0.1875 },
    { band: 14, gain: -0.75 * 0.1875 }
  ],
  /** A slight Bassboost Equalizer */
  BassboostLow: [
    { band: 0, gain: 0.6 * 0.125 },
    { band: 1, gain: 0.67 * 0.125 },
    { band: 2, gain: 0.67 * 0.125 },
    { band: 3, gain: 0.4 * 0.125 },
    { band: 4, gain: -0.5 * 0.125 },
    { band: 5, gain: 0.15 * 0.125 },
    { band: 6, gain: -0.45 * 0.125 },
    { band: 7, gain: 0.23 * 0.125 },
    { band: 8, gain: 0.35 * 0.125 },
    { band: 9, gain: 0.45 * 0.125 },
    { band: 10, gain: 0.55 * 0.125 },
    { band: 11, gain: -0.6 * 0.125 },
    { band: 12, gain: 0.55 * 0.125 },
    { band: 13, gain: -0.5 * 0.125 },
    { band: 14, gain: -0.75 * 0.125 }
  ],
  /** Makes the Music slightly "better" */
  BetterMusic: [
    { band: 0, gain: 0.25 },
    { band: 1, gain: 0.025 },
    { band: 2, gain: 0.0125 },
    { band: 3, gain: 0 },
    { band: 4, gain: 0 },
    { band: 5, gain: -0.0125 },
    { band: 6, gain: -0.025 },
    { band: 7, gain: -0.0175 },
    { band: 8, gain: 0 },
    { band: 9, gain: 0 },
    { band: 10, gain: 0.0125 },
    { band: 11, gain: 0.025 },
    { band: 12, gain: 0.25 },
    { band: 13, gain: 0.125 },
    { band: 14, gain: 0.125 }
  ],
  /** Makes the Music sound like rock music / sound rock music better */
  Rock: [
    { band: 0, gain: 0.3 },
    { band: 1, gain: 0.25 },
    { band: 2, gain: 0.2 },
    { band: 3, gain: 0.1 },
    { band: 4, gain: 0.05 },
    { band: 5, gain: -0.05 },
    { band: 6, gain: -0.15 },
    { band: 7, gain: -0.2 },
    { band: 8, gain: -0.1 },
    { band: 9, gain: -0.05 },
    { band: 10, gain: 0.05 },
    { band: 11, gain: 0.1 },
    { band: 12, gain: 0.2 },
    { band: 13, gain: 0.25 },
    { band: 14, gain: 0.3 }
  ],
  /** Makes the Music sound like Classic music / sound Classic music better */
  Classic: [
    { band: 0, gain: 0.375 },
    { band: 1, gain: 0.35 },
    { band: 2, gain: 0.125 },
    { band: 3, gain: 0 },
    { band: 4, gain: 0 },
    { band: 5, gain: 0.125 },
    { band: 6, gain: 0.55 },
    { band: 7, gain: 0.05 },
    { band: 8, gain: 0.125 },
    { band: 9, gain: 0.25 },
    { band: 10, gain: 0.2 },
    { band: 11, gain: 0.25 },
    { band: 12, gain: 0.3 },
    { band: 13, gain: 0.25 },
    { band: 14, gain: 0.3 }
  ],
  /** Makes the Music sound like Pop music / sound Pop music better */
  Pop: [
    { band: 0, gain: 0.2635 },
    { band: 1, gain: 0.22141 },
    { band: 2, gain: -0.21141 },
    { band: 3, gain: -0.1851 },
    { band: 4, gain: -0.155 },
    { band: 5, gain: 0.21141 },
    { band: 6, gain: 0.22456 },
    { band: 7, gain: 0.237 },
    { band: 8, gain: 0.237 },
    { band: 9, gain: 0.237 },
    { band: 10, gain: -0.05 },
    { band: 11, gain: -0.116 },
    { band: 12, gain: 0.192 },
    { band: 13, gain: 0 }
  ],
  /** Makes the Music sound like Electronic music / sound Electronic music better */
  Electronic: [
    { band: 0, gain: 0.375 },
    { band: 1, gain: 0.35 },
    { band: 2, gain: 0.125 },
    { band: 3, gain: 0 },
    { band: 4, gain: 0 },
    { band: 5, gain: -0.125 },
    { band: 6, gain: -0.125 },
    { band: 7, gain: 0 },
    { band: 8, gain: 0.25 },
    { band: 9, gain: 0.125 },
    { band: 10, gain: 0.15 },
    { band: 11, gain: 0.2 },
    { band: 12, gain: 0.25 },
    { band: 13, gain: 0.35 },
    { band: 14, gain: 0.4 }
  ],
  /** Boosts all Bands slightly for louder and fuller sound */
  FullSound: [
    { band: 0, gain: 0.25 + 0.375 },
    { band: 1, gain: 0.25 + 0.025 },
    { band: 2, gain: 0.25 + 0.0125 },
    { band: 3, gain: 0.25 + 0 },
    { band: 4, gain: 0.25 + 0 },
    { band: 5, gain: 0.25 + -0.0125 },
    { band: 6, gain: 0.25 + -0.025 },
    { band: 7, gain: 0.25 + -0.0175 },
    { band: 8, gain: 0.25 + 0 },
    { band: 9, gain: 0.25 + 0 },
    { band: 10, gain: 0.25 + 0.0125 },
    { band: 11, gain: 0.25 + 0.025 },
    { band: 12, gain: 0.25 + 0.375 },
    { band: 13, gain: 0.25 + 0.125 },
    { band: 14, gain: 0.25 + 0.125 }
  ],
  /** Boosts basses + lower highs for a pro gaming sound */
  Gaming: [
    { band: 0, gain: 0.35 },
    { band: 1, gain: 0.3 },
    { band: 2, gain: 0.25 },
    { band: 3, gain: 0.2 },
    { band: 4, gain: 0.15 },
    { band: 5, gain: 0.1 },
    { band: 6, gain: 0.05 },
    { band: 7, gain: -0 },
    { band: 8, gain: -0.05 },
    { band: 9, gain: -0.1 },
    { band: 10, gain: -0.15 },
    { band: 11, gain: -0.2 },
    { band: 12, gain: -0.25 },
    { band: 13, gain: -0.3 },
    { band: 14, gain: -0.35 }
  ]
};

// src/structures/NodeManager.ts
import { EventEmitter } from "events";

// src/structures/Node.ts
import { isAbsolute } from "path";
import WebSocket from "ws";

// src/structures/Utils.ts
import { URL as URL2 } from "url";
import { isRegExp } from "util/types";

// src/structures/LavalinkManagerStatics.ts
var DefaultSources = {
  // youtubemusic
  "youtube music": "ytmsearch",
  "youtubemusic": "ytmsearch",
  "ytmsearch": "ytmsearch",
  "ytm": "ytmsearch",
  "musicyoutube": "ytmsearch",
  "music youtube": "ytmsearch",
  // youtube
  "youtube": "ytsearch",
  "yt": "ytsearch",
  "ytsearch": "ytsearch",
  // soundcloud
  "soundcloud": "scsearch",
  "scsearch": "scsearch",
  "sc": "scsearch",
  // apple music
  "apple music": "amsearch",
  "apple": "amsearch",
  "applemusic": "amsearch",
  "amsearch": "amsearch",
  "am": "amsearch",
  "musicapple": "amsearch",
  "music apple": "amsearch",
  // spotify
  "spotify": "spsearch",
  "spsearch": "spsearch",
  "sp": "spsearch",
  "spotify.com": "spsearch",
  "spotifycom": "spsearch",
  "sprec": "sprec",
  "spsuggestion": "sprec",
  // deezer
  "deezer": "dzsearch",
  "dz": "dzsearch",
  "dzsearch": "dzsearch",
  "dzisrc": "dzisrc",
  "dzrec": "dzrec",
  // yandexmusic
  "yandex music": "ymsearch",
  "yandexmusic": "ymsearch",
  "yandex": "ymsearch",
  "ymsearch": "ymsearch",
  "ymrec": "ymrec",
  // VK Music (lavasrc)
  "vksearch": "vksearch",
  "vkmusic": "vksearch",
  "vk music": "vksearch",
  "vkrec": "vkrec",
  "vk": "vksearch",
  // Qobuz (lavasrc)
  "qbsearch": "qbsearch",
  "qobuz": "qbsearch",
  "qbisrc": "qbisrc",
  "qbrec": "qbrec",
  // speak PLUGIN
  "speak": "speak",
  "tts": "tts",
  "ftts": "ftts",
  "flowery": "ftts",
  "flowery.tts": "ftts",
  "flowerytts": "ftts",
  // Client sided search platforms (after lavalinkv4.0.6 it will search via bcsearch on the node itself)
  "bandcamp": "bcsearch",
  "bc": "bcsearch",
  "bcsearch": "bcsearch",
  // other searches:
  "phsearch": "phsearch",
  "pornhub": "phsearch",
  "porn": "phsearch",
  // local files
  "local": "local",
  // http requests
  "http": "http",
  "https": "https",
  "link": "link",
  "uri": "uri",
  // tidal
  "tidal": "tdsearch",
  "td": "tdsearch",
  "tidal music": "tdsearch",
  "tdsearch": "tdsearch",
  "tdrec": "tdrec",
  // jiosaavn
  "jiosaavn": "jssearch",
  "js": "jssearch",
  "jssearch": "jssearch",
  "jsrec": "jsrec"
};
var LavalinkPlugins = {
  DuncteBot_Plugin: "DuncteBot-plugin",
  LavaSrc: "lavasrc-plugin",
  GoogleCloudTTS: "tts-plugin",
  LavaSearch: "lavasearch-plugin",
  Jiosaavn_Plugin: "jiosaavn-plugin",
  LavalinkFilterPlugin: "lavalink-filter-plugin",
  JavaTimedLyricsPlugin: "java-lyrics-plugin"
};
var SourceLinksRegexes = {
  /** DEFAULT SUPPORTED BY LAVALINK */
  YoutubeRegex: /https?:\/\/?(?:www\.)?(?:(m|www)\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts|playlist\?|watch\?v=|watch\?.+(?:&|&#38;);v=))([a-zA-Z0-9\-_]{11})?(?:(?:\?|&|&#38;)index=((?:\d){1,3}))?(?:(?:\?|&|&#38;)?list=([a-zA-Z\-_0-9]{34}))?(?:\S+)?/,
  YoutubeMusicRegex: /https?:\/\/?(?:www\.)?(?:(music|m|www)\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts|playlist\?|watch\?v=|watch\?.+(?:&|&#38;);v=))([a-zA-Z0-9\-_]{11})?(?:(?:\?|&|&#38;)index=((?:\d){1,3}))?(?:(?:\?|&|&#38;)?list=([a-zA-Z\-_0-9]{34}))?(?:\S+)?/,
  SoundCloudRegex: /https:\/\/(?:on\.)?soundcloud\.com\//,
  SoundCloudMobileRegex: /https?:\/\/(soundcloud\.app\.goo\.gl)\/(\S+)/,
  bandcamp: /https?:\/\/?(?:www\.)?([\d|\w]+)\.bandcamp\.com\/(\S+)/,
  TwitchTv: /https?:\/\/?(?:www\.)?twitch\.tv\/\w+/,
  vimeo: /https?:\/\/(www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|)(\d+)(?:|\/\?)/,
  mp3Url: /(https?|ftp|file):\/\/(www.)?(.*?)\.(mp3)$/,
  m3uUrl: /(https?|ftp|file):\/\/(www.)?(.*?)\.(m3u)$/,
  m3u8Url: /(https?|ftp|file):\/\/(www.)?(.*?)\.(m3u8)$/,
  mp4Url: /(https?|ftp|file):\/\/(www.)?(.*?)\.(mp4)$/,
  m4aUrl: /(https?|ftp|file):\/\/(www.)?(.*?)\.(m4a)$/,
  wavUrl: /(https?|ftp|file):\/\/(www.)?(.*?)\.(wav)$/,
  aacpUrl: /(https?|ftp|file):\/\/(www.)?(.*?)\.(aacp)$/,
  /** FROM LAVA SOURCE */
  DeezerTrackRegex: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?track\/(\d+)/,
  DeezerPageLinkRegex: /(https?:\/\/|)?(?:www\.)?deezer\.page\.link\/(\S+)/,
  DeezerPlaylistRegex: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?playlist\/(\d+)/,
  DeezerAlbumRegex: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?album\/(\d+)/,
  DeezerArtistRegex: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?artist\/(\d+)/,
  DeezerMixesRegex: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?mixes\/genre\/(\d+)/,
  DeezerEpisodeRegex: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?episode\/(\d+)/,
  // DeezerPodcastRegex: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?podcast\/(\d+)/,
  AllDeezerRegexWithoutPageLink: /(https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(track|playlist|album|artist|mixes\/genre|episode)\/(\d+)/,
  AllDeezerRegex: /((https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(track|playlist|album|artist|mixes\/genre|episode)\/(\d+)|(https?:\/\/|)?(?:www\.)?deezer\.page\.link\/(\S+))/,
  SpotifySongRegex: /(https?:\/\/)(www\.)?open\.spotify\.com\/((?<region>[a-zA-Z-]+)\/)?(user\/(?<user>[a-zA-Z0-9-_]+)\/)?track\/(?<identifier>[a-zA-Z0-9-_]+)/,
  SpotifyPlaylistRegex: /(https?:\/\/)(www\.)?open\.spotify\.com\/((?<region>[a-zA-Z-]+)\/)?(user\/(?<user>[a-zA-Z0-9-_]+)\/)?playlist\/(?<identifier>[a-zA-Z0-9-_]+)/,
  SpotifyArtistRegex: /(https?:\/\/)(www\.)?open\.spotify\.com\/((?<region>[a-zA-Z-]+)\/)?(user\/(?<user>[a-zA-Z0-9-_]+)\/)?artist\/(?<identifier>[a-zA-Z0-9-_]+)/,
  SpotifyEpisodeRegex: /(https?:\/\/)(www\.)?open\.spotify\.com\/((?<region>[a-zA-Z-]+)\/)?(user\/(?<user>[a-zA-Z0-9-_]+)\/)?episode\/(?<identifier>[a-zA-Z0-9-_]+)/,
  SpotifyShowRegex: /(https?:\/\/)(www\.)?open\.spotify\.com\/((?<region>[a-zA-Z-]+)\/)?(user\/(?<user>[a-zA-Z0-9-_]+)\/)?show\/(?<identifier>[a-zA-Z0-9-_]+)/,
  SpotifyAlbumRegex: /(https?:\/\/)(www\.)?open\.spotify\.com\/((?<region>[a-zA-Z-]+)\/)?(user\/(?<user>[a-zA-Z0-9-_]+)\/)?album\/(?<identifier>[a-zA-Z0-9-_]+)/,
  AllSpotifyRegex: /(https?:\/\/)(www\.)?open\.spotify\.com\/((?<region>[a-zA-Z-]+)\/)?(user\/(?<user>[a-zA-Z0-9-_]+)\/)?(?<type>track|album|playlist|artist|episode|show)\/(?<identifier>[a-zA-Z0-9-_]+)/,
  appleMusic: /https?:\/\/?(?:www\.)?music\.apple\.com\/(\S+)/,
  /** From tidal */
  tidal: /https?:\/\/?(?:www\.)?(?:tidal|listen)\.tidal\.com\/(?<type>track|album|playlist|artist)\/(?<identifier>[a-zA-Z0-9-_]+)/,
  /** From jiosaavn-plugin */
  jiosaavn: /(https?:\/\/)(www\.)?jiosaavn\.com\/(?<type>song|album|featured|artist)\/([a-zA-Z0-9-_/,]+)/,
  /** FROM DUNCTE BOT PLUGIN */
  tiktok: /https:\/\/www\.tiktok\.com\//,
  mixcloud: /https:\/\/www\.mixcloud\.com\//,
  musicYandex: /https:\/\/music\.yandex\.ru\//,
  radiohost: /https?:\/\/[^.\s]+\.radiohost\.de\/(\S+)/
};

// src/structures/Utils.ts
var TrackSymbol = Symbol("LC-Track");
var UnresolvedTrackSymbol = Symbol("LC-Track-Unresolved");
var QueueSymbol = Symbol("LC-Queue");
var NodeSymbol = Symbol("LC-Node");
var escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function parseLavalinkConnUrl(connectionUrl) {
  if (!connectionUrl.startsWith("lavalink://")) throw new Error(`ConnectionUrl (${connectionUrl}) must start with 'lavalink://'`);
  const parsed = new URL2(connectionUrl);
  return {
    authorization: parsed.password,
    id: parsed.username,
    host: parsed.hostname,
    port: Number(parsed.port)
  };
}
var ManagerUtils = class {
  LavalinkManager = void 0;
  constructor(LavalinkManager2) {
    this.LavalinkManager = LavalinkManager2;
  }
  buildPluginInfo(data, clientData = {}) {
    return {
      clientData,
      ...data.pluginInfo || data.plugin
    };
  }
  buildTrack(data, requester) {
    if (!data?.encoded || typeof data.encoded !== "string") throw new RangeError("Argument 'data.encoded' must be present.");
    if (!data.info) throw new RangeError("Argument 'data.info' must be present.");
    try {
      let transformedRequester = typeof requester === "object" ? this.getTransformedRequester(requester) : void 0;
      if (!transformedRequester && typeof data?.userData?.requester === "object" && data.userData.requester !== null) {
        transformedRequester = this.getTransformedRequester(data.userData.requester);
      }
      const r = {
        encoded: data.encoded,
        info: {
          identifier: data.info.identifier,
          title: data.info.title,
          author: data.info.author,
          duration: data.info?.duration || data.info?.length,
          artworkUrl: data.info.artworkUrl || data.pluginInfo?.artworkUrl || data.plugin?.artworkUrl,
          uri: data.info.uri,
          sourceName: data.info.sourceName,
          isSeekable: data.info.isSeekable,
          isStream: data.info.isStream,
          isrc: data.info.isrc
        },
        userData: {
          ...data.userData,
          requester: transformedRequester
        },
        pluginInfo: this.buildPluginInfo(data, "clientData" in data ? data.clientData : {}),
        requester: transformedRequester || this.getTransformedRequester(this.LavalinkManager?.options?.client)
      };
      Object.defineProperty(r, TrackSymbol, { configurable: true, value: true });
      return r;
    } catch (error) {
      if (this.LavalinkManager?.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager?.emit("debug", "BuildTrackError" /* BuildTrackError */, {
          error,
          functionLayer: "ManagerUtils > buildTrack()",
          message: "Error while building track",
          state: "error"
        });
      }
      throw new RangeError(`Argument "data" is not a valid track: ${error.message}`);
    }
  }
  /**
   * Builds a UnresolvedTrack to be resolved before being played  .
   * @param query
   * @param requester
   */
  buildUnresolvedTrack(query, requester) {
    if (typeof query === "undefined")
      throw new RangeError('Argument "query" must be present.');
    const unresolvedTrack = {
      encoded: query.encoded || void 0,
      info: query.info ? query.info : query.title ? query : void 0,
      pluginInfo: this.buildPluginInfo(query),
      requester: this.getTransformedRequester(requester),
      async resolve(player) {
        const closest = await getClosestTrack(this, player);
        if (!closest) throw new SyntaxError("No closest Track found");
        for (const prop of Object.getOwnPropertyNames(this)) delete this[prop];
        delete this[UnresolvedTrackSymbol];
        Object.defineProperty(this, TrackSymbol, { configurable: true, value: true });
        return Object.assign(this, closest);
      }
    };
    if (!this.isUnresolvedTrack(unresolvedTrack)) throw SyntaxError("Could not build Unresolved Track");
    Object.defineProperty(unresolvedTrack, UnresolvedTrackSymbol, { configurable: true, value: true });
    return unresolvedTrack;
  }
  /**
   * Validate if a data is equal to a node
   * @param data
   */
  isNode(data) {
    if (!data) return false;
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(data));
    if (!keys.includes("constructor")) return false;
    if (!keys.length) return false;
    if (!["connect", "destroy", "destroyPlayer", "fetchAllPlayers", "fetchInfo", "fetchPlayer", "fetchStats", "fetchVersion", "request", "updatePlayer", "updateSession"].every((v) => keys.includes(v))) return false;
    return true;
  }
  getTransformedRequester(requester) {
    try {
      return typeof this.LavalinkManager?.options?.playerOptions?.requesterTransformer === "function" ? this.LavalinkManager?.options?.playerOptions?.requesterTransformer(requester) : requester;
    } catch (e) {
      if (this.LavalinkManager?.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager?.emit("debug", "TransformRequesterFunctionFailed" /* TransformRequesterFunctionFailed */, {
          error: e,
          functionLayer: "ManagerUtils > getTransformedRequester()",
          message: "Your custom transformRequesterFunction failed to execute, please check your function for errors.",
          state: "error"
        });
      }
      return requester;
    }
  }
  /**
   * Validate if a data is equal to node options
   * @param data
   */
  isNodeOptions(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    if (typeof data.host !== "string" || !data.host.length) return false;
    if (typeof data.port !== "number" || isNaN(data.port) || data.port < 0 || data.port > 65535) return false;
    if (typeof data.authorization !== "string" || !data.authorization.length) return false;
    if ("secure" in data && typeof data.secure !== "boolean" && data.secure !== void 0) return false;
    if ("sessionId" in data && typeof data.sessionId !== "string" && data.sessionId !== void 0) return false;
    if ("id" in data && typeof data.id !== "string" && data.id !== void 0) return false;
    if ("regions" in data && (!Array.isArray(data.regions) || !data.regions.every((v) => typeof v === "string") && data.regions !== void 0)) return false;
    if ("poolOptions" in data && typeof data.poolOptions !== "object" && data.poolOptions !== void 0) return false;
    if ("retryAmount" in data && (typeof data.retryAmount !== "number" || isNaN(data.retryAmount) || data.retryAmount <= 0 && data.retryAmount !== void 0)) return false;
    if ("retryDelay" in data && (typeof data.retryDelay !== "number" || isNaN(data.retryDelay) || data.retryDelay <= 0 && data.retryDelay !== void 0)) return false;
    if ("requestTimeout" in data && (typeof data.requestTimeout !== "number" || isNaN(data.requestTimeout) || data.requestTimeout <= 0 && data.requestTimeout !== void 0)) return false;
    return true;
  }
  /**
   * Validate if a data is equal to a track
   * @param data the Track to validate
   * @returns
   */
  isTrack(data) {
    if (!data) return false;
    if (data[TrackSymbol] === true) return true;
    return typeof data?.encoded === "string" && typeof data?.info === "object" && !("resolve" in data);
  }
  /**
   * Checks if the provided argument is a valid UnresolvedTrack.
   * @param track
   */
  isUnresolvedTrack(data) {
    if (!data) return false;
    if (data[UnresolvedTrackSymbol] === true) return true;
    return typeof data === "object" && ("info" in data && typeof data.info.title === "string" || typeof data.encoded === "string") && "resolve" in data && typeof data.resolve === "function";
  }
  /**
   * Checks if the provided argument is a valid UnresolvedTrack.
   * @param track
   */
  isUnresolvedTrackQuery(data) {
    return typeof data === "object" && !("info" in data) && typeof data.title === "string";
  }
  async getClosestTrack(data, player) {
    try {
      return getClosestTrack(data, player);
    } catch (e) {
      if (this.LavalinkManager?.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager?.emit("debug", "GetClosestTrackFailed" /* GetClosestTrackFailed */, {
          error: e,
          functionLayer: "ManagerUtils > getClosestTrack()",
          message: "Failed to resolve track because the getClosestTrack function failed.",
          state: "error"
        });
      }
      throw e;
    }
  }
  validateQueryString(node, queryString, sourceString) {
    if (!node.info) throw new Error("No Lavalink Node was provided");
    if (!node.info.sourceManagers?.length) throw new Error("Lavalink Node, has no sourceManagers enabled");
    if (!queryString.trim().length) throw new Error(`Query string is empty, please provide a valid query string.`);
    if (sourceString === "speak" && queryString.length > 100) throw new Error(`Query is speak, which is limited to 100 characters.`);
    if (this.LavalinkManager.options?.linksBlacklist?.length > 0) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "ValidatingBlacklistLinks" /* ValidatingBlacklistLinks */, {
          state: "log",
          message: `Validating Query against LavalinkManager.options.linksBlacklist, query: "${queryString}"`,
          functionLayer: "(LavalinkNode > node | player) > search() > validateQueryString()"
        });
      }
      if (this.LavalinkManager.options?.linksBlacklist.some((v) => typeof v === "string" && (queryString.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(queryString.toLowerCase())) || isRegExp(v) && v.test(queryString))) {
        throw new Error(`Query string contains a link / word which is blacklisted.`);
      }
    }
    if (!/^https?:\/\//.test(queryString)) return;
    else if (this.LavalinkManager.options?.linksAllowed === false) throw new Error("Using links to make a request is not allowed.");
    if (this.LavalinkManager.options?.linksWhitelist?.length > 0) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "ValidatingWhitelistLinks" /* ValidatingWhitelistLinks */, {
          state: "log",
          message: `Link was provided to the Query, validating against LavalinkManager.options.linksWhitelist, query: "${queryString}"`,
          functionLayer: "(LavalinkNode > node | player) > search() > validateQueryString()"
        });
      }
      if (!this.LavalinkManager.options?.linksWhitelist.some((v) => typeof v === "string" && (queryString.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(queryString.toLowerCase())) || isRegExp(v) && v.test(queryString))) {
        throw new Error(`Query string contains a link / word which isn't whitelisted.`);
      }
    }
    if ((SourceLinksRegexes.YoutubeMusicRegex.test(queryString) || SourceLinksRegexes.YoutubeRegex.test(queryString)) && !node.info?.sourceManagers?.includes("youtube")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'youtube' enabled");
    }
    if ((SourceLinksRegexes.SoundCloudMobileRegex.test(queryString) || SourceLinksRegexes.SoundCloudRegex.test(queryString)) && !node.info?.sourceManagers?.includes("soundcloud")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'soundcloud' enabled");
    }
    if (SourceLinksRegexes.bandcamp.test(queryString) && !node.info?.sourceManagers?.includes("bandcamp")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'bandcamp' enabled (introduced with lavaplayer 2.2.0 or lavalink 4.0.6)");
    }
    if (SourceLinksRegexes.TwitchTv.test(queryString) && !node.info?.sourceManagers?.includes("twitch")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'twitch' enabled");
    }
    if (SourceLinksRegexes.vimeo.test(queryString) && !node.info?.sourceManagers?.includes("vimeo")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'vimeo' enabled");
    }
    if (SourceLinksRegexes.tiktok.test(queryString) && !node.info?.sourceManagers?.includes("tiktok")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'tiktok' enabled");
    }
    if (SourceLinksRegexes.mixcloud.test(queryString) && !node.info?.sourceManagers?.includes("mixcloud")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'mixcloud' enabled");
    }
    if (SourceLinksRegexes.AllSpotifyRegex.test(queryString) && !node.info?.sourceManagers?.includes("spotify")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'spotify' enabled");
    }
    if (SourceLinksRegexes.appleMusic.test(queryString) && !node.info?.sourceManagers?.includes("applemusic")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'applemusic' enabled");
    }
    if (SourceLinksRegexes.AllDeezerRegex.test(queryString) && !node.info?.sourceManagers?.includes("deezer")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'deezer' enabled");
    }
    if (SourceLinksRegexes.musicYandex.test(queryString) && !node.info?.sourceManagers?.includes("yandexmusic")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'yandexmusic' enabled");
    }
    if (SourceLinksRegexes.jiosaavn.test(queryString) && !node.info?.sourceManagers?.includes("jiosaavn")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'jiosaavn' (via jiosaavn-plugin) enabled");
    }
    if (SourceLinksRegexes.tidal.test(queryString) && !node.info?.sourceManagers?.includes("tidal")) {
      throw new Error("Query / Link Provided for this Source but Lavalink Node has not 'tidal' enabled");
    }
    return;
  }
  transformQuery(query) {
    const sourceOfQuery = typeof query === "string" ? void 0 : DefaultSources[query.source?.trim?.()?.toLowerCase?.() ?? this.LavalinkManager?.options?.playerOptions?.defaultSearchPlatform?.toLowerCase?.()] ?? query.source?.trim?.()?.toLowerCase?.();
    const Query = {
      query: typeof query === "string" ? query : query.query,
      extraQueryUrlParams: typeof query !== "string" ? query.extraQueryUrlParams : void 0,
      source: sourceOfQuery ?? this.LavalinkManager?.options?.playerOptions?.defaultSearchPlatform?.toLowerCase?.()
    };
    const foundSource = Object.keys(DefaultSources).find((source) => Query.query?.toLowerCase?.()?.startsWith(`${source}:`.toLowerCase()))?.trim?.()?.toLowerCase?.();
    if (foundSource && !["https", "http"].includes(foundSource) && DefaultSources[foundSource]) {
      Query.source = DefaultSources[foundSource];
      Query.query = Query.query.slice(`${foundSource}:`.length, Query.query.length);
    }
    return Query;
  }
  transformLavaSearchQuery(query) {
    const sourceOfQuery = typeof query === "string" ? void 0 : DefaultSources[query.source?.trim?.()?.toLowerCase?.() ?? this.LavalinkManager?.options?.playerOptions?.defaultSearchPlatform?.toLowerCase?.()] ?? query.source?.trim?.()?.toLowerCase?.();
    const Query = {
      query: typeof query === "string" ? query : query.query,
      types: query.types ? ["track", "playlist", "artist", "album", "text"].filter((v) => query.types?.find((x) => x.toLowerCase().startsWith(v))) : [
        "track",
        "playlist",
        "artist",
        "album"
        /*"text"*/
      ],
      source: sourceOfQuery ?? this.LavalinkManager?.options?.playerOptions?.defaultSearchPlatform?.toLowerCase?.()
    };
    const foundSource = Object.keys(DefaultSources).find((source) => Query.query.toLowerCase().startsWith(`${source}:`.toLowerCase()))?.trim?.()?.toLowerCase?.();
    if (foundSource && DefaultSources[foundSource]) {
      Query.source = DefaultSources[foundSource];
      Query.query = Query.query.slice(`${foundSource}:`.length, Query.query.length);
    }
    return Query;
  }
  validateSourceString(node, sourceString) {
    if (!sourceString) throw new Error(`No SourceString was provided`);
    const source = DefaultSources[sourceString.toLowerCase().trim()];
    if (!source) throw new Error(`Lavalink Node SearchQuerySource: '${sourceString}' is not available`);
    if (!node.info) throw new Error("Lavalink Node does not have any info cached yet, not ready yet!");
    if (source === "amsearch" && !node.info?.sourceManagers?.includes("applemusic")) {
      throw new Error("Lavalink Node has not 'applemusic' enabled, which is required to have 'amsearch' work");
    }
    if (source === "dzisrc" && !node.info?.sourceManagers?.includes("deezer")) {
      throw new Error("Lavalink Node has not 'deezer' enabled, which is required to have 'dzisrc' work");
    }
    if (source === "dzsearch" && !node.info?.sourceManagers?.includes("deezer")) {
      throw new Error("Lavalink Node has not 'deezer' enabled, which is required to have 'dzsearch' work");
    }
    if (source === "dzisrc" && node.info?.sourceManagers?.includes("deezer") && !node.info?.sourceManagers?.includes("http")) {
      throw new Error("Lavalink Node has not 'http' enabled, which is required to have 'dzisrc' to work");
    }
    if (source === "jsrec" && !node.info?.sourceManagers?.includes("jiosaavn")) {
      throw new Error("Lavalink Node has not 'jiosaavn' (via jiosaavn-plugin) enabled, which is required to have 'jsrec' to work");
    }
    if (source === "jssearch" && !node.info?.sourceManagers?.includes("jiosaavn")) {
      throw new Error("Lavalink Node has not 'jiosaavn' (via jiosaavn-plugin) enabled, which is required to have 'jssearch' to work");
    }
    if (source === "scsearch" && !node.info?.sourceManagers?.includes("soundcloud")) {
      throw new Error("Lavalink Node has not 'soundcloud' enabled, which is required to have 'scsearch' work");
    }
    if (source === "speak" && !node.info?.plugins?.find((c) => c.name.toLowerCase().includes(LavalinkPlugins.DuncteBot_Plugin.toLowerCase()))) {
      throw new Error("Lavalink Node has not 'speak' enabled, which is required to have 'speak' work");
    }
    if (source === "tdsearch" && !node.info?.sourceManagers?.includes("tidal")) {
      throw new Error("Lavalink Node has not 'tidal' enabled, which is required to have 'tdsearch' work");
    }
    if (source === "tdrec" && !node.info?.sourceManagers?.includes("tidal")) {
      throw new Error("Lavalink Node has not 'tidal' enabled, which is required to have 'tdrec' work");
    }
    if (source === "tts" && !node.info?.plugins?.find((c) => c.name.toLowerCase().includes(LavalinkPlugins.GoogleCloudTTS.toLowerCase()))) {
      throw new Error("Lavalink Node has not 'tts' enabled, which is required to have 'tts' work");
    }
    if (source === "ftts" && !(node.info?.sourceManagers?.includes("ftts") || node.info?.sourceManagers?.includes("flowery-tts") || node.info?.sourceManagers?.includes("flowerytts"))) {
      throw new Error("Lavalink Node has not 'flowery-tts' enabled, which is required to have 'ftts' work");
    }
    if (source === "ymsearch" && !node.info?.sourceManagers?.includes("yandexmusic")) {
      throw new Error("Lavalink Node has not 'yandexmusic' enabled, which is required to have 'ymsearch' work");
    }
    if (source === "ytmsearch" && !node.info.sourceManagers?.includes("youtube")) {
      throw new Error("Lavalink Node has not 'youtube' enabled, which is required to have 'ytmsearch' work");
    }
    if (source === "ytsearch" && !node.info?.sourceManagers?.includes("youtube")) {
      throw new Error("Lavalink Node has not 'youtube' enabled, which is required to have 'ytsearch' work");
    }
    if (source === "vksearch" && !node.info?.sourceManagers?.includes("vkmusic")) {
      throw new Error("Lavalink Node has not 'vkmusic' enabled, which is required to have 'vksearch' work");
    }
    if (source === "vkrec" && !node.info?.sourceManagers?.includes("vkmusic")) {
      throw new Error("Lavalink Node has not 'vkmusic' enabled, which is required to have 'vkrec' work");
    }
    if (source === "qbsearch" && !node.info?.sourceManagers?.includes("qobuz")) {
      throw new Error("Lavalink Node has not 'qobuz' enabled, which is required to have 'qbsearch' work");
    }
    if (source === "qbisrc" && !node.info?.sourceManagers?.includes("qobuz")) {
      throw new Error("Lavalink Node has not 'qobuz' enabled, which is required to have 'qbisrc' work");
    }
    if (source === "qbrec" && !node.info?.sourceManagers?.includes("qobuz")) {
      throw new Error("Lavalink Node has not 'qobuz' enabled, which is required to have 'qbrec' work");
    }
    return;
  }
};
var MiniMap = class extends Map {
  constructor(data = []) {
    super(data);
  }
  filter(fn, thisArg) {
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const results = new this.constructor[Symbol.species]();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }
  toJSON() {
    return [...this.entries()];
  }
  map(fn, thisArg) {
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const iter = this.entries();
    return Array.from({ length: this.size }, () => {
      const [key, value] = iter.next().value;
      return fn(value, key, this);
    });
  }
};
async function queueTrackEnd(player, dontShiftQueue = false) {
  if (player.queue.current && !player.queue.current?.pluginInfo?.clientData?.previousTrack) {
    player.queue.previous.unshift(player.queue.current);
    if (player.queue.previous.length > player.queue.options.maxPreviousTracks) player.queue.previous.splice(player.queue.options.maxPreviousTracks, player.queue.previous.length);
    await player.queue.utils.save();
  }
  if (player.repeatMode === "queue" && player.queue.current) player.queue.tracks.push(player.queue.current);
  const nextSong = dontShiftQueue ? null : player.queue.tracks.shift();
  try {
    if (nextSong && player.LavalinkManager.utils.isUnresolvedTrack(nextSong)) await nextSong.resolve(player);
    player.queue.current = nextSong || null;
    await player.queue.utils.save();
  } catch (error) {
    if (player.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
      player.LavalinkManager.emit("debug", "PlayerPlayUnresolvedTrackFailed" /* PlayerPlayUnresolvedTrackFailed */, {
        state: "error",
        error,
        message: `queueTrackEnd Util was called, tried to resolve the next track, but failed to find the closest matching song`,
        functionLayer: "Player > play() > resolve currentTrack"
      });
    }
    player.LavalinkManager.emit("trackError", player, player.queue.current, error);
    if (!dontShiftQueue && player.LavalinkManager.options?.autoSkipOnResolveError === true && player.queue.tracks[0]) return queueTrackEnd(player);
  }
  return player.queue.current;
}
async function applyUnresolvedData(resTrack, data, utils) {
  if (!resTrack?.info || !data?.info) return;
  if (data.info.uri) resTrack.info.uri = data.info.uri;
  if (utils?.LavalinkManager?.options?.playerOptions?.useUnresolvedData === true) {
    if (data.info.artworkUrl?.length) resTrack.info.artworkUrl = data.info.artworkUrl;
    if (data.info.title?.length) resTrack.info.title = data.info.title;
    if (data.info.author?.length) resTrack.info.author = data.info.author;
  } else {
    if ((resTrack.info.title === "Unknown title" || resTrack.info.title === "Unspecified description") && resTrack.info.title != data.info.title) resTrack.info.title = data.info.title;
    if (resTrack.info.author !== data.info.author) resTrack.info.author = data.info.author;
    if (resTrack.info.artworkUrl !== data.info.artworkUrl) resTrack.info.artworkUrl = data.info.artworkUrl;
  }
  for (const key of Object.keys(data.info)) if (typeof resTrack.info[key] === "undefined" && key !== "resolve" && data.info[key]) resTrack.info[key] = data.info[key];
  return resTrack;
}
async function getClosestTrack(data, player) {
  if (!player || !player.node) throw new RangeError("No player with a lavalink node was provided");
  if (player.LavalinkManager.utils.isTrack(data)) return player.LavalinkManager.utils.buildTrack(data, data.requester);
  if (!player.LavalinkManager.utils.isUnresolvedTrack(data)) throw new RangeError("Track is not an unresolved Track");
  if (!data?.info?.title && typeof data.encoded !== "string" && !data.info.uri) throw new SyntaxError("the track uri / title / encoded Base64 string is required for unresolved tracks");
  if (!data.requester) throw new SyntaxError("The requester is required");
  if (typeof data.encoded === "string") {
    const r = await player.node.decode.singleTrack(data.encoded, data.requester);
    if (r) return applyUnresolvedData(r, data, player.LavalinkManager.utils);
  }
  if (typeof data.info.uri === "string") {
    const r = await player.search({ query: data?.info?.uri }, data.requester).then((v) => v.tracks?.[0]);
    if (r) return applyUnresolvedData(r, data, player.LavalinkManager.utils);
  }
  const query = [data.info?.title, data.info?.author].filter((str) => !!str).join(" by ");
  const sourceName = data.info?.sourceName;
  return await player.search({
    query,
    source: sourceName !== "twitch" && sourceName !== "flowery-tts" ? sourceName : player.LavalinkManager.options?.playerOptions?.defaultSearchPlatform
  }, data.requester).then((res) => {
    let trackToUse = null;
    if (data.info.author && !trackToUse) trackToUse = res.tracks.find((track) => [data.info?.author || "", `${data.info?.author} - Topic`].some((name) => new RegExp(`^${escapeRegExp(name)}$`, "i").test(track.info?.author)) || new RegExp(`^${escapeRegExp(data.info?.title)}$`, "i").test(track.info?.title));
    if (data.info.duration && !trackToUse) trackToUse = res.tracks.find((track) => track.info?.duration >= data.info?.duration - 1500 && track?.info.duration <= data.info?.duration + 1500);
    if (data.info.isrc && !trackToUse) trackToUse = res.tracks.find((track) => track.info?.isrc === data.info?.isrc);
    return applyUnresolvedData(trackToUse || res.tracks[0], data, player.LavalinkManager.utils);
  });
}
function safeStringify(obj, padding = 0) {
  const seen = /* @__PURE__ */ new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "function") return void 0;
    if (typeof value === "symbol") return void 0;
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  }, padding);
}

// src/structures/Node.ts
var LavalinkNode = class {
  heartBeatPingTimestamp = 0;
  heartBeatPongTimestamp = 0;
  get heartBeatPing() {
    return this.heartBeatPongTimestamp - this.heartBeatPingTimestamp;
  }
  heartBeatInterval;
  pingTimeout;
  isAlive = false;
  /** The provided Options of the Node */
  options;
  /** The amount of rest calls the node has made. */
  calls = 0;
  /** Stats from lavalink, will be updated via an interval by lavalink. */
  stats = {
    players: 0,
    playingPlayers: 0,
    cpu: {
      cores: 0,
      lavalinkLoad: 0,
      systemLoad: 0
    },
    memory: {
      allocated: 0,
      free: 0,
      reservable: 0,
      used: 0
    },
    uptime: 0,
    frameStats: {
      deficit: 0,
      nulled: 0,
      sent: 0
    }
  };
  /** The current sessionId, only present when connected */
  sessionId = null;
  /** Wether the node resuming is enabled or not */
  resuming = { enabled: true, timeout: null };
  /** Actual Lavalink Information of the Node */
  info = null;
  /** The Node Manager of this Node */
  NodeManager = null;
  /** The Reconnection Timeout */
  reconnectTimeout = void 0;
  /** The Reconnection Attempt counter */
  reconnectAttempts = 1;
  /** The Socket of the Lavalink */
  socket = null;
  /** Version of what the Lavalink Server should be */
  version = "v4";
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
  constructor(options, manager) {
    this.options = {
      secure: false,
      retryAmount: 5,
      retryDelay: 1e4,
      requestSignalTimeoutMS: 1e4,
      heartBeatInterval: 3e4,
      closeOnError: true,
      enablePingOnStatsCheck: true,
      ...options
    };
    this.NodeManager = manager;
    this.validate();
    if (this.options.secure && this.options.port !== 443) throw new SyntaxError("If secure is true, then the port must be 443");
    this.options.regions = (this.options.regions || []).map((a) => a.toLowerCase());
    Object.defineProperty(this, NodeSymbol, { configurable: true, value: true });
  }
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
  async rawRequest(endpoint, modify) {
    const options = {
      path: `/${this.version}/${endpoint.startsWith("/") ? endpoint.slice(1) : endpoint}`,
      method: "GET",
      headers: {
        "Authorization": this.options.authorization
      },
      signal: this.options.requestSignalTimeoutMS && this.options.requestSignalTimeoutMS > 0 ? AbortSignal.timeout(this.options.requestSignalTimeoutMS) : void 0
    };
    modify?.(options);
    const url = new URL(`${this.restAddress}${options.path}`);
    url.searchParams.append("trace", "true");
    if (options.extraQueryUrlParams && options.extraQueryUrlParams?.size > 0) {
      for (const [paramKey, paramValue] of options.extraQueryUrlParams.entries()) {
        url.searchParams.append(paramKey, paramValue);
      }
    }
    const urlToUse = url.toString();
    const { path, extraQueryUrlParams, ...fetchOptions } = options;
    const response = await fetch(urlToUse, fetchOptions);
    this.calls++;
    return { response, options };
  }
  async request(endpoint, modify, parseAsText) {
    if (!this.connected) throw new Error("The node is not connected to the Lavalink Server!, Please call node.connect() first!");
    const { response, options } = await this.rawRequest(endpoint, modify);
    if (["DELETE", "PUT"].includes(options.method)) return;
    if (response.status === 204) return;
    if (response.status === 404) throw new Error(`Node Request resulted into an error, request-PATH: ${options.path} | headers: ${safeStringify(response.headers)}`);
    return parseAsText ? await response.text() : await response.json();
  }
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
  async search(query, requestUser, throwOnEmpty = false) {
    const Query = this.NodeManager.LavalinkManager.utils.transformQuery(query);
    this.NodeManager.LavalinkManager.utils.validateQueryString(this, Query.query, Query.source);
    if (Query.source) this.NodeManager.LavalinkManager.utils.validateSourceString(this, Query.source);
    if (["bcsearch", "bandcamp"].includes(Query.source) && !this.info.sourceManagers.includes("bandcamp")) {
      throw new Error("Bandcamp Search only works on the player (lavaplayer version < 2.2.0!");
    }
    const requestUrl = new URL(`${this.restAddress}/loadtracks`);
    if (/^https?:\/\//.test(Query.query) || ["http", "https", "link", "uri"].includes(Query.source)) {
      requestUrl.searchParams.append("identifier", Query.query);
    } else {
      const fttsPrefix = Query.source === "ftts" ? "//" : "";
      const prefix = Query.source !== "local" ? `${Query.source}:${fttsPrefix}` : "";
      requestUrl.searchParams.append("identifier", `${prefix}${Query.query}`);
    }
    const requestPathAndSearch = requestUrl.pathname + requestUrl.search;
    const res = await this.request(requestPathAndSearch, (options) => {
      if (typeof query === "object" && typeof query.extraQueryUrlParams?.size === "number" && query.extraQueryUrlParams?.size > 0) {
        options.extraQueryUrlParams = query.extraQueryUrlParams;
      }
    });
    const resTracks = res.loadType === "playlist" ? res.data?.tracks : res.loadType === "track" ? [res.data] : res.loadType === "search" ? Array.isArray(res.data) ? res.data : [res.data] : [];
    if (throwOnEmpty === true && (res.loadType === "empty" || !resTracks.length)) {
      if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.NodeManager.LavalinkManager.emit("debug", "SearchNothingFound" /* SearchNothingFound */, {
          state: "warn",
          message: `Search found nothing for Request: "${Query.source ? `${Query.source}:` : ""}${Query.query}"`,
          functionLayer: "(LavalinkNode > node | player) > search()"
        });
      }
      throw new Error("Nothing found");
    }
    return {
      loadType: res.loadType,
      exception: res.loadType === "error" ? res.data : null,
      pluginInfo: res.pluginInfo || {},
      playlist: res.loadType === "playlist" ? {
        name: res.data.info?.name || res.data.pluginInfo?.name || null,
        title: res.data.info?.name || res.data.pluginInfo?.name || null,
        author: res.data.info?.author || res.data.pluginInfo?.author || null,
        thumbnail: res.data.info?.artworkUrl || res.data.pluginInfo?.artworkUrl || (typeof res.data?.info?.selectedTrack !== "number" || res.data?.info?.selectedTrack === -1 ? null : resTracks[res.data?.info?.selectedTrack] ? resTracks[res.data?.info?.selectedTrack]?.info?.artworkUrl || resTracks[res.data?.info?.selectedTrack]?.info?.pluginInfo?.artworkUrl : null) || null,
        uri: res.data.info?.url || res.data.info?.uri || res.data.info?.link || res.data.pluginInfo?.url || res.data.pluginInfo?.uri || res.data.pluginInfo?.link || null,
        selectedTrack: typeof res.data?.info?.selectedTrack !== "number" || res.data?.info?.selectedTrack === -1 ? null : resTracks[res.data?.info?.selectedTrack] ? this.NodeManager.LavalinkManager.utils.buildTrack(resTracks[res.data?.info?.selectedTrack], requestUser) : null,
        duration: resTracks.length ? resTracks.reduce((acc, cur) => acc + (cur?.info?.duration || cur?.info?.length || 0), 0) : 0
      } : null,
      tracks: resTracks.length ? resTracks.map((t) => this.NodeManager.LavalinkManager.utils.buildTrack(t, requestUser)) : []
    };
  }
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
  async lavaSearch(query, requestUser, throwOnEmpty = false) {
    const Query = this.NodeManager.LavalinkManager.utils.transformLavaSearchQuery(query);
    if (Query.source) this.NodeManager.LavalinkManager.utils.validateSourceString(this, Query.source);
    if (/^https?:\/\//.test(Query.query)) return this.search({ query: Query.query, source: Query.source }, requestUser);
    if (!["spsearch", "sprec", "amsearch", "dzsearch", "dzisrc", "ytmsearch", "ytsearch"].includes(Query.source)) throw new SyntaxError(`Query.source must be a source from LavaSrc: "spsearch" | "sprec" | "amsearch" | "dzsearch" | "dzisrc" | "ytmsearch" | "ytsearch"`);
    if (!this.info.plugins.find((v) => v.name === "lavasearch-plugin")) throw new RangeError(`there is no lavasearch-plugin available in the lavalink node: ${this.id}`);
    if (!this.info.plugins.find((v) => v.name === "lavasrc-plugin")) throw new RangeError(`there is no lavasrc-plugin available in the lavalink node: ${this.id}`);
    const { response } = await this.rawRequest(`/loadsearch?query=${Query.source ? `${Query.source}:` : ""}${encodeURIComponent(Query.query)}${Query.types?.length ? `&types=${Query.types.join(",")}` : ""}`);
    const res = response.status === 204 ? {} : await response.json();
    if (throwOnEmpty === true && !Object.entries(res).flat().filter(Boolean).length) {
      if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.NodeManager.LavalinkManager.emit("debug", "LavaSearchNothingFound" /* LavaSearchNothingFound */, {
          state: "warn",
          message: `LavaSearch found nothing for Request: "${Query.source ? `${Query.source}:` : ""}${Query.query}"`,
          functionLayer: "(LavalinkNode > node | player) > lavaSearch()"
        });
      }
      throw new Error("Nothing found");
    }
    return {
      tracks: res.tracks?.map((v) => this.NodeManager.LavalinkManager.utils.buildTrack(v, requestUser)) || [],
      albums: res.albums?.map((v) => ({ info: v.info, pluginInfo: v?.plugin || v.pluginInfo, tracks: v.tracks.map((v2) => this.NodeManager.LavalinkManager.utils.buildTrack(v2, requestUser)) })) || [],
      artists: res.artists?.map((v) => ({ info: v.info, pluginInfo: v?.plugin || v.pluginInfo, tracks: v.tracks.map((v2) => this.NodeManager.LavalinkManager.utils.buildTrack(v2, requestUser)) })) || [],
      playlists: res.playlists?.map((v) => ({ info: v.info, pluginInfo: v?.plugin || v.pluginInfo, tracks: v.tracks.map((v2) => this.NodeManager.LavalinkManager.utils.buildTrack(v2, requestUser)) })) || [],
      texts: res.texts?.map((v) => ({ text: v.text, pluginInfo: v?.plugin || v.pluginInfo })) || [],
      pluginInfo: res.pluginInfo || res?.plugin
    };
  }
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
  async updatePlayer(data) {
    if (!this.sessionId) throw new Error("The Lavalink Node is either not ready, or not up to date!");
    this.syncPlayerData(data);
    const res = await this.request(`/sessions/${this.sessionId}/players/${data.guildId}`, (r) => {
      r.method = "PATCH";
      r.headers["Content-Type"] = "application/json";
      r.body = safeStringify(data.playerOptions);
      if (data.noReplace) {
        const url = new URL(`${this.restAddress}${r.path}`);
        url.searchParams.append("noReplace", data.noReplace === true && typeof data.noReplace === "boolean" ? "true" : "false");
        r.path = url.pathname + url.search;
      }
    });
    if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
      this.NodeManager.LavalinkManager.emit("debug", "PlayerUpdateSuccess" /* PlayerUpdateSuccess */, {
        state: "log",
        message: `Player get's updated with following payload :: ${safeStringify(data.playerOptions, 3)}`,
        functionLayer: "LavalinkNode > node > updatePlayer()"
      });
    }
    this.syncPlayerData({}, res);
    return res;
  }
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
  async destroyPlayer(guildId) {
    if (!this.sessionId) throw new Error("The Lavalink-Node is either not ready, or not up to date!");
    return this.request(`/sessions/${this.sessionId}/players/${guildId}`, (r) => {
      r.method = "DELETE";
    });
  }
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
  connect(sessionId) {
    if (this.connected) {
      if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.NodeManager.LavalinkManager.emit("debug", "TryingConnectWhileConnected" /* TryingConnectWhileConnected */, {
          state: "warn",
          message: `Tryed to connect to node, but it's already connected!`,
          functionLayer: "LavalinkNode > node > connect()"
        });
      }
      return;
    }
    const headers = {
      Authorization: this.options.authorization,
      "User-Id": this.NodeManager.LavalinkManager.options.client.id,
      "Client-Name": this.NodeManager.LavalinkManager.options.client.username || "Nazha-Client"
    };
    if (typeof this.options.sessionId === "string" || typeof sessionId === "string") {
      headers["Session-Id"] = this.options.sessionId || sessionId;
      this.sessionId = this.options.sessionId || sessionId;
    }
    this.socket = new WebSocket(`ws${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/v4/websocket`, { headers });
    this.socket.on("open", this.open.bind(this));
    this.socket.on("close", (code, reason) => this.close(code, reason?.toString()));
    this.socket.on("message", this.message.bind(this));
    this.socket.on("error", this.error.bind(this));
  }
  heartBeat() {
    if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
      this.NodeManager.LavalinkManager.emit("debug", "HeartBeatTriggered" /* HeartBeatTriggered */, {
        state: "log",
        message: `Node Socket Heartbeat triggered, resetting old Timeout to 65000ms (should happen every 60s due to /stats event)`,
        functionLayer: "LavalinkNode > nodeEvent > stats > heartBeat()"
      });
    }
    if (this.pingTimeout) clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
      this.pingTimeout = null;
      if (!this.socket) {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "NoSocketOnDestroy" /* NoSocketOnDestroy */, {
            state: "error",
            message: `Heartbeat registered a disconnect, but socket didn't exist therefore can't terminate`,
            functionLayer: "LavalinkNode > nodeEvent > stats > heartBeat() > timeoutHit"
          });
        }
        return;
      }
      if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.NodeManager.LavalinkManager.emit("debug", "SocketTerminateHeartBeatTimeout" /* SocketTerminateHeartBeatTimeout */, {
          state: "warn",
          message: `Heartbeat registered a disconnect, because timeout wasn't resetted in time. Terminating Web-Socket`,
          functionLayer: "LavalinkNode > nodeEvent > stats > heartBeat() > timeoutHit"
        });
      }
      this.isAlive = false;
      this.socket.terminate();
    }, 65e3);
  }
  /**
   * Get the id of the node
   *
   * @example
   * ```ts
   * const nodeId = player.node.id;
   * console.log("node id is: ", nodeId)
   * ```
   */
  get id() {
    return this.options.id || `${this.options.host}:${this.options.port}`;
  }
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
  destroy(destroyReason, deleteNode = true, movePlayers = false) {
    const players = this.NodeManager.LavalinkManager.players.filter((p) => p.node.id === this.id);
    if (players.size) {
      const enableDebugEvents = this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents;
      const handlePlayerOperations = () => {
        if (movePlayers) {
          const nodeToMove = Array.from(this.NodeManager.leastUsedNodes("playingPlayers")).find((n) => n.connected && n.options.id !== this.id);
          if (nodeToMove) {
            return Promise.allSettled(Array.from(players.values()).map(
              (player) => player.changeNode(nodeToMove.options.id).catch((error) => {
                if (enableDebugEvents) {
                  console.error(`Node > destroy() Failed to move player ${player.guildId}: ${error.message}`);
                }
                return player.destroy(error.message ?? "PlayerChangeNodeFail" /* PlayerChangeNodeFail */).catch((destroyError) => {
                  if (enableDebugEvents) {
                    console.error(`Node > destroy() Failed to destroy player ${player.guildId} after move failure: ${destroyError.message}`);
                  }
                });
              })
            ));
          } else {
            return Promise.allSettled(Array.from(players.values()).map(
              (player) => player.destroy("PlayerChangeNodeFailNoEligibleNode" /* PlayerChangeNodeFailNoEligibleNode */).catch((error) => {
                if (enableDebugEvents) {
                  console.error(`Node > destroy() Failed to destroy player ${player.guildId}: ${error.message}`);
                }
              })
            ));
          }
        } else {
          return Promise.allSettled(Array.from(players.values()).map(
            (player) => player.destroy(destroyReason || "NodeDestroy" /* NodeDestroy */).catch((error) => {
              if (enableDebugEvents) {
                console.error(`Node > destroy() Failed to destroy player ${player.guildId}: ${error.message}`);
              }
            })
          ));
        }
      };
      handlePlayerOperations().finally(() => {
        this.socket.close(1e3, "Node-Destroy");
        this.socket.removeAllListeners();
        this.socket = null;
        this.reconnectAttempts = 1;
        clearTimeout(this.reconnectTimeout);
        if (deleteNode) {
          this.NodeManager.emit("destroy", this, destroyReason);
          this.NodeManager.nodes.delete(this.id);
          clearInterval(this.heartBeatInterval);
          clearTimeout(this.pingTimeout);
        } else {
          this.NodeManager.emit("disconnect", this, { code: 1e3, reason: destroyReason });
        }
      });
    } else {
      this.socket.close(1e3, "Node-Destroy");
      this.socket.removeAllListeners();
      this.socket = null;
      this.reconnectAttempts = 1;
      clearTimeout(this.reconnectTimeout);
      if (deleteNode) {
        this.NodeManager.emit("destroy", this, destroyReason);
        this.NodeManager.nodes.delete(this.id);
        clearInterval(this.heartBeatInterval);
        clearTimeout(this.pingTimeout);
      } else {
        this.NodeManager.emit("disconnect", this, { code: 1e3, reason: destroyReason });
      }
    }
    return;
  }
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
  disconnect(disconnectReason) {
    if (!this.connected) return;
    this.socket.close(1e3, "Node-Disconnect");
    this.socket.removeAllListeners();
    this.socket = null;
    this.reconnectAttempts = 1;
    clearTimeout(this.reconnectTimeout);
    this.NodeManager.emit("disconnect", this, { code: 1e3, reason: disconnectReason });
  }
  /**
   * Returns if connected to the Node.
   *
   * @example
   * ```ts
   * const isConnected = player.node.connected;
   * console.log("node is connected: ", isConnected ? "yes" : "no")
   * ```
   */
  get connected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
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
  get connectionStatus() {
    if (!this.socket) throw new Error("no websocket was initialized yet");
    return ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][this.socket.readyState] || "UNKNOWN";
  }
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
  async fetchAllPlayers() {
    if (!this.sessionId) throw new Error("The Lavalink-Node is either not ready, or not up to date!");
    return this.request(`/sessions/${this.sessionId}/players`) || [];
  }
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
  async fetchPlayer(guildId) {
    if (!this.sessionId) throw new Error("The Lavalink-Node is either not ready, or not up to date!");
    return this.request(`/sessions/${this.sessionId}/players/${guildId}`);
  }
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
  async updateSession(resuming, timeout) {
    if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
    const data = {};
    if (typeof resuming === "boolean") data.resuming = resuming;
    if (typeof timeout === "number" && timeout > 0) data.timeout = timeout;
    this.resuming = {
      enabled: typeof resuming === "boolean" ? resuming : false,
      timeout: typeof resuming === "boolean" && resuming === true ? timeout : null
    };
    return this.request(`/sessions/${this.sessionId}`, (r) => {
      r.method = "PATCH";
      r.headers = { Authorization: this.options.authorization, "Content-Type": "application/json" };
      r.body = safeStringify(data);
    });
  }
  /**
   * Decode Track or Tracks
   */
  decode = {
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
    singleTrack: async (encoded, requester) => {
      if (!encoded) throw new SyntaxError("No encoded (Base64 string) was provided");
      return this.NodeManager.LavalinkManager.utils?.buildTrack(await this.request(`/decodetrack?encodedTrack=${encodeURIComponent(encoded.replace(/\s/g, ""))}`), requester);
    },
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
    multipleTracks: async (encodeds, requester) => {
      if (!Array.isArray(encodeds) || !encodeds.every((v) => typeof v === "string" && v.length > 1)) throw new SyntaxError("You need to provide encodeds, which is an array of base64 strings");
      return await this.request(`/decodetracks`, (r) => {
        r.method = "POST";
        r.body = safeStringify(encodeds);
        r.headers["Content-Type"] = "application/json";
      }).then((r) => r.map((track) => this.NodeManager.LavalinkManager.utils.buildTrack(track, requester)));
    }
  };
  lyrics = {
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
    get: async (track, skipTrackSource = false) => {
      if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
      if (!this.info.plugins.find((v) => v.name === "lavalyrics-plugin")) throw new RangeError(`there is no lavalyrics-plugin available in the lavalink node (required for lyrics): ${this.id}`);
      if (!this.info.plugins.find((v) => v.name === "lavasrc-plugin") && !this.info.plugins.find((v) => v.name === "java-lyrics-plugin")) throw new RangeError(`there is no lyrics source (via lavasrc-plugin / java-lyrics-plugin) available in the lavalink node (required for lyrics): ${this.id}`);
      const url = `/lyrics?track=${track.encoded}&skipTrackSource=${skipTrackSource}`;
      return await this.request(url);
    },
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
    getCurrent: async (guildId, skipTrackSource = false) => {
      if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
      if (!this.info.plugins.find((v) => v.name === "lavalyrics-plugin")) throw new RangeError(`there is no lavalyrics-plugin available in the lavalink node (required for lyrics): ${this.id}`);
      if (!this.info.plugins.find((v) => v.name === "lavasrc-plugin") && !this.info.plugins.find((v) => v.name === "java-lyrics-plugin")) throw new RangeError(`there is no lyrics source (via lavasrc-plugin / java-lyrics-plugin) available in the lavalink node (required for lyrics): ${this.id}`);
      const url = `/sessions/${this.sessionId}/players/${guildId}/track/lyrics?skipTrackSource=${skipTrackSource}`;
      return await this.request(url);
    },
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
    subscribe: async (guildId) => {
      if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
      if (!this.info.plugins.find((v) => v.name === "lavalyrics-plugin")) throw new RangeError(`there is no lavalyrics-plugin available in the lavalink node (required for lyrics): ${this.id}`);
      if (!this.info.plugins.find((v) => v.name === "lavasrc-plugin") && !this.info.plugins.find((v) => v.name === "java-lyrics-plugin")) throw new RangeError(`there is no lyrics source (via lavasrc-plugin / java-lyrics-plugin) available in the lavalink node (required for lyrics): ${this.id}`);
      return await this.request(`/sessions/${this.sessionId}/players/${guildId}/lyrics/subscribe`, (options) => {
        options.method = "POST";
      });
    },
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
    unsubscribe: async (guildId) => {
      if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
      if (!this.info.plugins.find((v) => v.name === "lavalyrics-plugin")) throw new RangeError(`there is no lavalyrics-plugin available in the lavalink node (required for lyrics): ${this.id}`);
      if (!this.info.plugins.find((v) => v.name === "lavasrc-plugin") && !this.info.plugins.find((v) => v.name === "java-lyrics-plugin")) throw new RangeError(`there is no lyrics source (via lavasrc-plugin / java-lyrics-plugin) available in the lavalink node (required for lyrics): ${this.id}`);
      return await this.request(`/sessions/${this.sessionId}/players/${guildId}/lyrics/subscribe`, (options) => {
        options.method = "DELETE";
      });
    }
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
  async fetchStats() {
    return await this.request(`/stats`);
  }
  /**
   * Request Lavalink version.
   * @returns the current used lavalink version
   *
   * @example
   * ```ts
   * const lavalinkVersion = await player.node.fetchVersion();
   * ```
   */
  async fetchVersion() {
    return await this.request(`/version`, (r) => {
      r.path = "/version";
    }, true);
  }
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
  async fetchInfo() {
    return await this.request(`/info`);
  }
  /**
   * Lavalink's Route Planner Api
   */
  routePlannerApi = {
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
    getStatus: async () => {
      if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
      return await this.request(`/routeplanner/status`);
    },
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
    unmarkFailedAddress: async (address) => {
      if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
      return await this.request(`/routeplanner/free/address`, (r) => {
        r.method = "POST";
        r.headers["Content-Type"] = "application/json";
        r.body = safeStringify({ address });
      });
    },
    /**
     * Release all blacklisted IP addresses into pool of IPs
     * @returns request data of the request
     *
     * @example
     * ```ts
     * await player.node.routePlannerApi.unmarkAllFailedAddresses();
     * ```
     */
    unmarkAllFailedAddresses: async () => {
      if (!this.sessionId) throw new Error("the Lavalink-Node is either not ready, or not up to date!");
      return await this.request(`/routeplanner/free/all`, (r) => {
        r.method = "POST";
        r.headers["Content-Type"] = "application/json";
      });
    }
  };
  /** @private Utils for validating the */
  validate() {
    if (!this.options.authorization) throw new SyntaxError("LavalinkNode requires 'authorization'");
    if (!this.options.host) throw new SyntaxError("LavalinkNode requires 'host'");
    if (!this.options.port) throw new SyntaxError("LavalinkNode requires 'port'");
  }
  /**
   * Sync the data of the player you make an action to lavalink to
   * @param data data to use to update the player
   * @param res result data from lavalink, to override, if available
   * @returns boolean
   */
  syncPlayerData(data, res) {
    if (typeof data === "object" && typeof data?.guildId === "string" && typeof data.playerOptions === "object" && Object.keys(data.playerOptions).length > 0) {
      const player = this.NodeManager.LavalinkManager.getPlayer(data.guildId);
      if (!player) return;
      if (typeof data.playerOptions.paused !== "undefined") {
        player.paused = data.playerOptions.paused;
        player.playing = !data.playerOptions.paused;
      }
      if (typeof data.playerOptions.position === "number") {
        player.lastPosition = data.playerOptions.position;
        player.lastPositionChange = Date.now();
      }
      if (typeof data.playerOptions.voice !== "undefined") player.voice = data.playerOptions.voice;
      if (typeof data.playerOptions.volume !== "undefined") {
        if (this.NodeManager.LavalinkManager.options.playerOptions.volumeDecrementer) {
          player.volume = Math.round(data.playerOptions.volume / this.NodeManager.LavalinkManager.options.playerOptions.volumeDecrementer);
          player.lavalinkVolume = Math.round(data.playerOptions.volume);
        } else {
          player.volume = Math.round(data.playerOptions.volume);
          player.lavalinkVolume = Math.round(data.playerOptions.volume);
        }
      }
      if (typeof data.playerOptions.filters !== "undefined") {
        const oldFilterTimescale = { ...player.filterManager.data.timescale };
        Object.freeze(oldFilterTimescale);
        if (data.playerOptions.filters.timescale) player.filterManager.data.timescale = data.playerOptions.filters.timescale;
        if (data.playerOptions.filters.distortion) player.filterManager.data.distortion = data.playerOptions.filters.distortion;
        if (data.playerOptions.filters.pluginFilters) player.filterManager.data.pluginFilters = data.playerOptions.filters.pluginFilters;
        if (data.playerOptions.filters.vibrato) player.filterManager.data.vibrato = data.playerOptions.filters.vibrato;
        if (data.playerOptions.filters.volume) player.filterManager.data.volume = data.playerOptions.filters.volume;
        if (data.playerOptions.filters.equalizer) player.filterManager.equalizerBands = data.playerOptions.filters.equalizer;
        if (data.playerOptions.filters.karaoke) player.filterManager.data.karaoke = data.playerOptions.filters.karaoke;
        if (data.playerOptions.filters.lowPass) player.filterManager.data.lowPass = data.playerOptions.filters.lowPass;
        if (data.playerOptions.filters.rotation) player.filterManager.data.rotation = data.playerOptions.filters.rotation;
        if (data.playerOptions.filters.tremolo) player.filterManager.data.tremolo = data.playerOptions.filters.tremolo;
        player.filterManager.checkFiltersState(oldFilterTimescale);
      }
    }
    if (res?.guildId === "string" && typeof res?.voice !== "undefined") {
      const player = this.NodeManager.LavalinkManager.getPlayer(data.guildId);
      if (!player) return;
      if (typeof res?.voice?.connected === "boolean" && res.voice.connected === false) {
        player.destroy("LavalinkNoVoice" /* LavalinkNoVoice */);
        return;
      }
      player.ping.ws = res?.voice?.ping || player?.ping.ws;
    }
    return;
  }
  /**
   * Get the rest Adress for making requests
   */
  get restAddress() {
    return `http${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}`;
  }
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
  reconnect(instaReconnect = false) {
    this.NodeManager.emit("reconnectinprogress", this);
    if (instaReconnect) {
      if (this.reconnectAttempts >= this.options.retryAmount) {
        const error = new Error(`Unable to connect after ${this.options.retryAmount} attempts.`);
        this.NodeManager.emit("error", this, error);
        return this.destroy("NodeReconnectFail" /* NodeReconnectFail */);
      }
      this.socket.removeAllListeners();
      this.socket = null;
      this.NodeManager.emit("reconnecting", this);
      this.connect();
      this.reconnectAttempts++;
      return;
    }
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.reconnectAttempts >= this.options.retryAmount) {
        const error = new Error(`Unable to connect after ${this.options.retryAmount} attempts.`);
        this.NodeManager.emit("error", this, error);
        return this.destroy("NodeReconnectFail" /* NodeReconnectFail */);
      }
      this.socket.removeAllListeners();
      this.socket = null;
      this.NodeManager.emit("reconnecting", this);
      this.connect();
      this.reconnectAttempts++;
    }, this.options.retryDelay || 1e3);
  }
  /** @private util function for handling opening events from websocket */
  async open() {
    this.isAlive = true;
    if (this.options.enablePingOnStatsCheck) this.heartBeat();
    if (this.heartBeatInterval) clearInterval(this.heartBeatInterval);
    if (this.options.heartBeatInterval > 0) {
      this.socket.on("pong", () => {
        this.heartBeatPongTimestamp = performance.now();
        this.isAlive = true;
      });
      this.heartBeatInterval = setInterval(() => {
        if (!this.socket) return console.error("Node-Heartbeat-Interval - Socket not available - maybe reconnecting?");
        if (!this.isAlive) this.close(500, "Node-Heartbeat-Timeout");
        this.isAlive = false;
        this.heartBeatPingTimestamp = performance.now();
        this.socket.ping();
      }, this.options.heartBeatInterval || 3e4);
    }
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectAttempts = 1;
    this.info = await this.fetchInfo().catch((e) => (console.error(e, "ON-OPEN-FETCH"), null));
    if (!this.info && ["v3", "v4"].includes(this.version)) {
      const errorString = `Lavalink Node (${this.restAddress}) does not provide any /${this.version}/info`;
      throw new Error(errorString);
    }
    this.NodeManager.emit("connect", this);
  }
  /** @private util function for handling closing events from websocket */
  close(code, reason) {
    if (this.pingTimeout) clearTimeout(this.pingTimeout);
    if (this.heartBeatInterval) clearInterval(this.heartBeatInterval);
    if (code === 1006 && !reason) reason = "Socket got terminated due to no ping connection";
    if (code === 1e3 && reason === "Node-Disconnect") return;
    this.NodeManager.emit("disconnect", this, { code, reason });
    if (code !== 1e3 || reason !== "Node-Destroy") {
      if (this.NodeManager.nodes.has(this.id)) {
        this.reconnect();
      }
    }
    this.NodeManager.LavalinkManager.players.filter((p) => p?.node?.options?.id === this?.options?.id).forEach((p) => {
      if (!this.NodeManager.LavalinkManager.options.autoMove) return p.playing = false;
      if (this.NodeManager.LavalinkManager.options.autoMove) {
        if (this.NodeManager.nodes.filter((n) => n.connected).size === 0)
          return p.playing = false;
        p.moveNode();
      }
    });
  }
  /** @private util function for handling error events from websocket */
  error(error) {
    if (!error) return;
    this.NodeManager.emit("error", this, error);
    if (this.options.closeOnError) {
      if (this.heartBeatInterval) clearInterval(this.heartBeatInterval);
      if (this.pingTimeout) clearTimeout(this.pingTimeout);
      this.socket?.close(500, "Node-Error - Force Reconnect");
    }
    ;
  }
  /** @private util function for handling message events from websocket */
  async message(d) {
    if (Array.isArray(d)) d = Buffer.concat(d);
    else if (d instanceof ArrayBuffer) d = Buffer.from(d);
    let payload;
    try {
      payload = JSON.parse(d.toString());
    } catch (e) {
      this.NodeManager.emit("error", this, e);
      return;
    }
    if (!payload.op) return;
    this.NodeManager.emit("raw", this, payload);
    switch (payload.op) {
      case "stats":
        if (this.options.enablePingOnStatsCheck) this.heartBeat();
        delete payload.op;
        this.stats = { ...payload };
        break;
      case "playerUpdate":
        {
          const player = this.NodeManager.LavalinkManager.getPlayer(payload.guildId);
          if (!player) {
            if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
              this.NodeManager.LavalinkManager.emit("debug", "PlayerUpdateNoPlayer" /* PlayerUpdateNoPlayer */, {
                state: "error",
                message: `PlayerUpdate Event Triggered, but no player found of payload.guildId: ${payload.guildId}`,
                functionLayer: "LavalinkNode > nodeEvent > playerUpdate"
              });
            }
            return;
          }
          const oldPlayer = player?.toJSON();
          player.lastPositionChange = Date.now();
          player.lastPosition = payload.state.position || 0;
          player.connected = payload.state.connected;
          player.ping.ws = payload.state.ping >= 0 ? payload.state.ping : player.ping.ws <= 0 && player.connected ? null : player.ping.ws || 0;
          if (!player.createdTimeStamp && payload.state.time) player.createdTimeStamp = payload.state.time;
          if (player.filterManager.filterUpdatedState === true && ((player.queue.current?.info?.duration || 0) <= (player.LavalinkManager.options.advancedOptions.maxFilterFixDuration || 6e5) || player.queue.current?.info?.uri && isAbsolute(player.queue.current?.info?.uri))) {
            player.filterManager.filterUpdatedState = false;
            if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
              this.NodeManager.LavalinkManager.emit("debug", "PlayerUpdateFilterFixApply" /* PlayerUpdateFilterFixApply */, {
                state: "log",
                message: `Fixing FilterState on "${player.guildId}" because player.options.instaUpdateFiltersFix === true`,
                functionLayer: "LavalinkNode > nodeEvent > playerUpdate"
              });
            }
            await player.seek(player.position);
          }
          this.NodeManager.LavalinkManager.emit("playerUpdate", oldPlayer, player);
        }
        break;
      case "event":
        this.handleEvent(payload);
        break;
      case "ready":
        this.sessionId = payload.sessionId;
        this.resuming.enabled = payload.resumed;
        if (payload.resumed === true) {
          try {
            this.NodeManager.emit("resumed", this, payload, await this.fetchAllPlayers());
          } catch (e) {
            if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
              this.NodeManager.LavalinkManager.emit("debug", "ResumingFetchingError" /* ResumingFetchingError */, {
                state: "error",
                message: `Failed to fetch players for resumed event, falling back without players array`,
                error: e,
                functionLayer: "LavalinkNode > nodeEvent > resumed"
              });
            }
            this.NodeManager.emit("resumed", this, payload, []);
          }
        }
        break;
      default:
        this.NodeManager.emit("error", this, new Error(`Unexpected op "${payload.op}" with data`), payload);
        return;
    }
  }
  /** @private middleware util function for handling all kind of events from websocket */
  async handleEvent(payload) {
    if (!payload?.guildId) return;
    const player = this.NodeManager.LavalinkManager.getPlayer(payload.guildId);
    if (!player) return;
    switch (payload.type) {
      case "TrackStartEvent":
        this.trackStart(player, player.queue.current, payload);
        break;
      case "TrackEndEvent":
        this.trackEnd(player, player.queue.current, payload);
        break;
      case "TrackStuckEvent":
        this.trackStuck(player, player.queue.current, payload);
        break;
      case "TrackExceptionEvent":
        this.trackError(player, player.queue.current, payload);
        break;
      case "WebSocketClosedEvent":
        this.socketClosed(player, payload);
        break;
      case "SegmentsLoaded":
        this.SponsorBlockSegmentLoaded(player, player.queue.current, payload);
        break;
      case "SegmentSkipped":
        this.SponsorBlockSegmentSkipped(player, player.queue.current, payload);
        break;
      case "ChaptersLoaded":
        this.SponsorBlockChaptersLoaded(player, player.queue.current, payload);
        break;
      case "ChapterStarted":
        this.SponsorBlockChapterStarted(player, player.queue.current, payload);
        break;
      case "LyricsLineEvent":
        this.LyricsLine(player, player.queue.current, payload);
        break;
      case "LyricsFoundEvent":
        this.LyricsFound(player, player.queue.current, payload);
        break;
      case "LyricsNotFoundEvent":
        this.LyricsNotFound(player, player.queue.current, payload);
        break;
      default:
        this.NodeManager.emit("error", this, new Error(`Node#event unknown event '${payload.type}'.`), payload);
        break;
    }
    return;
  }
  getTrackOfPayload(payload) {
    return "track" in payload ? this.NodeManager.LavalinkManager.utils.buildTrack(payload.track, void 0) : null;
  }
  /** @private util function for handling trackStart event */
  async trackStart(player, track, payload) {
    if (!player.get("internal_nodeChanging")) {
      player.playing = true;
      player.paused = false;
    }
    if (this.NodeManager.LavalinkManager.options?.emitNewSongsOnly === true && player.queue.previous[0]?.info?.identifier === track?.info?.identifier) {
      if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.NodeManager.LavalinkManager.emit("debug", "TrackStartNewSongsOnly" /* TrackStartNewSongsOnly */, {
          state: "log",
          message: `TrackStart not Emitting, because playing the previous song again.`,
          functionLayer: "LavalinkNode > trackStart()"
        });
      }
      return;
    }
    if (!player.queue.current) {
      player.queue.current = this.getTrackOfPayload(payload);
      if (player.queue.current) {
        await player.queue.utils.save();
      } else {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "TrackStartNoTrack" /* TrackStartNoTrack */, {
            state: "warn",
            message: `Trackstart emitted but there is no track on player.queue.current, trying to get the track of the payload failed too.`,
            functionLayer: "LavalinkNode > trackStart()"
          });
        }
      }
    }
    this.NodeManager.LavalinkManager.emit("trackStart", player, player.queue.current, payload);
    return;
  }
  /** @private util function for handling trackEnd event */
  async trackEnd(player, track, payload) {
    if (player.get("internal_nodeChanging") === true) return;
    const trackToUse = track || this.getTrackOfPayload(payload);
    if (payload.reason === "replaced") {
      if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.NodeManager.LavalinkManager.emit("debug", "TrackEndReplaced" /* TrackEndReplaced */, {
          state: "warn",
          message: `TrackEnd Event does not handle any playback, because the track was replaced.`,
          functionLayer: "LavalinkNode > trackEnd()"
        });
      }
      this.NodeManager.LavalinkManager.emit("trackEnd", player, trackToUse, payload);
      return;
    }
    if (!player.queue.tracks.length && (player.repeatMode === "off" || player.get("internal_stopPlaying"))) return this.queueEnd(player, track, payload);
    if (["loadFailed", "cleanup"].includes(payload.reason)) {
      if (player.get("internal_destroystatus") === true) return;
      await queueTrackEnd(player);
      if (!player.queue.current) return this.queueEnd(player, trackToUse, payload);
      this.NodeManager.LavalinkManager.emit("trackEnd", player, trackToUse, payload);
      if (this.NodeManager.LavalinkManager.options.autoSkip && player.queue.current) {
        player.play({ noReplace: true });
      }
      return;
    }
    if (player.repeatMode !== "track" || player.get("internal_skipped")) await queueTrackEnd(player);
    else if (trackToUse && !trackToUse?.pluginInfo?.clientData?.previousTrack) {
      player.queue.previous.unshift(trackToUse);
      if (player.queue.previous.length > player.queue.options.maxPreviousTracks) player.queue.previous.splice(player.queue.options.maxPreviousTracks, player.queue.previous.length);
      await player.queue.utils.save();
    }
    if (!player.queue.current) return this.queueEnd(player, trackToUse, payload);
    player.set("internal_skipped", false);
    this.NodeManager.LavalinkManager.emit("trackEnd", player, trackToUse, payload);
    if (this.NodeManager.LavalinkManager.options.autoSkip && player.queue.current) {
      player.play({ noReplace: true });
    }
    return;
  }
  /** @private util function for handling trackStuck event */
  async trackStuck(player, track, payload) {
    if (this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.threshold > 0 && this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.maxAmount >= 0) {
      const oldTimestamps = (player.get("internal_erroredTracksTimestamps") || []).filter((v) => Date.now() - v < this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.threshold);
      player.set("internal_erroredTracksTimestamps", [...oldTimestamps, Date.now()]);
      if (oldTimestamps.length > this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.maxAmount) {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "TrackStuckMaxTracksErroredPerTime" /* TrackStuckMaxTracksErroredPerTime */, {
            state: "log",
            message: `trackStuck Event was triggered too often within a given threshold (LavalinkManager.options.playerOptions.maxErrorsPerTime). Threshold: "${this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.threshold}ms", maxAmount: "${this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.maxAmount}"`,
            functionLayer: "LavalinkNode > trackStuck()"
          });
        }
        player.destroy("TrackStuckMaxTracksErroredPerTime" /* TrackStuckMaxTracksErroredPerTime */);
        return;
      }
    }
    this.NodeManager.LavalinkManager.emit("trackStuck", player, track || this.getTrackOfPayload(payload), payload);
    if (!player.queue.tracks.length && (player.repeatMode === "off" || player.get("internal_stopPlaying"))) {
      try {
        await player.node.updatePlayer({ guildId: player.guildId, playerOptions: { track: { encoded: null } } });
        return;
      } catch {
        return this.queueEnd(player, track || this.getTrackOfPayload(payload), payload);
      }
    }
    await queueTrackEnd(player);
    if (!player.queue.current) {
      return this.queueEnd(player, track || this.getTrackOfPayload(payload), payload);
    }
    if (this.NodeManager.LavalinkManager.options.autoSkip && player.queue.current) {
      player.play({ track: player.queue.current, noReplace: false });
    }
    return;
  }
  /** @private util function for handling trackError event */
  async trackError(player, track, payload) {
    if (this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.threshold > 0 && this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.maxAmount >= 0) {
      const oldTimestamps = (player.get("internal_erroredTracksTimestamps") || []).filter((v) => Date.now() - v < this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.threshold);
      player.set("internal_erroredTracksTimestamps", [...oldTimestamps, Date.now()]);
      if (oldTimestamps.length > this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.maxAmount) {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "TrackErrorMaxTracksErroredPerTime" /* TrackErrorMaxTracksErroredPerTime */, {
            state: "log",
            message: `TrackError Event was triggered too often within a given threshold (LavalinkManager.options.playerOptions.maxErrorsPerTime). Threshold: "${this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.threshold}ms", maxAmount: "${this.NodeManager.LavalinkManager.options.playerOptions.maxErrorsPerTime?.maxAmount}"`,
            functionLayer: "LavalinkNode > trackError()"
          });
        }
        player.destroy("TrackErrorMaxTracksErroredPerTime" /* TrackErrorMaxTracksErroredPerTime */);
        return;
      }
    }
    this.NodeManager.LavalinkManager.emit("trackError", player, track || this.getTrackOfPayload(payload), payload);
    return;
  }
  /** @private util function for handling socketClosed event */
  socketClosed(player, payload) {
    this.NodeManager.LavalinkManager.emit("playerSocketClosed", player, payload);
    return;
  }
  /** @private util function for handling SponsorBlock Segmentloaded event */
  SponsorBlockSegmentLoaded(player, track, payload) {
    this.NodeManager.LavalinkManager.emit("SegmentsLoaded", player, track || this.getTrackOfPayload(payload), payload);
    return;
  }
  /** @private util function for handling SponsorBlock SegmentSkipped event */
  SponsorBlockSegmentSkipped(player, track, payload) {
    this.NodeManager.LavalinkManager.emit("SegmentSkipped", player, track || this.getTrackOfPayload(payload), payload);
    return;
  }
  /** @private util function for handling SponsorBlock Chaptersloaded event */
  SponsorBlockChaptersLoaded(player, track, payload) {
    this.NodeManager.LavalinkManager.emit("ChaptersLoaded", player, track || this.getTrackOfPayload(payload), payload);
    return;
  }
  /** @private util function for handling SponsorBlock Chaptersstarted event */
  SponsorBlockChapterStarted(player, track, payload) {
    this.NodeManager.LavalinkManager.emit("ChapterStarted", player, track || this.getTrackOfPayload(payload), payload);
    return;
  }
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
  async getSponsorBlock(player) {
    if (!this.info.plugins.find((v) => v.name === "sponsorblock-plugin")) throw new RangeError(`there is no sponsorblock-plugin available in the lavalink node: ${this.id}`);
    return await this.request(`/sessions/${this.sessionId}/players/${player.guildId}/sponsorblock/categories`);
  }
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
  async setSponsorBlock(player, segments = ["sponsor", "selfpromo"]) {
    if (!this.info.plugins.find((v) => v.name === "sponsorblock-plugin")) throw new RangeError(`there is no sponsorblock-plugin available in the lavalink node: ${this.id}`);
    if (!segments.length) throw new RangeError("No Segments provided. Did you ment to use 'deleteSponsorBlock'?");
    if (segments.some((v) => !validSponsorBlocks.includes(v.toLowerCase()))) throw new SyntaxError(`You provided a sponsorblock which isn't valid, valid ones are: ${validSponsorBlocks.map((v) => `'${v}'`).join(", ")}`);
    await this.request(`/sessions/${this.sessionId}/players/${player.guildId}/sponsorblock/categories`, (r) => {
      r.method = "PUT";
      r.headers = { Authorization: this.options.authorization, "Content-Type": "application/json" };
      r.body = safeStringify(segments.map((v) => v.toLowerCase()));
    });
    player.set("internal_sponsorBlockCategories", segments.map((v) => v.toLowerCase()));
    if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
      this.NodeManager.LavalinkManager.emit("debug", "SetSponsorBlock" /* SetSponsorBlock */, {
        state: "log",
        message: `SponsorBlock was set for Player: ${player.guildId} to: ${segments.map((v) => `'${v.toLowerCase()}'`).join(", ")}`,
        functionLayer: "LavalinkNode > setSponsorBlock()"
      });
    }
    return;
  }
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
  async deleteSponsorBlock(player) {
    if (!this.info.plugins.find((v) => v.name === "sponsorblock-plugin")) throw new RangeError(`there is no sponsorblock-plugin available in the lavalink node: ${this.id}`);
    await this.request(`/sessions/${this.sessionId}/players/${player.guildId}/sponsorblock/categories`, (r) => {
      r.method = "DELETE";
    });
    player.set("internal_sponsorBlockCategories", []);
    if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
      this.NodeManager.LavalinkManager.emit("debug", "DeleteSponsorBlock" /* DeleteSponsorBlock */, {
        state: "log",
        message: `SponsorBlock was deleted for Player: ${player.guildId}`,
        functionLayer: "LavalinkNode > deleteSponsorBlock()"
      });
    }
    return;
  }
  /** private util function for handling the queue end event */
  async queueEnd(player, track, payload) {
    if (player.get("internal_nodeChanging") === true) return;
    player.queue.current = null;
    player.playing = false;
    player.set("internal_stopPlaying", void 0);
    if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
      this.NodeManager.LavalinkManager.emit("debug", "QueueEnded" /* QueueEnded */, {
        state: "log",
        message: `Queue Ended because no more Tracks were in the Queue, due to EventName: "${payload.type}"`,
        functionLayer: "LavalinkNode > queueEnd()"
      });
    }
    if (typeof this.NodeManager.LavalinkManager.options?.playerOptions?.onEmptyQueue?.autoPlayFunction === "function" && typeof player.get("internal_autoplayStopPlaying") === "undefined") {
      if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.NodeManager.LavalinkManager.emit("debug", "AutoplayExecution" /* AutoplayExecution */, {
          state: "log",
          message: `Now Triggering Autoplay.`,
          functionLayer: "LavalinkNode > queueEnd() > autoplayFunction"
        });
      }
      const previousAutoplayTime = player.get("internal_previousautoplay");
      const duration = previousAutoplayTime ? Date.now() - previousAutoplayTime : 0;
      if (!duration || duration > this.NodeManager.LavalinkManager.options.playerOptions.minAutoPlayMs || !!player.get("internal_skipped")) {
        await this.NodeManager.LavalinkManager.options?.playerOptions?.onEmptyQueue?.autoPlayFunction(player, track);
        player.set("internal_previousautoplay", Date.now());
        if (player.queue.tracks.length > 0) await queueTrackEnd(player);
        else if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "AutoplayNoSongsAdded" /* AutoplayNoSongsAdded */, {
            state: "warn",
            message: `Autoplay was triggered but no songs were added to the queue.`,
            functionLayer: "LavalinkNode > queueEnd() > autoplayFunction"
          });
        }
        if (player.queue.current) {
          if (payload.type === "TrackEndEvent") this.NodeManager.LavalinkManager.emit("trackEnd", player, track, payload);
          if (this.NodeManager.LavalinkManager.options.autoSkip) return player.play({ noReplace: true, paused: false });
        }
      } else {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "AutoplayThresholdSpamLimiter" /* AutoplayThresholdSpamLimiter */, {
            state: "warn",
            message: `Autoplay was triggered after the previousautoplay too early. Threshold is: ${this.NodeManager.LavalinkManager.options.playerOptions.minAutoPlayMs}ms and the Duration was ${duration}ms`,
            functionLayer: "LavalinkNode > queueEnd() > autoplayFunction"
          });
        }
      }
    }
    player.set("internal_skipped", false);
    player.set("internal_autoplayStopPlaying", void 0);
    if (track && !track?.pluginInfo?.clientData?.previousTrack) {
      player.queue.previous.unshift(track);
      if (player.queue.previous.length > player.queue.options.maxPreviousTracks) player.queue.previous.splice(player.queue.options.maxPreviousTracks, player.queue.previous.length);
      await player.queue.utils.save();
    }
    if (payload?.reason !== "stopped") {
      await player.queue.utils.save();
    }
    if (typeof this.NodeManager.LavalinkManager.options.playerOptions?.onEmptyQueue?.destroyAfterMs === "number" && !isNaN(this.NodeManager.LavalinkManager.options.playerOptions.onEmptyQueue?.destroyAfterMs) && this.NodeManager.LavalinkManager.options.playerOptions.onEmptyQueue?.destroyAfterMs >= 0) {
      if (this.NodeManager.LavalinkManager.options.playerOptions.onEmptyQueue?.destroyAfterMs === 0) {
        player.destroy("QueueEmpty" /* QueueEmpty */);
        return;
      } else {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "TriggerQueueEmptyInterval" /* TriggerQueueEmptyInterval */, {
            state: "log",
            message: `Trigger Queue Empty Interval was Triggered because playerOptions.onEmptyQueue.destroyAfterMs is set to ${this.NodeManager.LavalinkManager.options.playerOptions.onEmptyQueue?.destroyAfterMs}ms`,
            functionLayer: "LavalinkNode > queueEnd() > destroyAfterMs"
          });
        }
        this.NodeManager.LavalinkManager.emit("playerQueueEmptyStart", player, this.NodeManager.LavalinkManager.options.playerOptions.onEmptyQueue?.destroyAfterMs);
        if (player.get("internal_queueempty")) {
          clearTimeout(player.get("internal_queueempty"));
          player.set("internal_queueempty", void 0);
        }
        player.set("internal_queueempty", setTimeout(() => {
          player.set("internal_queueempty", void 0);
          if (player.queue.current) {
            return this.NodeManager.LavalinkManager.emit("playerQueueEmptyCancel", player);
          }
          this.NodeManager.LavalinkManager.emit("playerQueueEmptyEnd", player);
          player.destroy("QueueEmpty" /* QueueEmpty */);
        }, this.NodeManager.LavalinkManager.options.playerOptions.onEmptyQueue?.destroyAfterMs));
      }
    }
    this.NodeManager.LavalinkManager.emit("queueEnd", player, track, payload);
    return;
  }
  /**
   * Emitted whenever a line of lyrics gets emitted
   * @event
   * @param {Player} player The player that emitted the event
   * @param {Track} track The track that emitted the event
   * @param {LyricsLineEvent} payload The payload of the event
   */
  async LyricsLine(player, track, payload) {
    if (!player.queue.current) {
      player.queue.current = this.getTrackOfPayload(payload);
      if (player.queue.current) {
        await player.queue.utils.save();
      } else {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "TrackStartNoTrack" /* TrackStartNoTrack */, {
            state: "warn",
            message: `Trackstart emitted but there is no track on player.queue.current, trying to get the track of the payload failed too.`,
            functionLayer: "LavalinkNode > trackStart()"
          });
        }
      }
    }
    this.NodeManager.LavalinkManager.emit("LyricsLine", player, track, payload);
    return;
  }
  /**
   * Emitted whenever the lyrics for a track got found
   * @event
   * @param {Player} player The player that emitted the event
   * @param {Track} track The track that emitted the event
   * @param {LyricsFoundEvent} payload The payload of the event
   */
  async LyricsFound(player, track, payload) {
    if (!player.queue.current) {
      player.queue.current = this.getTrackOfPayload(payload);
      if (player.queue.current) {
        await player.queue.utils.save();
      } else {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "TrackStartNoTrack" /* TrackStartNoTrack */, {
            state: "warn",
            message: `Trackstart emitted but there is no track on player.queue.current, trying to get the track of the payload failed too.`,
            functionLayer: "LavalinkNode > trackStart()"
          });
        }
      }
    }
    this.NodeManager.LavalinkManager.emit("LyricsFound", player, track, payload);
    return;
  }
  /**
   * Emitted whenever the lyrics for a track got not found
   * @event
   * @param {Player} player The player that emitted the event
   * @param {Track} track The track that emitted the event
   * @param {LyricsNotFoundEvent} payload The payload of the event
   */
  async LyricsNotFound(player, track, payload) {
    if (!player.queue.current) {
      player.queue.current = this.getTrackOfPayload(payload);
      if (player.queue.current) {
        await player.queue.utils.save();
      } else {
        if (this.NodeManager.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.NodeManager.LavalinkManager.emit("debug", "TrackStartNoTrack" /* TrackStartNoTrack */, {
            state: "warn",
            message: `Trackstart emitted but there is no track on player.queue.current, trying to get the track of the payload failed too.`,
            functionLayer: "LavalinkNode > trackStart()"
          });
        }
      }
    }
    this.NodeManager.LavalinkManager.emit("LyricsNotFound", player, track, payload);
    return;
  }
};

// src/structures/NodeManager.ts
var NodeManager = class extends EventEmitter {
  /**
   * Emit an event
   * @param event The event to emit
   * @param args The arguments to pass to the event
   * @returns
   */
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
  /**
   * Add an event listener
   * @param event The event to listen to
   * @param listener The listener to add
   * @returns
   */
  on(event, listener) {
    return super.on(event, listener);
  }
  /**
   * Add an event listener that only fires once
   * @param event The event to listen to
   * @param listener The listener to add
   * @returns
   */
  once(event, listener) {
    return super.once(event, listener);
  }
  /**
   * Remove an event listener
   * @param event The event to remove the listener from
   * @param listener The listener to remove
   * @returns
   */
  off(event, listener) {
    return super.off(event, listener);
  }
  /**
   * Remove an event listener
   * @param event The event to remove the listener from
   * @param listener The listener to remove
   * @returns
   */
  removeListener(event, listener) {
    return super.removeListener(event, listener);
  }
  /**
   * The LavalinkManager that created this NodeManager
   */
  LavalinkManager;
  /**
   * A map of all nodes in the nodeManager
   */
  nodes = new MiniMap();
  /**
   * @param LavalinkManager The LavalinkManager that created this NodeManager
   */
  constructor(LavalinkManager2) {
    super();
    this.LavalinkManager = LavalinkManager2;
    if (this.LavalinkManager.options.nodes) this.LavalinkManager.options.nodes.forEach((node) => {
      this.createNode(node);
    });
  }
  /**
   * Disconnects all Nodes from lavalink ws sockets
   * @param deleteAllNodes if the nodes should also be deleted from nodeManager.nodes
   * @param destroyPlayers if the players should be destroyed
   * @returns amount of disconnected Nodes
   */
  async disconnectAll(deleteAllNodes = false, destroyPlayers = true) {
    if (!this.nodes.size) throw new Error("There are no nodes to disconnect (no nodes in the nodemanager)");
    if (!this.nodes.filter((v) => v.connected).size) throw new Error("There are no nodes to disconnect (all nodes disconnected)");
    let counter = 0;
    for (const node of this.nodes.values()) {
      if (!node.connected) continue;
      if (destroyPlayers) {
        await node.destroy("DisconnectAllNodes" /* DisconnectAllNodes */, deleteAllNodes);
      } else {
        await node.disconnect("DisconnectAllNodes" /* DisconnectAllNodes */);
      }
      counter++;
    }
    return counter;
  }
  /**
   * Connects all not connected nodes
   * @returns Amount of connected Nodes
   */
  async connectAll() {
    if (!this.nodes.size) throw new Error("There are no nodes to connect (no nodes in the nodemanager)");
    if (!this.nodes.filter((v) => !v.connected).size) throw new Error("There are no nodes to connect (all nodes connected)");
    let counter = 0;
    for (const node of this.nodes.values()) {
      if (node.connected) continue;
      await node.connect();
      counter++;
    }
    return counter;
  }
  /**
   * Forcefully reconnects all nodes
   * @returns amount of nodes
   */
  async reconnectAll() {
    if (!this.nodes.size) throw new Error("There are no nodes to reconnect (no nodes in the nodemanager)");
    let counter = 0;
    for (const node of this.nodes.values()) {
      const sessionId = node.sessionId ? `${node.sessionId}` : void 0;
      await node.destroy("ReconnectAllNodes" /* ReconnectAllNodes */, false);
      await node.connect(sessionId);
      counter++;
    }
    return counter;
  }
  /**
   * Create a node and add it to the nodeManager
   * @param options The options for the node
   * @returns The node that was created
   */
  createNode(options) {
    if (this.nodes.has(options.id || `${options.host}:${options.port}`)) return this.nodes.get(options.id || `${options.host}:${options.port}`);
    const newNode = new LavalinkNode(options, this);
    this.nodes.set(newNode.id, newNode);
    return newNode;
  }
  /**
   * Get the nodes sorted for the least usage, by a sorttype
   * @param sortType The type of sorting to use
   * @returns
   */
  leastUsedNodes(sortType = "players") {
    const connectedNodes = Array.from(this.nodes.values()).filter((node) => node.connected);
    switch (sortType) {
      case "memory":
        {
          return connectedNodes.sort((a, b) => (a.stats?.memory?.used || 0) - (b.stats?.memory?.used || 0));
        }
        break;
      case "cpuLavalink":
        {
          return connectedNodes.sort((a, b) => (a.stats?.cpu?.lavalinkLoad || 0) - (b.stats?.cpu?.lavalinkLoad || 0));
        }
        break;
      case "cpuSystem":
        {
          return connectedNodes.sort((a, b) => (a.stats?.cpu?.systemLoad || 0) - (b.stats?.cpu?.systemLoad || 0));
        }
        break;
      case "calls":
        {
          return connectedNodes.sort((a, b) => a.calls - b.calls);
        }
        break;
      case "playingPlayers":
        {
          return connectedNodes.sort((a, b) => (a.stats?.playingPlayers || 0) - (b.stats?.playingPlayers || 0));
        }
        break;
      case "players":
        {
          return connectedNodes.sort((a, b) => (a.stats?.players || 0) - (b.stats?.players || 0));
        }
        break;
      default:
        {
          return connectedNodes.sort((a, b) => (a.stats?.players || 0) - (b.stats?.players || 0));
        }
        break;
    }
  }
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
  deleteNode(node, movePlayers = false) {
    const decodeNode = typeof node === "string" ? this.nodes.get(node) : node;
    if (!(decodeNode instanceof LavalinkNode))
      throw new RangeError("nodeManager.deleteNode: The node you provided is not valid or doesn't exist.");
    if (typeof movePlayers !== "boolean")
      throw new TypeError("nodeManager.deleteNode: movePlayers must be a boolean");
    decodeNode.destroy("NodeDeleted" /* NodeDeleted */, true, movePlayers);
    this.nodes.delete(decodeNode.id);
    return;
  }
};

// src/structures/CustomSearches/BandCampSearch.ts
var bandCampSearch = async (player, query, requestUser) => {
  let error = null;
  let tracks = [];
  if (player.LavalinkManager.options.advancedOptions.debugOptions.logCustomSearches) console.log(`Nazha-Client-Debug | SEARCHING | - ${query} on Nazha-Client`);
  player.LavalinkManager.utils.validateQueryString(player.node, query);
  try {
    const requestUrl = new URL("https://bandcamp.com/api/nusearch/2/autocomplete");
    requestUrl.searchParams.append("q", query);
    const data = await fetch(requestUrl.toString(), {
      headers: {
        "User-Agent": "android-async-http/1.4.1 (http://loopj.com/android-async-http)",
        "Cookie": "$Version=1"
      }
    });
    const json = await data.json();
    tracks = json?.results?.filter((x) => !!x && typeof x === "object" && "type" in x && x.type === "t").map?.((item) => player.LavalinkManager.utils.buildUnresolvedTrack({
      uri: item.url || item.uri,
      artworkUrl: item.img,
      author: item.band_name,
      title: item.name,
      identifier: item.id ? `${item.id}` : item.url?.split("/").reverse()[0]
    }, requestUser));
  } catch (e) {
    error = e;
  }
  return {
    loadType: "search",
    exception: error,
    pluginInfo: {},
    playlist: null,
    tracks
  };
};

// src/structures/Filters.ts
var FilterManager = class {
  /** The Equalizer bands currently applied to the Lavalink Server */
  equalizerBands = [];
  /** Private Util for the instaFix Filters option */
  filterUpdatedState = false;
  /** All "Active" / "disabled" Player Filters */
  filters = {
    volume: false,
    vaporwave: false,
    custom: false,
    nightcore: false,
    rotation: false,
    karaoke: false,
    tremolo: false,
    vibrato: false,
    lowPass: false,
    lavalinkFilterPlugin: {
      echo: false,
      reverb: false
    },
    lavalinkLavaDspxPlugin: {
      lowPass: false,
      highPass: false,
      normalization: false,
      echo: false
    },
    audioOutput: "stereo"
  };
  /** The Filter Data sent to Lavalink, only if the filter is enabled (ofc.) */
  data = {
    lowPass: {
      smoothing: 0
    },
    karaoke: {
      level: 0,
      monoLevel: 0,
      filterBand: 0,
      filterWidth: 0
    },
    timescale: {
      speed: 1,
      // 0 = x
      pitch: 1,
      // 0 = x
      rate: 1
      // 0 = x
    },
    rotation: {
      rotationHz: 0
    },
    tremolo: {
      frequency: 0,
      // 0 < x
      depth: 0
      // 0 < x = 1
    },
    vibrato: {
      frequency: 0,
      // 0 < x <= 14
      depth: 0
      // 0 < x <= 1
    },
    pluginFilters: {
      "lavalink-filter-plugin": {
        echo: {
          delay: 0,
          // in seconds
          decay: 0
          // 0 < 1
        },
        reverb: {
          delays: [],
          // [0.037, 0.042, 0.048, 0.053]
          gains: []
          // [0.84, 0.83, 0.82, 0.81]
        }
      },
      "high-pass": {
        // Cuts off frequencies lower than the specified {cutoffFrequency}.
        // "cutoffFrequency": 1475, // Integer, higher than zero, in Hz.
        // "boostFactor": 1.0    // Float, higher than 0.0. This alters volume output. A value of 1.0 means no volume change.
      },
      "low-pass": {
        // Cuts off frequencies higher than the specified {cutoffFrequency}.
        // "cutoffFrequency": 284, // Integer, higher than zero, in Hz.
        // "boostFactor": 1.24389    // Float, higher than 0.0. This alters volume output. A value of 1.0 means no volume change.
      },
      "normalization": {
        // Attenuates peaking where peaks are defined as having a higher value than {maxAmplitude}.
        // "maxAmplitude": 0.6327, // Float, within the range of 0.0 - 1.0. A value of 0.0 mutes the output.
        // "adaptive": true    // false
      },
      "echo": {
        // Self-explanatory; provides an echo effect.
        // "echoLength": 0.5649, // Float, higher than 0.0, in seconds (1.0 = 1 second).
        // "decay": 0.4649       // Float, within the range of 0.0 - 1.0. A value of 1.0 means no decay, and a value of 0.0 means
      }
    },
    channelMix: audioOutputsData.stereo
    /*distortion: {
        sinOffset: 0,
        sinScale: 1,
        cosOffset: 0,
        cosScale: 1,
        tanOffset: 0,
        tanScale: 1,
        offset: 0,
        scale: 1
    }*/
  };
  /** The Player assigned to this Filter Manager */
  player;
  /** The Constructor for the FilterManager */
  constructor(player) {
    this.player = player;
  }
  /**
   * Apply Player filters for lavalink filter sending data, if the filter is enabled / not
   */
  async applyPlayerFilters() {
    const sendData = { ...this.data };
    this.checkFiltersState();
    if (!this.filters.volume) delete sendData.volume;
    if (!this.filters.tremolo) delete sendData.tremolo;
    if (!this.filters.vibrato) delete sendData.vibrato;
    if (!this.filters.lavalinkFilterPlugin.echo) delete sendData.pluginFilters?.["lavalink-filter-plugin"]?.echo;
    if (!this.filters.lavalinkFilterPlugin.reverb) delete sendData.pluginFilters?.["lavalink-filter-plugin"]?.reverb;
    if (!this.filters.lavalinkLavaDspxPlugin.echo) delete sendData.pluginFilters?.echo;
    if (!this.filters.lavalinkLavaDspxPlugin.normalization) delete sendData.pluginFilters?.normalization;
    if (!this.filters.lavalinkLavaDspxPlugin.highPass) delete sendData.pluginFilters?.["high-pass"];
    if (!this.filters.lavalinkLavaDspxPlugin.lowPass) delete sendData.pluginFilters?.["low-pass"];
    if (sendData.pluginFilters?.["lavalink-filter-plugin"] && Object.values(sendData.pluginFilters?.["lavalink-filter-plugin"]).length === 0) delete sendData.pluginFilters["lavalink-filter-plugin"];
    if (sendData.pluginFilters && Object.values(sendData.pluginFilters).length === 0) delete sendData.pluginFilters;
    if (!this.filters.lowPass) delete sendData.lowPass;
    if (!this.filters.karaoke) delete sendData.karaoke;
    if (!this.filters.rotation) delete sendData.rotation;
    if (this.filters.audioOutput === "stereo") delete sendData.channelMix;
    if (Object.values(this.data.timescale).every((v) => v === 1)) delete sendData.timescale;
    if (!this.player.node.sessionId) throw new Error("The Lavalink-Node is either not ready or not up to date");
    sendData.equalizer = [...this.equalizerBands];
    if (sendData.equalizer.length === 0) delete sendData.equalizer;
    for (const key of Object.keys(sendData)) {
      if (key === "pluginFilters") {
      } else if (this.player.node.info && !this.player.node.info?.filters?.includes?.(key)) delete sendData[key];
    }
    const now = performance.now();
    if (this.player.options.instaUpdateFiltersFix === true) this.filterUpdatedState = true;
    await this.player.node.updatePlayer({
      guildId: this.player.guildId,
      playerOptions: {
        filters: sendData
      }
    });
    this.player.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    return;
  }
  /**
   * Checks if the filters are correctly stated (active / not-active)
   * @param oldFilterTimescale
   * @returns
   */
  checkFiltersState(oldFilterTimescale) {
    this.filters.rotation = this.data.rotation.rotationHz !== 0;
    this.filters.vibrato = this.data.vibrato.frequency !== 0 || this.data.vibrato.depth !== 0;
    this.filters.tremolo = this.data.tremolo.frequency !== 0 || this.data.tremolo.depth !== 0;
    const lavalinkFilterData = this.data.pluginFilters?.["lavalink-filter-plugin"] || { echo: { decay: this.data.pluginFilters?.echo?.decay && !this.data.pluginFilters?.echo?.echoLength ? this.data.pluginFilters.echo.decay : 0, delay: this.data.pluginFilters?.echo?.delay || 0 }, reverb: { gains: [], delays: [], ...this.data.pluginFilters.reverb } };
    this.filters.lavalinkFilterPlugin.echo = lavalinkFilterData.echo.decay !== 0 || lavalinkFilterData.echo.delay !== 0;
    this.filters.lavalinkFilterPlugin.reverb = lavalinkFilterData.reverb?.delays?.length !== 0 || lavalinkFilterData.reverb?.gains?.length !== 0;
    this.filters.lavalinkLavaDspxPlugin.highPass = Object.values(this.data.pluginFilters["high-pass"] || {}).length > 0;
    this.filters.lavalinkLavaDspxPlugin.lowPass = Object.values(this.data.pluginFilters["low-pass"] || {}).length > 0;
    this.filters.lavalinkLavaDspxPlugin.normalization = Object.values(this.data.pluginFilters.normalization || {}).length > 0;
    this.filters.lavalinkLavaDspxPlugin.echo = Object.values(this.data.pluginFilters.echo || {}).length > 0 && typeof this.data.pluginFilters?.echo?.delay === "undefined";
    this.filters.lowPass = this.data.lowPass.smoothing !== 0;
    this.filters.karaoke = Object.values(this.data.karaoke).some((v) => v !== 0);
    if ((this.filters.nightcore || this.filters.vaporwave) && oldFilterTimescale) {
      if (oldFilterTimescale.pitch !== this.data.timescale.pitch || oldFilterTimescale.rate !== this.data.timescale.rate || oldFilterTimescale.speed !== this.data.timescale.speed) {
        this.filters.custom = Object.values(this.data.timescale).some((v) => v !== 1);
        this.filters.nightcore = false;
        this.filters.vaporwave = false;
      }
    }
    return true;
  }
  /**
   * Reset all Filters
   */
  async resetFilters() {
    this.filters.lavalinkLavaDspxPlugin.echo = false;
    this.filters.lavalinkLavaDspxPlugin.normalization = false;
    this.filters.lavalinkLavaDspxPlugin.highPass = false;
    this.filters.lavalinkLavaDspxPlugin.lowPass = false;
    this.filters.lavalinkFilterPlugin.echo = false;
    this.filters.lavalinkFilterPlugin.reverb = false;
    this.filters.nightcore = false;
    this.filters.lowPass = false;
    this.filters.rotation = false;
    this.filters.tremolo = false;
    this.filters.vibrato = false;
    this.filters.karaoke = false;
    this.filters.karaoke = false;
    this.filters.volume = false;
    this.filters.audioOutput = "stereo";
    for (const [key, value] of Object.entries({
      volume: 1,
      lowPass: {
        smoothing: 0
      },
      karaoke: {
        level: 0,
        monoLevel: 0,
        filterBand: 0,
        filterWidth: 0
      },
      timescale: {
        speed: 1,
        // 0 = x
        pitch: 1,
        // 0 = x
        rate: 1
        // 0 = x
      },
      pluginFilters: {
        "lavalink-filter-plugin": {
          echo: {
            // delay: 0, // in seconds
            // decay: 0 // 0 < 1
          },
          reverb: {
            // delays: [], // [0.037, 0.042, 0.048, 0.053]
            // gains: [] // [0.84, 0.83, 0.82, 0.81]
          }
        },
        "high-pass": {
          // Cuts off frequencies lower than the specified {cutoffFrequency}.
          // "cutoffFrequency": 1475, // Integer, higher than zero, in Hz.
          // "boostFactor": 1.0    // Float, higher than 0.0. This alters volume output. A value of 1.0 means no volume change.
        },
        "low-pass": {
          // Cuts off frequencies higher than the specified {cutoffFrequency}.
          // "cutoffFrequency": 284, // Integer, higher than zero, in Hz.
          // "boostFactor": 1.24389    // Float, higher than 0.0. This alters volume output. A value of 1.0 means no volume change.
        },
        "normalization": {
          // Attenuates peaking where peaks are defined as having a higher value than {maxAmplitude}.
          // "maxAmplitude": 0.6327, // Float, within the range of 0.0 - 1.0. A value of 0.0 mutes the output.
          // "adaptive": true    // false
        },
        "echo": {
          // Self-explanatory; provides an echo effect.
          // "echoLength": 0.5649, // Float, higher than 0.0, in seconds (1.0 = 1 second).
          // "decay": 0.4649       // Float, within the range of 0.0 - 1.0. A value of 1.0 means no decay, and a value of 0.0 means
        }
      },
      rotation: {
        rotationHz: 0
      },
      tremolo: {
        frequency: 0,
        // 0 < x
        depth: 0
        // 0 < x = 1
      },
      vibrato: {
        frequency: 0,
        // 0 < x = 14
        depth: 0
        // 0 < x = 1
      },
      channelMix: audioOutputsData.stereo
    })) {
      this.data[key] = value;
    }
    await this.applyPlayerFilters();
    return this.filters;
  }
  /**
   * Set the Filter Volume
   * @param volume
   * @returns
   */
  async setVolume(volume) {
    if (volume < 0 || volume > 5) throw new SyntaxError("Volume-Filter must be between 0 and 5");
    this.data.volume = volume;
    await this.applyPlayerFilters();
    return this.filters.volume;
  }
  /**
   * Set the AudioOutput Filter
   * @param type
   * @returns
   */
  async setAudioOutput(type) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("channelMix")) throw new Error("Node#Info#filters does not include the 'channelMix' Filter (Node has it not enable)");
    if (!type || !audioOutputsData[type]) throw "Invalid audio type added, must be 'mono' / 'stereo' / 'left' / 'right'";
    this.data.channelMix = audioOutputsData[type];
    this.filters.audioOutput = type;
    await this.applyPlayerFilters();
    return this.filters.audioOutput;
  }
  /**
   * Set custom filter.timescale#speed . This method disabled both: nightcore & vaporwave. use 1 to reset it to normal
   * @param speed
   * @returns
   */
  async setSpeed(speed = 1) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale")) throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
    if (this.filters.nightcore || this.filters.vaporwave) {
      this.data.timescale.pitch = 1;
      this.data.timescale.speed = 1;
      this.data.timescale.rate = 1;
      this.filters.nightcore = false;
      this.filters.vaporwave = false;
    }
    this.data.timescale.speed = speed;
    this.isCustomFilterActive();
    await this.applyPlayerFilters();
    return this.filters.custom;
  }
  /**
   * Set custom filter.timescale#pitch . This method disabled both: nightcore & vaporwave. use 1 to reset it to normal
   * @param speed
   * @returns
   */
  async setPitch(pitch = 1) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale")) throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
    if (this.filters.nightcore || this.filters.vaporwave) {
      this.data.timescale.pitch = 1;
      this.data.timescale.speed = 1;
      this.data.timescale.rate = 1;
      this.filters.nightcore = false;
      this.filters.vaporwave = false;
    }
    this.data.timescale.pitch = pitch;
    this.isCustomFilterActive();
    await this.applyPlayerFilters();
    return this.filters.custom;
  }
  /**
   * Set custom filter.timescale#rate . This method disabled both: nightcore & vaporwave. use 1 to reset it to normal
   * @param speed
   * @returns
   */
  async setRate(rate = 1) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale")) throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
    if (this.filters.nightcore || this.filters.vaporwave) {
      this.data.timescale.pitch = 1;
      this.data.timescale.speed = 1;
      this.data.timescale.rate = 1;
      this.filters.nightcore = false;
      this.filters.vaporwave = false;
    }
    this.data.timescale.rate = rate;
    this.isCustomFilterActive();
    await this.applyPlayerFilters();
    return this.filters.custom;
  }
  /**
   * Enables / Disables the rotation effect, (Optional: provide your Own Data)
   * @param rotationHz
   * @returns
   */
  async toggleRotation(rotationHz = 0.2) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("rotation")) throw new Error("Node#Info#filters does not include the 'rotation' Filter (Node has it not enable)");
    this.data.rotation.rotationHz = this.filters.rotation ? 0 : rotationHz;
    this.filters.rotation = !this.filters.rotation;
    await this.applyPlayerFilters();
    return this.filters.rotation;
  }
  /**
   * Enables / Disables the Vibrato effect, (Optional: provide your Own Data)
   * @param frequency
   * @param depth
   * @returns
   */
  async toggleVibrato(frequency = 10, depth = 1) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("vibrato")) throw new Error("Node#Info#filters does not include the 'vibrato' Filter (Node has it not enable)");
    this.data.vibrato.frequency = this.filters.vibrato ? 0 : frequency;
    this.data.vibrato.depth = this.filters.vibrato ? 0 : depth;
    this.filters.vibrato = !this.filters.vibrato;
    await this.applyPlayerFilters();
    return this.filters.vibrato;
  }
  /**
   * Enables / Disables the Tremolo effect, (Optional: provide your Own Data)
   * @param frequency
   * @param depth
   * @returns
   */
  async toggleTremolo(frequency = 4, depth = 0.8) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("tremolo")) throw new Error("Node#Info#filters does not include the 'tremolo' Filter (Node has it not enable)");
    this.data.tremolo.frequency = this.filters.tremolo ? 0 : frequency;
    this.data.tremolo.depth = this.filters.tremolo ? 0 : depth;
    this.filters.tremolo = !this.filters.tremolo;
    await this.applyPlayerFilters();
    return this.filters.tremolo;
  }
  /**
   * Enables / Disables the LowPass effect, (Optional: provide your Own Data)
   * @param smoothing
   * @returns
   */
  async toggleLowPass(smoothing = 20) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("lowPass")) throw new Error("Node#Info#filters does not include the 'lowPass' Filter (Node has it not enable)");
    this.data.lowPass.smoothing = this.filters.lowPass ? 0 : smoothing;
    this.filters.lowPass = !this.filters.lowPass;
    await this.applyPlayerFilters();
    return this.filters.lowPass;
  }
  lavalinkLavaDspxPlugin = {
    /**
     * Enables / Disables the LowPass effect, (Optional: provide your Own Data)
     * @param boostFactor
     * @param cutoffFrequency
     * @returns
     */
    toggleLowPass: async (boostFactor = 1, cutoffFrequency = 80) => {
      if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin")) throw new Error("Node#Info#plugins does not include the lavadspx plugin");
      if (this.player.node.info && !this.player.node.info?.filters?.includes("low-pass")) throw new Error("Node#Info#filters does not include the 'low-pass' Filter (Node has it not enable)");
      if (!this.data) this.data = {};
      if (!this.data.pluginFilters) this.data.pluginFilters = {};
      if (!this.data.pluginFilters["low-pass"]) this.data.pluginFilters["low-pass"] = {};
      if (this.filters.lavalinkLavaDspxPlugin.lowPass) {
        delete this.data.pluginFilters["low-pass"];
      } else {
        this.data.pluginFilters["low-pass"] = {
          boostFactor,
          cutoffFrequency
        };
      }
      this.filters.lavalinkLavaDspxPlugin.lowPass = !this.filters.lavalinkLavaDspxPlugin.lowPass;
      await this.applyPlayerFilters();
      return this.filters.lavalinkLavaDspxPlugin.lowPass;
    },
    /**
     * Enables / Disables the HighPass effect, (Optional: provide your Own Data)
     * @param boostFactor
     * @param cutoffFrequency
     * @returns
     */
    toggleHighPass: async (boostFactor = 1, cutoffFrequency = 80) => {
      if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin")) throw new Error("Node#Info#plugins does not include the lavadspx plugin");
      if (this.player.node.info && !this.player.node.info?.filters?.includes("high-pass")) throw new Error("Node#Info#filters does not include the 'high-pass' Filter (Node has it not enable)");
      if (!this.data) this.data = {};
      if (!this.data.pluginFilters) this.data.pluginFilters = {};
      if (!this.data.pluginFilters["high-pass"]) this.data.pluginFilters["high-pass"] = {};
      if (this.filters.lavalinkLavaDspxPlugin.highPass) {
        delete this.data.pluginFilters["high-pass"];
      } else {
        this.data.pluginFilters["high-pass"] = {
          boostFactor,
          cutoffFrequency
        };
      }
      this.filters.lavalinkLavaDspxPlugin.highPass = !this.filters.lavalinkLavaDspxPlugin.highPass;
      await this.applyPlayerFilters();
      return this.filters.lavalinkLavaDspxPlugin.highPass;
    },
    /**
     * Enables / Disables the Normalization effect.
     * @param {number} [maxAmplitude=0.75] - The maximum amplitude of the audio.
     * @param {boolean} [adaptive=true] - Whether to use adaptive normalization or not.
     * @returns {Promise<boolean>} - The state of the filter after execution.
     */
    toggleNormalization: async (maxAmplitude = 0.75, adaptive = true) => {
      if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin")) throw new Error("Node#Info#plugins does not include the lavadspx plugin");
      if (this.player.node.info && !this.player.node.info?.filters?.includes("normalization")) throw new Error("Node#Info#filters does not include the 'normalization' Filter (Node has it not enable)");
      if (!this.data) this.data = {};
      if (!this.data.pluginFilters) this.data.pluginFilters = {};
      if (!this.data.pluginFilters.normalization) this.data.pluginFilters.normalization = {};
      if (this.filters.lavalinkLavaDspxPlugin.normalization) {
        delete this.data.pluginFilters.normalization;
      } else {
        this.data.pluginFilters.normalization = {
          adaptive,
          maxAmplitude
        };
      }
      this.filters.lavalinkLavaDspxPlugin.normalization = !this.filters.lavalinkLavaDspxPlugin.normalization;
      await this.applyPlayerFilters();
      return this.filters.lavalinkLavaDspxPlugin.normalization;
    },
    /**
     * Enables / Disables the Echo effect, IMPORTANT! Only works with the correct Lavalink Plugin installed. (Optional: provide your Own Data)
     * @param {number} [decay=0.5] - The decay of the echo effect.
     * @param {number} [echoLength=0.5] - The length of the echo effect.
     * @returns {Promise<boolean>} - The state of the filter after execution.
     */
    toggleEcho: async (decay = 0.5, echoLength = 0.5) => {
      if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin")) throw new Error("Node#Info#plugins does not include the lavadspx plugin");
      if (this.player.node.info && !this.player.node.info?.filters?.includes("echo")) throw new Error("Node#Info#filters does not include the 'echo' Filter (Node has it not enable)");
      if (!this.data) this.data = {};
      if (!this.data.pluginFilters) this.data.pluginFilters = {};
      if (!this.data.pluginFilters.echo) this.data.pluginFilters.echo = {};
      if (this.filters.lavalinkLavaDspxPlugin.echo) {
        delete this.data.pluginFilters.echo;
      } else {
        this.data.pluginFilters.echo = {
          decay,
          echoLength
        };
      }
      this.filters.lavalinkLavaDspxPlugin.echo = !this.filters.lavalinkLavaDspxPlugin.echo;
      await this.applyPlayerFilters();
      return this.filters.lavalinkLavaDspxPlugin.echo;
    }
  };
  lavalinkFilterPlugin = {
    /**
     * Enables / Disables the Echo effect, IMPORTANT! Only works with the correct Lavalink Plugin installed. (Optional: provide your Own Data)
     * @param delay
     * @param decay
     * @returns
     */
    toggleEcho: async (delay = 4, decay = 0.8) => {
      if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavalink-filter-plugin")) throw new Error("Node#Info#plugins does not include the lavalink-filter-plugin plugin");
      if (this.player.node.info && !this.player.node.info?.filters?.includes("echo")) throw new Error("Node#Info#filters does not include the 'echo' Filter (Node has it not enable aka not installed!)");
      if (!this.data) this.data = {};
      if (!this.data.pluginFilters) this.data.pluginFilters = {};
      if (!this.data.pluginFilters["lavalink-filter-plugin"]) this.data.pluginFilters["lavalink-filter-plugin"] = { echo: { decay: 0, delay: 0 }, reverb: { delays: [], gains: [] } };
      if (!this.data.pluginFilters["lavalink-filter-plugin"].echo) this.data.pluginFilters["lavalink-filter-plugin"].echo = { decay: 0, delay: 0 };
      this.data.pluginFilters["lavalink-filter-plugin"].echo.delay = this.filters.lavalinkFilterPlugin.echo ? 0 : delay;
      this.data.pluginFilters["lavalink-filter-plugin"].echo.decay = this.filters.lavalinkFilterPlugin.echo ? 0 : decay;
      this.filters.lavalinkFilterPlugin.echo = !this.filters.lavalinkFilterPlugin.echo;
      await this.applyPlayerFilters();
      return this.filters.lavalinkFilterPlugin.echo;
    },
    /**
     * Enables / Disables the Echo effect, IMPORTANT! Only works with the correct Lavalink Plugin installed. (Optional: provide your Own Data)
     * @param delays
     * @param gains
     * @returns
     */
    toggleReverb: async (delays = [0.037, 0.042, 0.048, 0.053], gains = [0.84, 0.83, 0.82, 0.81]) => {
      if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavalink-filter-plugin")) throw new Error("Node#Info#plugins does not include the lavalink-filter-plugin plugin");
      if (this.player.node.info && !this.player.node.info?.filters?.includes("reverb")) throw new Error("Node#Info#filters does not include the 'reverb' Filter (Node has it not enable aka not installed!)");
      if (!this.data) this.data = {};
      if (!this.data.pluginFilters) this.data.pluginFilters = {};
      if (!this.data.pluginFilters["lavalink-filter-plugin"]) this.data.pluginFilters["lavalink-filter-plugin"] = { echo: { decay: 0, delay: 0 }, reverb: { delays: [], gains: [] } };
      if (!this.data.pluginFilters["lavalink-filter-plugin"].reverb) this.data.pluginFilters["lavalink-filter-plugin"].reverb = { delays: [], gains: [] };
      this.data.pluginFilters["lavalink-filter-plugin"].reverb.delays = this.filters.lavalinkFilterPlugin.reverb ? [] : delays;
      this.data.pluginFilters["lavalink-filter-plugin"].reverb.gains = this.filters.lavalinkFilterPlugin.reverb ? [] : gains;
      this.filters.lavalinkFilterPlugin.reverb = !this.filters.lavalinkFilterPlugin.reverb;
      await this.applyPlayerFilters();
      return this.filters.lavalinkFilterPlugin.reverb;
    }
  };
  /**
   * Enables / Disables a Nightcore-like filter Effect. Disables/Overrides both: custom and Vaporwave Filter
   * @param speed
   * @param pitch
   * @param rate
   * @returns
   */
  async toggleNightcore(speed = 1.289999523162842, pitch = 1.289999523162842, rate = 0.9365999523162842) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale")) throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
    this.data.timescale.speed = this.filters.nightcore ? 1 : speed;
    this.data.timescale.pitch = this.filters.nightcore ? 1 : pitch;
    this.data.timescale.rate = this.filters.nightcore ? 1 : rate;
    this.filters.nightcore = !this.filters.nightcore;
    this.filters.vaporwave = false;
    this.filters.custom = false;
    await this.applyPlayerFilters();
    return this.filters.nightcore;
  }
  /**
   * Enables / Disables a Vaporwave-like filter Effect. Disables/Overrides both: custom and nightcore Filter
   * @param speed
   * @param pitch
   * @param rate
   * @returns
   */
  async toggleVaporwave(speed = 0.8500000238418579, pitch = 0.800000011920929, rate = 1) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale")) throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
    this.data.timescale.speed = this.filters.vaporwave ? 1 : speed;
    this.data.timescale.pitch = this.filters.vaporwave ? 1 : pitch;
    this.data.timescale.rate = this.filters.vaporwave ? 1 : rate;
    this.filters.vaporwave = !this.filters.vaporwave;
    this.filters.nightcore = false;
    this.filters.custom = false;
    await this.applyPlayerFilters();
    return this.filters.vaporwave;
  }
  /**
   * Enable / Disables a Karaoke like Filter Effect
   * @param level
   * @param monoLevel
   * @param filterBand
   * @param filterWidth
   * @returns
   */
  async toggleKaraoke(level = 1, monoLevel = 1, filterBand = 220, filterWidth = 100) {
    if (this.player.node.info && !this.player.node.info?.filters?.includes("karaoke")) throw new Error("Node#Info#filters does not include the 'karaoke' Filter (Node has it not enable)");
    this.data.karaoke.level = this.filters.karaoke ? 0 : level;
    this.data.karaoke.monoLevel = this.filters.karaoke ? 0 : monoLevel;
    this.data.karaoke.filterBand = this.filters.karaoke ? 0 : filterBand;
    this.data.karaoke.filterWidth = this.filters.karaoke ? 0 : filterWidth;
    this.filters.karaoke = !this.filters.karaoke;
    await this.applyPlayerFilters();
    return this.filters.karaoke;
  }
  /** Function to find out if currently there is a custom timescamle etc. filter applied */
  isCustomFilterActive() {
    this.filters.custom = !this.filters.nightcore && !this.filters.vaporwave && Object.values(this.data.timescale).some((d) => d !== 1);
    return this.filters.custom;
  }
  /**
  * Sets the players equalizer band on-top of the existing ones.
  * @param bands
  */
  async setEQ(bands) {
    if (!Array.isArray(bands)) bands = [bands];
    if (!bands.length || !bands.every((band) => safeStringify(Object.keys(band).sort()) === '["band","gain"]')) throw new TypeError("Bands must be a non-empty object array containing 'band' and 'gain' properties.");
    for (const { band, gain } of bands) this.equalizerBands[band] = { band, gain };
    if (!this.player.node.sessionId) throw new Error("The Lavalink-Node is either not ready or not up to date");
    const now = performance.now();
    if (this.player.options.instaUpdateFiltersFix === true) this.filterUpdatedState = true;
    await this.player.node.updatePlayer({
      guildId: this.player.guildId,
      playerOptions: {
        filters: { equalizer: this.equalizerBands }
      }
    });
    this.player.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    return this;
  }
  /** Clears the equalizer bands. */
  async clearEQ() {
    return this.setEQ(Array.from({ length: 15 }, (_v, i) => ({ band: i, gain: 0 })));
  }
};

// src/structures/Queue.ts
var QueueSaver = class {
  /**
   * The queue store manager
   */
  _;
  /**
   * The options for the queue saver
   */
  options;
  constructor(options) {
    this._ = options?.queueStore || new DefaultQueueStore();
    this.options = {
      maxPreviousTracks: options?.maxPreviousTracks || 25
    };
  }
  /**
   * Get the queue for a guild
   * @param guildId The guild ID
   * @returns The queue for the guild
   */
  async get(guildId) {
    return this._.parse(await this._.get(guildId));
  }
  /**
   * Delete the queue for a guild
   * @param guildId The guild ID
   * @returns The queue for the guild
   */
  async delete(guildId) {
    return this._.delete(guildId);
  }
  /**
   * Set the queue for a guild
   * @param guildId The guild ID
   * @param valueToStringify The queue to set
   * @returns The queue for the guild
   */
  async set(guildId, valueToStringify) {
    return this._.set(guildId, await this._.stringify(valueToStringify));
  }
  /**
   * Sync the queue for a guild
   * @param guildId The guild ID
   * @returns The queue for the guild
   */
  async sync(guildId) {
    return this.get(guildId);
  }
};
var DefaultQueueStore = class {
  data = new MiniMap();
  constructor() {
  }
  /**
   * Get the queue for a guild
   * @param guildId The guild ID
   * @returns The queue for the guild
   */
  get(guildId) {
    return this.data.get(guildId);
  }
  /**
   * Set the queue for a guild
   * @param guildId The guild ID
   * @param valueToStringify The queue to set
   * @returns The queue for the guild
   */
  set(guildId, valueToStringify) {
    return this.data.set(guildId, valueToStringify) ? true : false;
  }
  /**
   * Delete the queue for a guild
   * @param guildId The guild ID
   * @returns The queue for the guild
   */
  delete(guildId) {
    return this.data.delete(guildId);
  }
  /**
   * Stringify the queue for a guild
   * @param value The queue to stringify
   * @returns The stringified queue
   */
  stringify(value) {
    return value;
  }
  /**
   * Parse the queue for a guild
   * @param value The queue to parse
   * @returns The parsed queue
   */
  parse(value) {
    return value;
  }
  /*
      // the base now has an Awaitable util type, so it allows both ASYNC as well as SYNC examples for all functions!
      // here are all functions as async, typed, if you want to copy-paste it
      async get(guildId: string): Promise<StoredQueue> {
          return this.data.get(guildId);
      }
      async set(guildId: string, valueToStringify): Promise<boolean> {
          return this.data.set(guildId, valueToStringify) ? true : false;
      }
      async delete(guildId: string) {
          return this.data.delete(guildId);
      }
      async stringify(value: StoredQueue | string): Promise<StoredQueue | string> {
          return value; // JSON.stringify(value);
      }
      async parse(value: StoredQueue | string): Promise<Partial<StoredQueue>> {
          return value as Partial<StoredQueue>; // JSON.parse(value)
      }
  */
};
var Queue = class {
  tracks = [];
  previous = [];
  current = null;
  options = { maxPreviousTracks: 25 };
  guildId = "";
  QueueSaver = null;
  managerUtils = new ManagerUtils();
  queueChanges;
  /**
   * Create a new Queue
   * @param guildId The guild ID
   * @param data The data to initialize the queue with
   * @param QueueSaver The queue saver to use
   * @param queueOptions
   */
  constructor(guildId, data = {}, QueueSaver2, queueOptions) {
    this.queueChanges = queueOptions.queueChangesWatcher || null;
    this.guildId = guildId;
    this.QueueSaver = QueueSaver2;
    this.options.maxPreviousTracks = this.QueueSaver?.options?.maxPreviousTracks ?? this.options.maxPreviousTracks;
    this.current = this.managerUtils.isTrack(data.current) ? data.current : null;
    this.previous = Array.isArray(data.previous) && data.previous.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) ? data.previous.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) : [];
    this.tracks = Array.isArray(data.tracks) && data.tracks.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) ? data.tracks.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) : [];
    Object.defineProperty(this, QueueSymbol, { configurable: true, value: true });
  }
  /**
   * Utils for a Queue
   */
  utils = {
    /**
     * Save the current cached Queue on the database/server (overides the server)
     */
    save: async () => {
      if (this.previous.length > this.options.maxPreviousTracks) this.previous.splice(this.options.maxPreviousTracks, this.previous.length);
      return await this.QueueSaver.set(this.guildId, this.utils.toJSON());
    },
    /**
     * Sync the current queue database/server with the cached one
     * @returns {void}
     */
    sync: async (override = true, dontSyncCurrent = true) => {
      const data = await this.QueueSaver.get(this.guildId);
      if (!data) throw new Error(`No data found to sync for guildId: ${this.guildId}`);
      if (!dontSyncCurrent && !this.current && this.managerUtils.isTrack(data.current)) this.current = data.current;
      if (Array.isArray(data.tracks) && data?.tracks.length && data.tracks.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track))) this.tracks.splice(override ? 0 : this.tracks.length, override ? this.tracks.length : 0, ...data.tracks.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)));
      if (Array.isArray(data.previous) && data?.previous.length && data.previous.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track))) this.previous.splice(0, override ? this.tracks.length : 0, ...data.previous.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)));
      await this.utils.save();
      return;
    },
    destroy: async () => {
      return await this.QueueSaver.delete(this.guildId);
    },
    /**
     * @returns {{current:Track|null, previous:Track[], tracks:Track[]}}The Queue, but in a raw State, which allows easier handling for the QueueStoreManager
     */
    toJSON: () => {
      if (this.previous.length > this.options.maxPreviousTracks) this.previous.splice(this.options.maxPreviousTracks, this.previous.length);
      return {
        current: this.current ? { ...this.current } : null,
        previous: this.previous ? [...this.previous] : [],
        tracks: this.tracks ? [...this.tracks] : []
      };
    },
    /**
     * Get the Total Duration of the Queue-Songs summed up
     * @returns {number}
     */
    totalDuration: () => {
      return this.tracks.reduce((acc, cur) => acc + (cur.info.duration || 0), this.current?.info.duration || 0);
    }
  };
  /**
   * Shuffles the current Queue, then saves it
   * @returns Amount of Tracks in the Queue
   */
  async shuffle() {
    const oldStored = typeof this.queueChanges?.shuffled === "function" ? this.utils.toJSON() : null;
    if (this.tracks.length <= 1) return this.tracks.length;
    if (this.tracks.length === 2) {
      [this.tracks[0], this.tracks[1]] = [this.tracks[1], this.tracks[0]];
    } else {
      for (let i = this.tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
      }
    }
    if (typeof this.queueChanges?.shuffled === "function") this.queueChanges.shuffled(this.guildId, oldStored, this.utils.toJSON());
    await this.utils.save();
    return this.tracks.length;
  }
  /**
   * Add a Track to the Queue, and after saved in the "db" it returns the amount of the Tracks
   * @param {Track | Track[]} TrackOrTracks
   * @param {number} index At what position to add the Track
   * @returns {number} Queue-Size (for the next Tracks)
   */
  async add(TrackOrTracks, index) {
    if (typeof index === "number" && index >= 0 && index < this.tracks.length) {
      return await this.splice(index, 0, (Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).flat(2).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)));
    }
    const oldStored = typeof this.queueChanges?.tracksAdd === "function" ? this.utils.toJSON() : null;
    this.tracks.push(...(Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).flat(2).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)));
    if (typeof this.queueChanges?.tracksAdd === "function") try {
      this.queueChanges.tracksAdd(this.guildId, (Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).flat(2).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)), this.tracks.length, oldStored, this.utils.toJSON());
    } catch {
    }
    await this.utils.save();
    return this.tracks.length;
  }
  /**
   * Splice the tracks in the Queue
   * @param {number} index Where to remove the Track
   * @param {number} amount How many Tracks to remove?
   * @param {Track | Track[]} TrackOrTracks Want to Add more Tracks?
   * @returns {Track} Spliced Track
   */
  async splice(index, amount, TrackOrTracks) {
    const oldStored = typeof this.queueChanges?.tracksAdd === "function" || typeof this.queueChanges?.tracksRemoved === "function" ? this.utils.toJSON() : null;
    if (!this.tracks.length) {
      if (TrackOrTracks) return await this.add(TrackOrTracks);
      return null;
    }
    if (TrackOrTracks && typeof this.queueChanges?.tracksAdd === "function") try {
      this.queueChanges.tracksAdd(this.guildId, (Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).flat(2).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)), index, oldStored, this.utils.toJSON());
    } catch {
    }
    let spliced = TrackOrTracks ? this.tracks.splice(index, amount, ...(Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).flat(2).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v))) : this.tracks.splice(index, amount);
    spliced = Array.isArray(spliced) ? spliced : [spliced];
    if (typeof this.queueChanges?.tracksRemoved === "function") try {
      this.queueChanges.tracksRemoved(this.guildId, spliced, index, oldStored, this.utils.toJSON());
    } catch {
    }
    await this.utils.save();
    return spliced.length === 1 ? spliced[0] : spliced;
  }
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
  async remove(removeQueryTrack) {
    const oldStored = typeof this.queueChanges?.tracksRemoved === "function" ? this.utils.toJSON() : null;
    if (typeof removeQueryTrack === "number") {
      const toRemove2 = this.tracks[removeQueryTrack];
      if (!toRemove2) return null;
      const removed2 = this.tracks.splice(removeQueryTrack, 1);
      if (typeof this.queueChanges?.tracksRemoved === "function") try {
        this.queueChanges.tracksRemoved(this.guildId, removed2, removeQueryTrack, oldStored, this.utils.toJSON());
      } catch {
      }
      await this.utils.save();
      return { removed: removed2 };
    }
    if (Array.isArray(removeQueryTrack)) {
      if (removeQueryTrack.every((v) => typeof v === "number")) {
        const removed3 = [];
        for (const i of removeQueryTrack) {
          if (this.tracks[i]) {
            removed3.push(...this.tracks.splice(i, 1));
          }
        }
        if (!removed3.length) return null;
        if (typeof this.queueChanges?.tracksRemoved === "function") try {
          this.queueChanges.tracksRemoved(this.guildId, removed3, removeQueryTrack, oldStored, this.utils.toJSON());
        } catch {
        }
        await this.utils.save();
        return { removed: removed3 };
      }
      const tracksToRemove = this.tracks.map((v, i) => ({ v, i })).filter(({ v, i }) => removeQueryTrack.find(
        (t) => typeof t === "number" && t === i || typeof t === "object" && (t.encoded && t.encoded === v.encoded || t.info?.identifier && t.info.identifier === v.info?.identifier || t.info?.uri && t.info.uri === v.info?.uri || t.info?.title && t.info.title === v.info?.title || t.info?.isrc && t.info.isrc === v.info?.isrc || t.info?.artworkUrl && t.info.artworkUrl === v.info?.artworkUrl)
      ));
      if (!tracksToRemove.length) return null;
      const removed2 = [];
      for (const { i } of tracksToRemove) {
        if (this.tracks[i]) {
          removed2.push(...this.tracks.splice(i, 1));
        }
      }
      if (typeof this.queueChanges?.tracksRemoved === "function") try {
        this.queueChanges.tracksRemoved(this.guildId, removed2, tracksToRemove.map((v) => v.i), oldStored, this.utils.toJSON());
      } catch {
      }
      await this.utils.save();
      return { removed: removed2 };
    }
    const toRemove = this.tracks.findIndex(
      (v) => removeQueryTrack.encoded && removeQueryTrack.encoded === v.encoded || removeQueryTrack.info?.identifier && removeQueryTrack.info.identifier === v.info?.identifier || removeQueryTrack.info?.uri && removeQueryTrack.info.uri === v.info?.uri || removeQueryTrack.info?.title && removeQueryTrack.info.title === v.info?.title || removeQueryTrack.info?.isrc && removeQueryTrack.info.isrc === v.info?.isrc || removeQueryTrack.info?.artworkUrl && removeQueryTrack.info.artworkUrl === v.info?.artworkUrl
    );
    if (toRemove < 0) return null;
    const removed = this.tracks.splice(toRemove, 1);
    if (typeof this.queueChanges?.tracksRemoved === "function") try {
      this.queueChanges.tracksRemoved(this.guildId, removed, toRemove, oldStored, this.utils.toJSON());
    } catch {
    }
    await this.utils.save();
    return { removed };
  }
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
  async shiftPrevious() {
    const removed = this.previous.shift();
    if (removed) await this.utils.save();
    return removed ?? null;
  }
};

// src/structures/Player.ts
var Player = class {
  /** Filter Manager per player */
  filterManager;
  /** circular reference to the lavalink Manager from the Player for easier use */
  LavalinkManager;
  /** Player options currently used, mutation doesn't affect player's state */
  options;
  /** The lavalink node assigned the the player, don't change it manually */
  node;
  /** The queue from the player */
  queue;
  /** The Guild Id of the Player */
  guildId;
  /** The Voice Channel Id of the Player */
  voiceChannelId = null;
  /** The Text Channel Id of the Player */
  textChannelId = null;
  /** States if the Bot is supposed to be outputting audio */
  playing = false;
  /** States if the Bot is paused or not */
  paused = false;
  /** Repeat Mode of the Player */
  repeatMode = "off";
  /** Player's ping */
  ping = {
    /* Response time for rest actions with Lavalink Server */
    lavalink: 0,
    /* Latency of the Discord's Websocket Voice Server */
    ws: 0
  };
  /** The Display Volume */
  volume = 100;
  /** The Volume Lavalink actually is outputting */
  lavalinkVolume = 100;
  /** The current Positin of the player (Calculated) */
  get position() {
    return this.lastPosition + (this.lastPositionChange ? Date.now() - this.lastPositionChange : 0);
  }
  /** The timestamp when the last position change update happened */
  lastPositionChange = null;
  /** The current Positin of the player (from Lavalink) */
  lastPosition = 0;
  lastSavedPosition = 0;
  /** When the player was created [Timestamp in Ms] (from lavalink) */
  createdTimeStamp;
  /** The Player Connection's State (from Lavalink) */
  connected = false;
  /** Voice Server Data (from Lavalink) */
  voice = {
    endpoint: null,
    sessionId: null,
    token: null
  };
  voiceState = {
    selfDeaf: false,
    selfMute: false,
    serverDeaf: false,
    serverMute: false,
    suppress: false
  };
  /** Custom data for the player */
  data = {};
  /**
   * Create a new Player
   * @param options
   * @param LavalinkManager
   */
  constructor(options, LavalinkManager2, dontEmitPlayerCreateEvent) {
    if (typeof options?.customData === "object") for (const [key, value] of Object.entries(options.customData)) this.set(key, value);
    this.options = options;
    this.filterManager = new FilterManager(this);
    this.LavalinkManager = LavalinkManager2;
    this.guildId = this.options.guildId;
    this.voiceChannelId = this.options.voiceChannelId;
    this.textChannelId = this.options.textChannelId || null;
    this.node = typeof this.options.node === "string" ? this.LavalinkManager.nodeManager.nodes.get(this.options.node) : this.options.node;
    if (!this.node || typeof this.node.request !== "function") {
      if (typeof this.options.node === "string" && this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "PlayerCreateNodeNotFound" /* PlayerCreateNodeNotFound */, {
          state: "warn",
          message: `Player was created with provided node Id: ${this.options.node}, but no node with that Id was found.`,
          functionLayer: "Player > constructor()"
        });
      }
      const least = this.LavalinkManager.nodeManager.leastUsedNodes();
      this.node = least.filter((v) => options.vcRegion ? v.options?.regions?.includes(options.vcRegion) : true)[0] || least[0] || null;
    }
    if (!this.node) throw new Error("No available Node was found, please add a LavalinkNode to the Manager via Manager.NodeManager#createNode");
    if (typeof options.volume === "number" && !isNaN(options.volume)) this.volume = Number(options.volume);
    this.volume = Math.round(Math.max(Math.min(this.volume, 1e3), 0));
    this.lavalinkVolume = Math.round(Math.max(Math.min(Math.round(
      this.LavalinkManager.options.playerOptions.volumeDecrementer ? this.volume * this.LavalinkManager.options.playerOptions.volumeDecrementer : this.volume
    ), 1e3), 0));
    if (!dontEmitPlayerCreateEvent) this.LavalinkManager.emit("playerCreate", this);
    this.queue = new Queue(this.guildId, {}, new QueueSaver(this.LavalinkManager.options.queueOptions), this.LavalinkManager.options.queueOptions);
  }
  /**
   * Set custom data.
   * @param key
   * @param value
   */
  set(key, value) {
    this.data[key] = value;
    return this;
  }
  /**
   * Get custom data.
   * @param key
   */
  get(key) {
    return this.data[key];
  }
  /**
   * CLears all the custom data.
   */
  clearData() {
    const toKeep = Object.keys(this.data).filter((v) => v.startsWith("internal_"));
    for (const key in this.data) {
      if (toKeep.includes(key)) continue;
      delete this.data[key];
    }
    return this;
  }
  /**
   * Get all custom Data
   */
  getAllData() {
    return Object.fromEntries(Object.entries(this.data).filter((v) => !v[0].startsWith("internal_")));
  }
  /**
   * Play the next track from the queue / a specific track, with playoptions for Lavalink
   * @param options
   */
  async play(options = {}) {
    if (this.get("internal_queueempty")) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "PlayerPlayQueueEmptyTimeoutClear" /* PlayerPlayQueueEmptyTimeoutClear */, {
          state: "log",
          message: `Player was called to play something, while there was a queueEmpty Timeout set, clearing the timeout.`,
          functionLayer: "Player > play()"
        });
      }
      this.LavalinkManager.emit("playerQueueEmptyCancel", this);
      clearTimeout(this.get("internal_queueempty"));
      this.set("internal_queueempty", void 0);
    }
    if (options?.clientTrack && (this.LavalinkManager.utils.isTrack(options?.clientTrack) || this.LavalinkManager.utils.isUnresolvedTrack(options.clientTrack))) {
      if (this.LavalinkManager.utils.isUnresolvedTrack(options.clientTrack)) {
        try {
          await options.clientTrack.resolve(this);
        } catch (error) {
          if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
            this.LavalinkManager.emit("debug", "PlayerPlayUnresolvedTrackFailed" /* PlayerPlayUnresolvedTrackFailed */, {
              state: "error",
              error,
              message: `Player Play was called with clientTrack, Song is unresolved, but couldn't resolve it`,
              functionLayer: "Player > play() > resolve currentTrack"
            });
          }
          this.LavalinkManager.emit("trackError", this, this.queue.current, error);
          if (options && "clientTrack" in options) delete options.clientTrack;
          if (options && "track" in options) delete options.track;
          if (this.LavalinkManager.options?.autoSkipOnResolveError === true && this.queue.tracks[0]) return this.play(options);
          return this;
        }
      }
      if ((typeof options.track?.userData === "object" || typeof options.clientTrack?.userData === "object") && options.clientTrack) options.clientTrack.userData = {
        ...typeof options?.clientTrack?.requester === "object" ? { requester: this.LavalinkManager.utils.getTransformedRequester(options?.clientTrack?.requester || {}) } : {},
        ...options?.clientTrack.userData,
        ...options.track?.userData
      };
      options.track = {
        encoded: options.clientTrack?.encoded,
        requester: options.clientTrack?.requester,
        userData: options.clientTrack?.userData
      };
    }
    if (options?.track?.encoded || options?.track?.identifier) {
      this.queue.current = options.clientTrack || null;
      this.queue.utils.save();
      if (typeof options?.volume === "number" && !isNaN(options?.volume)) {
        this.volume = Math.max(Math.min(options?.volume, 500), 0);
        let vol = Number(this.volume);
        if (this.LavalinkManager.options.playerOptions.volumeDecrementer) vol *= this.LavalinkManager.options.playerOptions.volumeDecrementer;
        this.lavalinkVolume = Math.round(vol);
        options.volume = this.lavalinkVolume;
      }
      const track = Object.fromEntries(Object.entries({
        encoded: options.track.encoded,
        identifier: options.track.identifier,
        userData: {
          ...typeof options?.track?.requester === "object" ? { requester: this.LavalinkManager.utils.getTransformedRequester(options?.track?.requester || {}) } : {},
          ...options.track.userData
        }
      }).filter((v) => typeof v[1] !== "undefined"));
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "PlayerPlayWithTrackReplace" /* PlayerPlayWithTrackReplace */, {
          state: "log",
          message: `Player was called to play something, with a specific track provided. Replacing the current Track and resolving the track on trackStart Event.`,
          functionLayer: "Player > play()"
        });
      }
      return this.node.updatePlayer({
        guildId: this.guildId,
        noReplace: false,
        playerOptions: Object.fromEntries(Object.entries({
          track,
          position: options.position ?? void 0,
          paused: options.paused ?? void 0,
          endTime: options?.endTime ?? void 0,
          filters: options?.filters ?? void 0,
          volume: options.volume ?? this.lavalinkVolume ?? void 0,
          voice: options.voice ?? void 0
        }).filter((v) => typeof v[1] !== "undefined"))
      });
    }
    if (!this.queue.current && this.queue.tracks.length) await queueTrackEnd(this);
    if (this.queue.current && this.LavalinkManager.utils.isUnresolvedTrack(this.queue.current)) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "PlayerPlayUnresolvedTrack" /* PlayerPlayUnresolvedTrack */, {
          state: "log",
          message: `Player Play was called, current Queue Song is unresolved, resolving the track.`,
          functionLayer: "Player > play()"
        });
      }
      try {
        await this.queue.current.resolve(this);
        if (typeof options.track?.userData === "object" && this.queue.current) this.queue.current.userData = {
          ...typeof this.queue.current?.requester === "object" ? { requester: this.LavalinkManager.utils.getTransformedRequester(this.queue.current?.requester || {}) } : {},
          ...this.queue.current?.userData,
          ...options.track?.userData
        };
      } catch (error) {
        if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
          this.LavalinkManager.emit("debug", "PlayerPlayUnresolvedTrackFailed" /* PlayerPlayUnresolvedTrackFailed */, {
            state: "error",
            error,
            message: `Player Play was called, current Queue Song is unresolved, but couldn't resolve it`,
            functionLayer: "Player > play() > resolve currentTrack"
          });
        }
        this.LavalinkManager.emit("trackError", this, this.queue.current, error);
        if (options && "clientTrack" in options) delete options.clientTrack;
        if (options && "track" in options) delete options.track;
        await queueTrackEnd(this, true);
        if (this.LavalinkManager.options?.autoSkipOnResolveError === true && this.queue.tracks[0]) return this.play(options);
        return this;
      }
    }
    if (!this.queue.current) throw new Error(`There is no Track in the Queue, nor provided in the PlayOptions`);
    if (typeof options?.volume === "number" && !isNaN(options?.volume)) {
      this.volume = Math.max(Math.min(options?.volume, 500), 0);
      let vol = Number(this.volume);
      if (this.LavalinkManager.options.playerOptions.volumeDecrementer) vol *= this.LavalinkManager.options.playerOptions.volumeDecrementer;
      this.lavalinkVolume = Math.round(vol);
      options.volume = this.lavalinkVolume;
    }
    const finalOptions = Object.fromEntries(Object.entries({
      track: {
        encoded: this.queue.current?.encoded || null,
        // identifier: options.identifier,
        userData: {
          ...typeof this.queue.current?.requester === "object" ? { requester: this.LavalinkManager.utils.getTransformedRequester(this.queue.current?.requester || {}) } : {},
          ...options?.track?.userData,
          ...this.queue.current?.userData
        }
      },
      volume: this.lavalinkVolume,
      position: options?.position ?? 0,
      endTime: options?.endTime ?? void 0,
      filters: options?.filters ?? void 0,
      paused: options?.paused ?? void 0,
      voice: options?.voice ?? void 0
    }).filter((v) => typeof v[1] !== "undefined"));
    if (typeof finalOptions.position !== "undefined" && isNaN(finalOptions.position) || typeof finalOptions.position === "number" && (finalOptions.position < 0 || finalOptions.position >= this.queue.current.info.duration)) throw new Error("PlayerOption#position must be a positive number, less than track's duration");
    if (typeof finalOptions.volume !== "undefined" && isNaN(finalOptions.volume) || typeof finalOptions.volume === "number" && finalOptions.volume < 0) throw new Error("PlayerOption#volume must be a positive number");
    if (typeof finalOptions.endTime !== "undefined" && isNaN(finalOptions.endTime) || typeof finalOptions.endTime === "number" && (finalOptions.endTime < 0 || finalOptions.endTime >= this.queue.current.info.duration)) throw new Error("PlayerOption#endTime must be a positive number, less than track's duration");
    if (typeof finalOptions.position === "number" && typeof finalOptions.endTime === "number" && finalOptions.endTime < finalOptions.position) throw new Error("PlayerOption#endTime must be bigger than PlayerOption#position");
    const now = performance.now();
    await this.node.updatePlayer({
      guildId: this.guildId,
      noReplace: options?.noReplace ?? false,
      playerOptions: finalOptions
    });
    this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    return this;
  }
  /**
   * Set the Volume for the Player
   * @param volume The Volume in percent
   * @param ignoreVolumeDecrementer If it should ignore the volumedecrementer option
   */
  async setVolume(volume, ignoreVolumeDecrementer = false) {
    volume = Number(volume);
    if (isNaN(volume)) throw new TypeError("Volume must be a number.");
    this.volume = Math.round(Math.max(Math.min(volume, 1e3), 0));
    this.lavalinkVolume = Math.round(Math.max(Math.min(Math.round(
      this.LavalinkManager.options.playerOptions.volumeDecrementer && !ignoreVolumeDecrementer ? this.volume * this.LavalinkManager.options.playerOptions.volumeDecrementer : this.volume
    ), 1e3), 0));
    const now = performance.now();
    if (this.LavalinkManager.options.playerOptions.applyVolumeAsFilter) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "PlayerVolumeAsFilter" /* PlayerVolumeAsFilter */, {
          state: "log",
          message: `Player Volume was set as a Filter, because LavalinkManager option "playerOptions.applyVolumeAsFilter" is true`,
          functionLayer: "Player > setVolume()"
        });
      }
      await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { filters: { volume: this.lavalinkVolume / 100 } } });
    } else {
      await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { volume: this.lavalinkVolume } });
    }
    this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    return this;
  }
  /**
   * Search for a track
   * @param query The query to search for
   * @param requestUser The user that requested the track
   * @param throwOnEmpty If an error should be thrown if no track is found
   * @returns The search result
   */
  async lavaSearch(query, requestUser, throwOnEmpty = false) {
    return this.node.lavaSearch(query, requestUser, throwOnEmpty);
  }
  /**
   * Set the SponsorBlock
   * @param segments The segments to set
   */
  async setSponsorBlock(segments = ["sponsor", "selfpromo"]) {
    return this.node.setSponsorBlock(this, segments);
  }
  /**
   * Get the SponsorBlock
   */
  async getSponsorBlock() {
    return this.node.getSponsorBlock(this);
  }
  /**
   * Delete the SponsorBlock
   */
  async deleteSponsorBlock() {
    return this.node.deleteSponsorBlock(this);
  }
  /**
   *
   * @param query Query for your data
   * @param requestUser
   */
  async search(query, requestUser, throwOnEmpty = false) {
    const Query = this.LavalinkManager.utils.transformQuery(query);
    if (["bcsearch", "bandcamp"].includes(Query.source) && !this.node.info.sourceManagers.includes("bandcamp")) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "BandcampSearchLokalEngine" /* BandcampSearchLokalEngine */, {
          state: "log",
          message: `Player.search was called with a Bandcamp Query, but no bandcamp search was enabled on lavalink, searching with the custom Search Engine.`,
          functionLayer: "Player > search()"
        });
      }
      return await bandCampSearch(this, Query.query, requestUser);
    }
    return this.node.search(Query, requestUser, throwOnEmpty);
  }
  /**
   * Pause the player
   */
  async pause() {
    if (this.paused && !this.playing) throw new Error("Player is already paused - not able to pause.");
    this.paused = true;
    this.lastPositionChange = null;
    const now = performance.now();
    await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { paused: true } });
    this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    this.LavalinkManager.emit("playerPaused", this, this.queue.current);
    return this;
  }
  /**
   * Resume the Player
   */
  async resume() {
    if (!this.paused) throw new Error("Player isn't paused - not able to resume.");
    this.paused = false;
    const now = performance.now();
    await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { paused: false } });
    this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    this.LavalinkManager.emit("playerResumed", this, this.queue.current);
    return this;
  }
  /**
   * Seek to a specific Position
   * @param position
   */
  async seek(position) {
    if (!this.queue.current) return void 0;
    position = Number(position);
    if (isNaN(position)) throw new RangeError("Position must be a number.");
    if (!this.queue.current.info.isSeekable || this.queue.current.info.isStream) throw new RangeError("Current Track is not seekable / a stream");
    if (position < 0 || position > this.queue.current.info.duration) position = Math.max(Math.min(position, this.queue.current.info.duration), 0);
    this.lastPositionChange = Date.now();
    this.lastPosition = position;
    const now = performance.now();
    await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { position } });
    this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    return this;
  }
  /**
   * Set the Repeatmode of the Player
   * @param repeatMode
   */
  async setRepeatMode(repeatMode) {
    if (!["off", "track", "queue"].includes(repeatMode)) throw new RangeError("Repeatmode must be either 'off', 'track', or 'queue'");
    this.repeatMode = repeatMode;
    return this;
  }
  /**
   * Skip the current song, or a specific amount of songs
   * @param amount provide the index of the next track to skip to
   */
  async skip(skipTo = 0, throwError = true) {
    if (!this.queue.tracks.length && (throwError || typeof skipTo === "boolean" && skipTo === true)) throw new RangeError("Can't skip more than the queue size");
    if (typeof skipTo === "number" && skipTo > 1) {
      if (skipTo > this.queue.tracks.length) throw new RangeError("Can't skip more than the queue size");
      await this.queue.splice(0, skipTo - 1);
    }
    if (!this.playing && !this.queue.current) return this.play(), this;
    const now = performance.now();
    this.set("internal_skipped", true);
    await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { track: { encoded: null }, paused: false } });
    this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    return this;
  }
  /**
   * Clears the queue and stops playing. Does not destroy the Player and not leave the channel
   * @returns
   */
  async stopPlaying(clearQueue = true, executeAutoplay = false) {
    this.set("internal_stopPlaying", true);
    if (this.queue.tracks.length && clearQueue === true) await this.queue.splice(0, this.queue.tracks.length);
    if (executeAutoplay === false) this.set("internal_autoplayStopPlaying", true);
    else this.set("internal_autoplayStopPlaying", void 0);
    const now = performance.now();
    await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { track: { encoded: null } } });
    this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
    return this;
  }
  /**
   * Connects the Player to the Voice Channel
   * @returns
   */
  async connect() {
    if (!this.options.voiceChannelId) throw new RangeError("No Voice Channel id has been set. (player.options.voiceChannelId)");
    await this.LavalinkManager.options.sendToShard(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: this.options.voiceChannelId,
        self_mute: this.options.selfMute ?? false,
        self_deaf: this.options.selfDeaf ?? true
      }
    });
    this.voiceChannelId = this.options.voiceChannelId;
    return this;
  }
  async changeVoiceState(data) {
    if (this.options.voiceChannelId === data.voiceChannelId) throw new RangeError("New Channel can't be equal to the old Channel.");
    await this.LavalinkManager.options.sendToShard(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: data.voiceChannelId,
        self_mute: data.selfMute ?? this.options.selfMute ?? false,
        self_deaf: data.selfDeaf ?? this.options.selfDeaf ?? true
      }
    });
    this.options.voiceChannelId = data.voiceChannelId;
    this.options.selfMute = data.selfMute;
    this.options.selfDeaf = data.selfDeaf;
    this.voiceChannelId = data.voiceChannelId;
    return this;
  }
  /**
   * Disconnects the Player from the Voice Channel, but keeps the player in the cache
   * @param force If false it throws an error, if player thinks it's already disconnected
   * @returns
   */
  async disconnect(force = false) {
    if (!force && !this.options.voiceChannelId) throw new RangeError("No Voice Channel id has been set. (player.options.voiceChannelId)");
    await this.LavalinkManager.options.sendToShard(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: null,
        self_mute: false,
        self_deaf: false
      }
    });
    this.voiceChannelId = null;
    return this;
  }
  /**
   * Destroy the player and disconnect from the voice channel
   */
  async destroy(reason, disconnect = true) {
    if (this.LavalinkManager.options.advancedOptions?.debugOptions.playerDestroy.debugLog) console.log(`Nazha-Client-Debug | PlayerDestroy [::] destroy Function, [guildId ${this.guildId}] - Destroy-Reason: ${String(reason)}`);
    if (this.get("internal_queueempty")) {
      clearTimeout(this.get("internal_queueempty"));
      this.set("internal_queueempty", void 0);
    }
    if (this.get("internal_destroystatus") === true) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "PlayerDestroyingSomewhereElse" /* PlayerDestroyingSomewhereElse */, {
          state: "warn",
          message: `Player is already destroying somewhere else..`,
          functionLayer: "Player > destroy()"
        });
      }
      if (this.LavalinkManager.options.advancedOptions?.debugOptions.playerDestroy.debugLog) console.log(`Nazha-Client-Debug | PlayerDestroy [::] destroy Function, [guildId ${this.guildId}] - Already destroying somewhere else..`);
      return;
    }
    this.set("internal_destroystatus", true);
    if (disconnect) await this.disconnect(true);
    else this.set("internal_destroywithoutdisconnect", true);
    await this.queue.utils.destroy();
    this.LavalinkManager.deletePlayer(this.guildId);
    await this.node.destroyPlayer(this.guildId);
    if (this.LavalinkManager.options.advancedOptions?.debugOptions.playerDestroy.debugLog) console.log(`Nazha-Client-Debug | PlayerDestroy [::] destroy Function, [guildId ${this.guildId}] - Player got destroyed successfully`);
    this.LavalinkManager.emit("playerDestroy", this, reason);
    return this;
  }
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
  async getCurrentLyrics(skipTrackSource) {
    return await this.node.lyrics.getCurrent(this.guildId, skipTrackSource);
  }
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
  async getLyrics(track, skipTrackSource) {
    return await this.node.lyrics.get(track, skipTrackSource);
  }
  /**
   * Subscribe to the lyrics event on a specific guild to active live lyrics events
   * @returns The unsubscribe function
   * @example
   * ```ts
   * const lyrics = await player.subscribeLyrics();
   * ```
   */
  subscribeLyrics() {
    return this.node.lyrics.subscribe(this.guildId);
  }
  /**
   * Unsubscribe from the lyrics event on a specific guild to disable live lyrics events
   * @returns The unsubscribe function
   * @example
   * ```ts
   * const lyrics = await player.unsubscribeLyrics();
   * ```
   */
  unsubscribeLyrics() {
    return this.node.lyrics.unsubscribe(this.guildId);
  }
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
  async changeNode(newNode, checkSources = true) {
    const updateNode = typeof newNode === "string" ? this.LavalinkManager.nodeManager.nodes.get(newNode) : newNode;
    if (!updateNode) throw new Error("Could not find the new Node");
    if (!updateNode.connected) throw new Error("The provided Node is not active or disconnected");
    if (this.node.id === updateNode.id) throw new Error("Player is already on the provided Node");
    if (this.get("internal_nodeChanging") === true) throw new Error("Player is already changing the node please wait");
    if (checkSources) {
      const isDefaultSource = () => {
        try {
          this.LavalinkManager.utils.validateSourceString(updateNode, this.LavalinkManager.options.playerOptions.defaultSearchPlatform);
          return true;
        } catch {
          return false;
        }
      };
      if (!isDefaultSource()) throw new RangeError(`defaultSearchPlatform "${this.LavalinkManager.options.playerOptions.defaultSearchPlatform}" is not supported by the newNode`);
      if (this.queue.current || this.queue.tracks.length) {
        const trackSources = new Set([this.queue.current, ...this.queue.tracks].map((track) => track.info.sourceName));
        const missingSources = [...trackSources].filter(
          (source) => !updateNode.info.sourceManagers.includes(source)
        );
        if (missingSources.length)
          throw new RangeError(`Sources missing for Node ${updateNode.id}: ${missingSources.join(", ")}`);
      }
    }
    if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
      this.LavalinkManager.emit("debug", "PlayerChangeNode" /* PlayerChangeNode */, {
        state: "log",
        message: `Player.changeNode() was executed, trying to change from "${this.node.id}" to "${updateNode.id}"`,
        functionLayer: "Player > changeNode()"
      });
    }
    const data = this.toJSON();
    const currentTrack = this.queue.current;
    if (!this.voice.endpoint || !this.voice.sessionId || !this.voice.token)
      throw new Error("Voice Data is missing, can't change the node");
    this.set("internal_nodeChanging", true);
    if (this.node.connected) await this.node.destroyPlayer(this.guildId);
    this.node = updateNode;
    const now = performance.now();
    try {
      await this.connect();
      const hasSponsorBlock = this.node.info?.plugins?.find((v) => v.name === "sponsorblock-plugin");
      if (hasSponsorBlock) {
        const sponsorBlockCategories = this.get("internal_sponsorBlockCategories");
        if (Array.isArray(sponsorBlockCategories) && sponsorBlockCategories.length) {
          await this.setSponsorBlock(sponsorBlockCategories).catch((error) => {
            if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
              this.LavalinkManager.emit("debug", "PlayerChangeNode" /* PlayerChangeNode */, {
                state: "error",
                error,
                message: `Player > changeNode() Unable to set SponsorBlock Segments`,
                functionLayer: "Player > changeNode()"
              });
            }
          });
        } else {
          await this.setSponsorBlock().catch((error) => {
            if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
              this.LavalinkManager.emit("debug", "PlayerChangeNode" /* PlayerChangeNode */, {
                state: "error",
                error,
                message: `Player > changeNode() Unable to set SponsorBlock Segments`,
                functionLayer: "Player > changeNode()"
              });
            }
          });
        }
      }
      await this.node.updatePlayer({
        guildId: this.guildId,
        noReplace: false,
        playerOptions: {
          ...currentTrack && {
            track: currentTrack,
            position: data.lastPosition || 0,
            volume: this.lavalinkVolume,
            paused: this.paused
          },
          voice: {
            token: this.voice.token,
            endpoint: this.voice.endpoint,
            sessionId: this.voice.sessionId
          }
        }
      });
      this.filterManager.applyPlayerFilters();
      this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
      return this.node.id;
    } catch (error) {
      if (this.LavalinkManager.options?.advancedOptions?.enableDebugEvents) {
        this.LavalinkManager.emit("debug", "PlayerChangeNode" /* PlayerChangeNode */, {
          state: "error",
          error,
          message: `Player.changeNode() execution failed`,
          functionLayer: "Player > changeNode()"
        });
      }
      throw new Error(`Failed to change the node: ${error}`);
    } finally {
      this.set("internal_nodeChanging", void 0);
    }
  }
  /**
   * Move the player to a different node. If no node is provided, it will find the least used node that is not the same as the current node.
   * @param node the id of the node to move to
   * @returns the player
   * @throws RangeError if there is no available nodes.
   * @throws Error if the node to move to is the same as the current node.
   */
  async moveNode(node) {
    try {
      if (!node) node = Array.from(this.LavalinkManager.nodeManager.leastUsedNodes("playingPlayers")).find((n) => n.connected && n.options.id !== this.node.options.id).id;
      if (!node || !this.LavalinkManager.nodeManager.nodes.get(node)) throw new RangeError("No nodes are available.");
      if (this.node.options.id === node) return this;
      this.LavalinkManager.emit("debug", "PlayerChangeNode" /* PlayerChangeNode */, { state: "log", message: `Player.moveNode() was executed, trying to move from "${this.node.id}" to "${node}"`, functionLayer: "Player > moveNode()" });
      const updateNode = this.LavalinkManager.nodeManager.nodes.get(node);
      if (!updateNode) throw new RangeError("No nodes are available.");
      return await this.changeNode(updateNode);
    } catch (error) {
      throw new Error(`Failed to move the node: ${error}`);
    }
  }
  /** Converts the Player including Queue to a Json state */
  toJSON() {
    return {
      guildId: this.guildId,
      options: this.options,
      voiceChannelId: this.voiceChannelId,
      textChannelId: this.textChannelId,
      position: this.position,
      lastPosition: this.lastPosition,
      lastPositionChange: this.lastPositionChange,
      volume: this.volume,
      lavalinkVolume: this.lavalinkVolume,
      repeatMode: this.repeatMode,
      paused: this.paused,
      playing: this.playing,
      createdTimeStamp: this.createdTimeStamp,
      filters: this.filterManager?.data || {},
      equalizer: this.filterManager?.equalizerBands || [],
      nodeId: this.node?.id,
      nodeSessionId: this.node?.sessionId,
      ping: this.ping,
      queue: this.queue.utils.toJSON()
    };
  }
};

// src/structures/LavalinkManager.ts
var LavalinkManager = class extends EventEmitter2 {
  /**
   * Emit an event
   * @param event The event to emit
   * @param args The arguments to pass to the event
   * @returns
   */
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
  /**
   * Add an event listener
   * @param event The event to listen to
   * @param listener The listener to add
   * @returns
   */
  on(event, listener) {
    return super.on(event, listener);
  }
  /**
   * Add an event listener that only fires once
   * @param event The event to listen to
   * @param listener The listener to add
   * @returns
   */
  once(event, listener) {
    return super.once(event, listener);
  }
  /**
   * Remove an event listener
   * @param event The event to remove the listener from
   * @param listener The listener to remove
   * @returns
   */
  off(event, listener) {
    return super.off(event, listener);
  }
  /**
   * Remove an event listener
   * @param event The event to remove the listener from
   * @param listener The listener to remove
   * @returns
   */
  removeListener(event, listener) {
    return super.removeListener(event, listener);
  }
  /** The Options of LavalinkManager (changeable) */
  options;
  /** LavalinkManager's NodeManager to manage all Nodes */
  nodeManager;
  /** LavalinkManager's Utils Class */
  utils;
  /** Wether the manager was initiated or not */
  initiated = false;
  /** All Players stored in a MiniMap */
  players = new MiniMap();
  /**
   * Applies the options provided by the User
   * @param options
   * @returns
   */
  applyOptions(options) {
    const optionsToAssign = {
      ...options,
      client: {
        ...options?.client,
        id: options?.client?.id,
        username: options?.client?.username ?? "lavalink-client"
      },
      sendToShard: options?.sendToShard,
      autoMove: options?.autoMove ?? false,
      nodes: options?.nodes,
      playerClass: options?.playerClass ?? Player,
      playerOptions: {
        applyVolumeAsFilter: options?.playerOptions?.applyVolumeAsFilter ?? false,
        clientBasedPositionUpdateInterval: options?.playerOptions?.clientBasedPositionUpdateInterval ?? 100,
        defaultSearchPlatform: options?.playerOptions?.defaultSearchPlatform ?? "ytsearch",
        onDisconnect: {
          destroyPlayer: options?.playerOptions?.onDisconnect?.destroyPlayer ?? true,
          autoReconnect: options?.playerOptions?.onDisconnect?.autoReconnect ?? false,
          autoReconnectOnlyWithTracks: options?.playerOptions?.onDisconnect?.autoReconnectOnlyWithTracks ?? false
        },
        onEmptyQueue: {
          autoPlayFunction: options?.playerOptions?.onEmptyQueue?.autoPlayFunction ?? null,
          destroyAfterMs: options?.playerOptions?.onEmptyQueue?.destroyAfterMs ?? void 0
        },
        volumeDecrementer: options?.playerOptions?.volumeDecrementer ?? 1,
        requesterTransformer: options?.playerOptions?.requesterTransformer ?? null,
        useUnresolvedData: options?.playerOptions?.useUnresolvedData ?? false,
        minAutoPlayMs: options?.playerOptions?.minAutoPlayMs ?? 1e4,
        maxErrorsPerTime: {
          threshold: options?.playerOptions?.maxErrorsPerTime?.threshold ?? 35e3,
          maxAmount: options?.playerOptions?.maxErrorsPerTime?.maxAmount ?? 3
        }
      },
      linksWhitelist: options?.linksWhitelist ?? [],
      linksBlacklist: options?.linksBlacklist ?? [],
      linksAllowed: options?.linksAllowed ?? true,
      autoSkip: options?.autoSkip ?? true,
      autoSkipOnResolveError: options?.autoSkipOnResolveError ?? true,
      emitNewSongsOnly: options?.emitNewSongsOnly ?? false,
      queueOptions: {
        maxPreviousTracks: options?.queueOptions?.maxPreviousTracks ?? 25,
        queueChangesWatcher: options?.queueOptions?.queueChangesWatcher ?? null,
        queueStore: options?.queueOptions?.queueStore ?? new DefaultQueueStore()
      },
      advancedOptions: {
        enableDebugEvents: options?.advancedOptions?.enableDebugEvents ?? false,
        maxFilterFixDuration: options?.advancedOptions?.maxFilterFixDuration ?? 6e5,
        debugOptions: {
          logCustomSearches: options?.advancedOptions?.debugOptions?.logCustomSearches ?? false,
          noAudio: options?.advancedOptions?.debugOptions?.noAudio ?? false,
          playerDestroy: {
            dontThrowError: options?.advancedOptions?.debugOptions?.playerDestroy?.dontThrowError ?? false,
            debugLog: options?.advancedOptions?.debugOptions?.playerDestroy?.debugLog ?? false
          }
        }
      }
    };
    this.options = optionsToAssign;
    return;
  }
  /**
   * Validates the current manager's options
   * @param options
   */
  validateOptions(options) {
    if (typeof options?.sendToShard !== "function") throw new SyntaxError("ManagerOption.sendToShard was not provided, which is required!");
    if (options?.autoSkip && typeof options?.autoSkip !== "boolean") throw new SyntaxError("ManagerOption.autoSkip must be either false | true aka boolean");
    if (options?.autoSkipOnResolveError && typeof options?.autoSkipOnResolveError !== "boolean") throw new SyntaxError("ManagerOption.autoSkipOnResolveError must be either false | true aka boolean");
    if (options?.emitNewSongsOnly && typeof options?.emitNewSongsOnly !== "boolean") throw new SyntaxError("ManagerOption.emitNewSongsOnly must be either false | true aka boolean");
    if (!options?.nodes || !Array.isArray(options?.nodes) || !options?.nodes.every((node) => this.utils.isNodeOptions(node))) throw new SyntaxError("ManagerOption.nodes must be an Array of NodeOptions and is required of at least 1 Node");
    if (options?.queueOptions?.queueStore) {
      const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(options?.queueOptions?.queueStore));
      const requiredKeys = ["get", "set", "stringify", "parse", "delete"];
      if (!requiredKeys.every((v) => keys.includes(v)) || !requiredKeys.every((v) => typeof options?.queueOptions?.queueStore[v] === "function")) throw new SyntaxError(`The provided ManagerOption.QueueStore, does not have all required functions: ${requiredKeys.join(", ")}`);
    }
    if (options?.queueOptions?.queueChangesWatcher) {
      const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(options?.queueOptions?.queueChangesWatcher));
      const requiredKeys = ["tracksAdd", "tracksRemoved", "shuffled"];
      if (!requiredKeys.every((v) => keys.includes(v)) || !requiredKeys.every((v) => typeof options?.queueOptions?.queueChangesWatcher[v] === "function")) throw new SyntaxError(`The provided ManagerOption.DefaultQueueChangesWatcher, does not have all required functions: ${requiredKeys.join(", ")}`);
    }
    if (typeof options?.queueOptions?.maxPreviousTracks !== "number" || options?.queueOptions?.maxPreviousTracks < 0) options.queueOptions.maxPreviousTracks = 25;
  }
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
  constructor(options) {
    super();
    if (!options) throw new SyntaxError("No Manager Options Provided");
    this.utils = new ManagerUtils(this);
    this.applyOptions(options);
    this.validateOptions(this.options);
    this.nodeManager = new NodeManager(this);
  }
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
  getPlayer(guildId) {
    return this.players.get(guildId);
  }
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
  createPlayer(options) {
    const oldPlayer = this.getPlayer(options?.guildId);
    if (oldPlayer) return oldPlayer;
    const newPlayer = new this.options.playerClass(options, this, true);
    this.players.set(newPlayer.guildId, newPlayer);
    this.emit("playerCreate", newPlayer);
    return newPlayer;
  }
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
  destroyPlayer(guildId, destroyReason) {
    const oldPlayer = this.getPlayer(guildId);
    if (!oldPlayer) return;
    return oldPlayer.destroy(destroyReason);
  }
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
  deletePlayer(guildId) {
    const oldPlayer = this.getPlayer(guildId);
    if (!oldPlayer) return;
    if (oldPlayer.voiceChannelId === "string" && oldPlayer.connected && !oldPlayer.get("internal_destroywithoutdisconnect")) {
      if (!this.options?.advancedOptions?.debugOptions?.playerDestroy?.dontThrowError) throw new Error(`Use Player#destroy() not LavalinkManager#deletePlayer() to stop the Player ${safeStringify(oldPlayer.toJSON?.())}`);
      else if (this.options?.advancedOptions?.enableDebugEvents) {
        this.emit("debug", "PlayerDeleteInsteadOfDestroy" /* PlayerDeleteInsteadOfDestroy */, {
          state: "warn",
          message: "Use Player#destroy() not LavalinkManager#deletePlayer() to stop the Player",
          functionLayer: "LavalinkManager > deletePlayer()"
        });
      }
    }
    return this.players.delete(guildId);
  }
  /**
   * Checks wether the the lib is useable based on if any node is connected
   *
   * @example
   * ```ts
   * if(!client.lavalink.useable) return console.error("can'T search yet, because there is no useable lavalink node.")
   * // continue with code e.g. createing a player and searching
   * ```
   */
  get useable() {
    return this.nodeManager.nodes.filter((v) => v.connected).size > 0;
  }
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
  async init(clientData) {
    if (this.initiated) return this;
    clientData = clientData ?? {};
    this.options.client = { ...this.options?.client, ...clientData };
    if (!this.options?.client.id) throw new Error('"client.id" is not set. Pass it in Manager#init() or as a option in the constructor.');
    if (typeof this.options?.client.id !== "string") throw new Error('"client.id" set is not type of "string"');
    let success = 0;
    for (const node of this.nodeManager.nodes.values()) {
      try {
        await node.connect();
        success++;
      } catch (err) {
        console.error(err);
        this.nodeManager.emit("error", node, err);
      }
    }
    if (success > 0) this.initiated = true;
    else if (this.options?.advancedOptions?.enableDebugEvents) {
      this.emit("debug", "FailedToConnectToNodes" /* FailedToConnectToNodes */, {
        state: "error",
        message: "Failed to connect to at least 1 Node",
        functionLayer: "LavalinkManager > init()"
      });
    }
    return this;
  }
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
  async sendRawData(data) {
    if (!this.initiated) {
      if (this.options?.advancedOptions?.enableDebugEvents) {
        this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
          state: "log",
          message: "Manager is not initated yet",
          functionLayer: "LavalinkManager > sendRawData()"
        });
      }
      if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, manager is not initated yet");
      return;
    }
    if (!("t" in data)) {
      if (this.options?.advancedOptions?.enableDebugEvents) {
        this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
          state: "error",
          message: "No 't' in payload-data of the raw event:",
          functionLayer: "LavalinkManager > sendRawData()"
        });
      }
      if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, no 't' in payload-data of the raw event:", data);
      return;
    }
    if ("CHANNEL_DELETE" === data.t) {
      const update = "d" in data ? data.d : data;
      if (!update.guild_id) return;
      const player = this.getPlayer(update.guild_id);
      if (player && player.voiceChannelId === update.id) return void player.destroy("ChannelDeleted" /* ChannelDeleted */);
    }
    if (["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(data.t)) {
      const update = "d" in data ? data.d : data;
      if (!update) {
        if (this.options?.advancedOptions?.enableDebugEvents) {
          this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
            state: "warn",
            message: `No Update data found in payload :: ${safeStringify(data, 2)}`,
            functionLayer: "LavalinkManager > sendRawData()"
          });
        }
        if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, no update data found in payload:", data);
        return;
      }
      if (!("token" in update) && !("session_id" in update)) {
        if (this.options?.advancedOptions?.enableDebugEvents) {
          this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
            state: "error",
            message: `No 'token' nor 'session_id' found in payload :: ${safeStringify(data, 2)}`,
            functionLayer: "LavalinkManager > sendRawData()"
          });
        }
        if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, no 'token' nor 'session_id' found in payload:", data);
        return;
      }
      const player = this.getPlayer(update.guild_id);
      if (!player) {
        if (this.options?.advancedOptions?.enableDebugEvents) {
          this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
            state: "warn",
            message: `No Lavalink Player found via key: 'guild_id' of update-data :: ${safeStringify(update, 2)}`,
            functionLayer: "LavalinkManager > sendRawData()"
          });
        }
        if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, No Lavalink Player found via key: 'guild_id' of update-data:", update);
        return;
      }
      if (player.get("internal_destroystatus") === true) {
        if (this.options?.advancedOptions?.enableDebugEvents) {
          this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
            state: "warn",
            message: `Player is in a destroying state. can't signal the voice states`,
            functionLayer: "LavalinkManager > sendRawData()"
          });
        }
        if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, Player is in a destroying state. can't signal the voice states");
        return;
      }
      if ("token" in update) {
        if (!player.node?.sessionId) throw new Error("Lavalink Node is either not ready or not up to date");
        const sessionId2Use = player.voice?.sessionId || ("sessionId" in update ? update.sessionId : void 0);
        if (!sessionId2Use) {
          this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
            state: "error",
            message: `Can't send updatePlayer for voice token session - Missing sessionId :: ${safeStringify({ voice: { token: update.token, endpoint: update.endpoint, sessionId: sessionId2Use }, update, playerVoice: player.voice }, 2)}`,
            functionLayer: "LavalinkManager > sendRawData()"
          });
          if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, Can't send updatePlayer for voice token session - Missing sessionId", { voice: { token: update.token, endpoint: update.endpoint, sessionId: sessionId2Use }, update, playerVoice: player.voice });
        } else {
          await player.node.updatePlayer({
            guildId: player.guildId,
            playerOptions: {
              voice: {
                token: update.token,
                endpoint: update.endpoint,
                sessionId: sessionId2Use
              }
            }
          });
          if (this.options?.advancedOptions?.enableDebugEvents) {
            this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
              state: "log",
              message: `Sent updatePlayer for voice token session :: ${safeStringify({ voice: { token: update.token, endpoint: update.endpoint, sessionId: sessionId2Use }, update, playerVoice: player.voice }, 2)}`,
              functionLayer: "LavalinkManager > sendRawData()"
            });
          }
          if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, Sent updatePlayer for voice token session", { voice: { token: update.token, endpoint: update.endpoint, sessionId: sessionId2Use }, playerVoice: player.voice, update });
        }
        return;
      }
      if (update.user_id !== this.options?.client.id) {
        if (update.user_id && player.voiceChannelId) {
          this.emit(update.channel_id === player.voiceChannelId ? "playerVoiceJoin" : "playerVoiceLeave", player, update.user_id);
        }
        if (this.options?.advancedOptions?.enableDebugEvents) {
          this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
            state: "warn",
            message: `voice update user is not equal to provided client id of the LavalinkManager.options.client.id :: user: "${update.user_id}" manager client id: "${this.options?.client.id}"`,
            functionLayer: "LavalinkManager > sendRawData()"
          });
        }
        if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug("Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, voice update user is not equal to provided client id of the manageroptions#client#id", "user:", update.user_id, "manager client id:", this.options?.client.id);
        return;
      }
      if (update.channel_id) {
        if (player.voiceChannelId !== update.channel_id) this.emit("playerMove", player, player.voiceChannelId, update.channel_id);
        player.voice.sessionId = update.session_id || player.voice.sessionId;
        if (!player.voice.sessionId) {
          if (this.options?.advancedOptions?.enableDebugEvents) {
            this.emit("debug", "NoAudioDebug" /* NoAudioDebug */, {
              state: "warn",
              message: `Function to assing sessionId provided, but no found in Payload: ${safeStringify({ update, playerVoice: player.voice }, 2)}`,
              functionLayer: "LavalinkManager > sendRawData()"
            });
          }
          if (this.options?.advancedOptions?.debugOptions?.noAudio === true) console.debug(`Lavalink-Client-Debug | NO-AUDIO [::] sendRawData function, Function to assing sessionId provided, but no found in Payload: ${safeStringify(update, 2)}`);
        }
        player.voiceChannelId = update.channel_id;
        const selfMuteChanged = typeof update.self_mute === "boolean" && player.voiceState.selfMute !== update.self_mute;
        const serverMuteChanged = typeof update.mute === "boolean" && player.voiceState.serverMute !== update.mute;
        const selfDeafChanged = typeof update.self_deaf === "boolean" && player.voiceState.selfDeaf !== update.self_deaf;
        const serverDeafChanged = typeof update.deaf === "boolean" && player.voiceState.serverDeaf !== update.deaf;
        const suppressChange = typeof update.suppress === "boolean" && player.voiceState.suppress !== update.suppress;
        player.voiceState.selfDeaf = update.self_deaf ?? player.voiceState?.selfDeaf;
        player.voiceState.selfMute = update.self_mute ?? player.voiceState?.selfMute;
        player.voiceState.serverDeaf = update.deaf ?? player.voiceState?.serverDeaf;
        player.voiceState.serverMute = update.mute ?? player.voiceState?.serverMute;
        player.voiceState.suppress = update.suppress ?? player.voiceState?.suppress;
        if (selfMuteChanged || serverMuteChanged) this.emit("playerMuteChange", player, player.voiceState.selfMute, player.voiceState.serverMute);
        if (selfDeafChanged || serverDeafChanged) this.emit("playerDeafChange", player, player.voiceState.selfDeaf, player.voiceState.serverDeaf);
        if (suppressChange) this.emit("playerSuppressChange", player, player.voiceState.suppress);
      } else {
        const {
          autoReconnectOnlyWithTracks,
          destroyPlayer,
          autoReconnect
        } = this.options?.playerOptions?.onDisconnect ?? {};
        if (destroyPlayer === true) {
          return void await player.destroy("Disconnected" /* Disconnected */);
        }
        if (autoReconnect === true) {
          try {
            const previousPosition = player.position;
            const previousPaused = player.paused;
            if (this.options?.advancedOptions?.enableDebugEvents) {
              this.emit("debug", "PlayerAutoReconnect" /* PlayerAutoReconnect */, {
                state: "log",
                message: `Auto reconnecting player because LavalinkManager.options.playerOptions.onDisconnect.autoReconnect is true`,
                functionLayer: "LavalinkManager > sendRawData()"
              });
            }
            if (!autoReconnectOnlyWithTracks || autoReconnectOnlyWithTracks && (player.queue.current || player.queue.tracks.length)) {
              await player.connect();
            }
            if (player.queue.current) {
              return void await player.play({ position: previousPosition, paused: previousPaused, clientTrack: player.queue.current });
            }
            if (player.queue.tracks.length) {
              return void await player.play({ paused: previousPaused });
            }
            this.emit("debug", "PlayerAutoReconnect" /* PlayerAutoReconnect */, {
              state: "log",
              message: `Auto reconnected, but nothing to play`,
              functionLayer: "LavalinkManager > sendRawData()"
            });
          } catch (e) {
            console.error(e);
            return void await player.destroy("PlayerReconnectFail" /* PlayerReconnectFail */);
          }
        }
        this.emit("playerDisconnect", player, player.voiceChannelId);
        player.voiceChannelId = null;
        player.voice = Object.assign({});
        return;
      }
    }
  }
};
export {
  DebugEvents,
  DefaultQueueStore,
  DefaultSources,
  DestroyReasons,
  DisconnectReasons,
  EQList,
  FilterManager,
  LavalinkManager,
  LavalinkNode,
  LavalinkPlugins,
  ManagerUtils,
  MiniMap,
  NodeManager,
  NodeSymbol,
  Player,
  Queue,
  QueueSaver,
  QueueSymbol,
  SourceLinksRegexes,
  TrackSymbol,
  UnresolvedTrackSymbol,
  audioOutputsData,
  parseLavalinkConnUrl,
  queueTrackEnd,
  safeStringify,
  validSponsorBlocks
};
