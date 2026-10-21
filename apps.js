// Default tiles shown on first launch. Edit this list, or use edit mode on the TV.
// `android` is the Android TV package name; when the page runs on Android it
// launches the installed app and falls back to `url` if it is missing.
window.DEFAULT_APPS = [
  { name: "Netflix", url: "https://www.netflix.com", android: "com.netflix.ninja", color: "#b20710" },
  { name: "YouTube", url: "https://www.youtube.com/tv", android: "com.google.android.youtube.tv", color: "#c4302b" },
  {
    name: "Prime Video",
    url: "https://www.primevideo.com",
    android: "com.amazon.amazonvideo.livingroom",
    color: "#0f79af",
  },
  { name: "Disney+", url: "https://www.disneyplus.com", android: "com.disney.disneyplus", color: "#113ccf" },
  { name: "Plex", url: "https://app.plex.tv", android: "com.plexapp.android", color: "#cc7b19" },
  { name: "Spotify", url: "https://open.spotify.com", android: "com.spotify.tv.android", color: "#1a9e4b" },
]
