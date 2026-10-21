# TV Home

A minimal, ad-free home screen for a TV. It shows only a clock and the apps you pin, with no
recommendations, banners, autoplay, or tracking. It's plain HTML, CSS, and JavaScript: there's no
build step and nothing is fetched from the network.

## Using it with a remote

| Remote button            | Home screen        | Edit mode                       |
| ------------------------ | ------------------ | ------------------------------- |
| Arrows                   | Move between tiles | Move focus, or a picked-up tile |
| OK / Enter               | Open the app       | Move / Remove menu for a tile   |
| Hold OK (about 1 second) | Enter edit mode    | —                               |
| Back                     | —                  | Drop the tile, then exit edit   |

Choose **+ Add app** to add a tile. Your layout is saved on the TV in the browser's local storage.
After 5 minutes without input the screen dims to a clock; any button wakes it.

To change the tiles a fresh install starts with, edit `apps.js`. Each entry has a `name`, a web
`url`, a tile `color`, and an optional Android TV `android` package name. On Android, a tile with a
package name opens the installed app and falls back to the web address if the app isn't installed.

## Installing it on your TV

Most TV operating systems don't let you fully replace their built-in launcher, so what you can do
depends on your TV:

- **Android TV / Google TV (Sony, TCL, Hisense, Chromecast, NVIDIA Shield):** install a kiosk or
  WebView launcher app (for example Fully Kiosk Browser), point it at `index.html`, and set it as
  the default Home app. This is the only option that fully replaces the stock, ad-heavy home screen.
- **Fire TV, Samsung (Tizen), LG (webOS), Roku:** the built-in home screen can't be replaced. Open
  this page in the TV's browser and bookmark it, or use a small device such as a Raspberry Pi in
  kiosk mode (below) as your "TV home".
- **Raspberry Pi or mini PC on an HDMI input:** run
  `chromium --kiosk file:///path/to/tv-home/index.html` at startup.

To open the page on another device, serve this folder from any computer on your network, for example
`python3 -m http.server 8080` from this directory, then browse to `http://<computer-ip>:8080`.

Turning off your TV's own ad and "content recommendation" settings (and its ACR / viewing-data
option) is still worth doing; this page only replaces what you look at.
