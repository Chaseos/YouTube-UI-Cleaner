# YouTube UI Cleaner

YouTube UI Cleaner is a lightweight, open-source browser extension that removes distracting content from YouTube without redesigning the site. Hide Shorts, Mixes, podcasts, playlists, live and upcoming videos, promotions, unwanted topics, and more with controls for each type of content.

All processing happens locally in your browser. No browsing data or personal information is collected or transmitted.

## Install

Install YouTube UI Cleaner from your browser's official extension store:

| Browser | Store |
| --- | --- |
| Google Chrome | [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/youtube-ui-cleaner/blnbifjnjgpgfigcpkhcfkiiepokhkdf) |
| Microsoft Edge | [Install from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/youtube-ui-cleaner/dmfgeiiikimggajkkdefmngleooclhci) |
| Mozilla Firefox | [Install from Firefox Browser Add-ons](https://addons.mozilla.org/firefox/addon/youtube-ui-cleaner/) |
| Opera | [Install from Opera Add-ons](https://addons.opera.com/extensions/details/youtube-ui-cleaner/) |
| NAVER Whale | [Install from Whale Store](https://store.whale.naver.com/detail/nkiaddacajkdagoaajbjdlfglidkedlk) |

## Features

<img width="360" height="600" alt="Youtube UI Cleaner Main UI" src="https://github.com/user-attachments/assets/91e8ef39-fdf1-46e2-9f4c-c62d91024cb0" />
<img width="354" height="374" alt="YouTube UI Cleaner Hide Keywords" src="https://github.com/user-attachments/assets/ed2f9e7a-5dd6-4c9b-878e-1ee887e13613" />

### Fine-grained feed cleanup

Use master switches for a whole category or expand a category to control its filters independently.

| Category | Available controls |
| --- | --- |
| Shorts | Hide Shorts on Home, in the sidebar, in Subscriptions, and in Search results |
| Mixes, podcasts, and playlists | Hide these recommendations while leaving your Playlists library intact |
| Live and upcoming | Hide live streams separately from scheduled videos and upcoming premieres |
| Home feed extras | Hide the category filter chips or dismissible sections such as Community posts, nudges, and recommendation shelves |
| Promotions | Hide featured subscription or trial offers and paid-promotion overlays |
| Other content | Hide members-only videos and YouTube Playables shelves |

Built-in cleanup filters are enabled on first install and can be changed at any time from the extension popup.

### Custom keyword filters

- Create named filter groups for topics you do not want to see.
- Add one keyword or several comma-separated keywords to a group.
- Enable, disable, edit, or delete each group independently.
- Hide matching video cards automatically using case-insensitive matching against their visible text.

Keyword groups are useful for spoilers, sports results, reviews, reactions, celebrity news, event outcomes, and any other topics you would rather avoid.

### Quick video actions

YouTube UI Cleaner adds **Watch Later** and **Not Interested** shortcuts to supported inline hover previews and watch-page recommendation thumbnails. The shortcuts trigger YouTube's native actions, including its normal confirmation and Undo behavior, without requiring you to open the three-dot menu.

### YouTube navigation support

Filters are reapplied as YouTube loads new content or moves between pages in its single-page interface, so settings continue working across Home, Subscriptions, Search, and watch-page recommendations.

## Languages

The extension popup supports 21 locale catalogs across 20 languages. Localized YouTube text detection covers the same languages, with both Spanish markets sharing detection terms:

| | | |
| --- | --- | --- |
| Arabic | German | Polish |
| Chinese (Simplified) | Hindi | Portuguese (Brazil) |
| Chinese (Hong Kong) | Indonesian | Portuguese (Portugal) |
| Chinese (Traditional) | Italian | Spanish (Latin America) |
| English | Japanese | Spanish (Spain) |
| French | Korean | Thai |
| Turkish | Ukrainian | Vietnamese |

The popup follows your browser's UI language, while content detection follows the language set on the YouTube page. Unsupported locales fall back to English.

## Usage

1. Open YouTube in a supported browser.
2. Select the YouTube UI Cleaner icon in the browser toolbar.
3. Use the **General** tab to configure the built-in cleanup options.
4. Use the **Custom Filters** tab to create and manage keyword groups.

Settings are saved with browser sync storage and applied automatically.

## Privacy and permissions

YouTube UI Cleaner operates locally and does not collect, store, or transmit personal data. See the [privacy policy](PRIVACYPOLICY.md) for details.

The extension requests only the permissions needed for its core functionality:

- `storage` saves toggles and custom keyword groups using browser sync storage.
- `*://*.youtube.com/*` lets the extension apply cleanup rules on YouTube only.

The Firefox manifest explicitly declares that no data collection is required.

## Build from source

Requirements:

- A current version of Node.js and npm
- The `zip` command-line utility for release archives

Clone the repository and create both browser builds:

```sh
git clone https://github.com/Chaseos/YouTube-UI-Cleaner.git
cd YouTube-UI-Cleaner
npm run build
```

The build validates every locale, runs the JavaScript and localization tests, and creates these packages in `dist/`:

- `dist/chromium/` and `dist/youtube-ui-cleaner-chromium.zip` for Chrome, Edge, Opera, Whale, and other Chromium-based browsers
- `dist/firefox/` and `dist/youtube-ui-cleaner-firefox.zip` for Firefox, including its Gecko-specific manifest settings

To test an unpacked build:

- In a Chromium-based browser, open its extensions page, enable developer mode, choose **Load unpacked**, and select `dist/chromium/`.
- In Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/firefox/manifest.json`.

## Support

<p align="center">
<a href="https://chaseos.app">🌐 Explore my work</a>
</p>

<p align="center">
<a href="https://ko-fi.com/chaseos" target="_blank">
<img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" />
</a>
</p>
