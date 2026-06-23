# YouTube UI Cleaner

YouTube UI Cleaner is a lightweight browser extension that trims noisy YouTube surfaces so feeds, search results, subscriptions, and video pages feel calmer. It can hide Shorts, grouped video results, live streams, paid promotion overlays, home feed pills, dismissable feed sections, Playables shelves, and custom keyword matches.

## Features

### Shorts Controls

- **Hide Shorts on Home**: Removes Shorts shelves from the YouTube home feed and hides the Shorts sidebar entry.
- **Hide Shorts in Subscriptions**: Removes Shorts shelves from the Subscriptions page.
- **Hide Shorts in Search Results**: Removes Shorts shelves and individual Shorts results from search.
- **Master Shorts Toggle**: Turn all Shorts filters on or off at once, or control each location separately.

### Feed Cleanup

- **Hide Grouped Videos**: Removes grouped recommendation formats with separate controls for Mixes, Podcasts, and Playlists.
- **Hide Live Streams**: Removes live stream videos and live sidebar entries detected by live badges, thumbnail overlays, and broadcast indicators.
- **Hide Dismissable Sections**: Removes feed sections such as Community posts, nudges, AI recommendations, and similar interruptive modules.
- **Hide Home Feed Pills**: Hides the category filter chips at the top of the home feed.
- **Hide Playables**: Removes YouTube Playables shelves.

### Video Page Cleanup

- **Hide Paid Promotion Banners**: Removes YouTube's paid promotion overlay from videos.

### Custom Keyword Filters

- **Filter Groups**: Create named groups for topics you want to avoid, such as spoilers, sports results, reviews, reactions, or event outcomes.
- **Multiple Keywords per Group**: Add one keyword or comma-separated keywords to each group.
- **Per-Group Toggles**: Enable or disable individual filter groups without deleting them.
- **Automatic Matching**: Hides videos whose visible text contains any enabled keyword.

### Quick Hover Actions

- **Watch Later Shortcut**: Adds a Watch Later button to YouTube's inline hover preview controls.
- **Not Interested Shortcut**: Adds a Not Interested button to the same hover controls, using YouTube's native menu action behind the scenes.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project folder.

## Usage

1. Open YouTube.
2. Click the YouTube UI Cleaner extension icon.
3. Use the **General** tab to toggle built-in cleanup options.
4. Use the **Custom Filters** tab to create and manage keyword filter groups.

Settings are saved with browser sync storage and apply automatically as YouTube updates the page or navigates within the single-page app.

## Permissions

- `storage`: Saves your toggle settings and custom keyword filter groups.
- `*://*.youtube.com/*`: Runs the cleanup logic only on YouTube.

The extension does not require data collection. The manifest also declares `none` for Firefox data collection permissions.
