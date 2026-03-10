/* content.js */

console.log('YouTube Feed Cleaner: Active');

// Function to update classes on the HTML element
function updateClasses(settings) {
    const html = document.documentElement;

    // Shorts: Home
    if (settings.shortsHome) html.classList.add('yt-hide-shorts-home');
    else html.classList.remove('yt-hide-shorts-home');

    // Shorts: Subscriptions
    if (settings.shortsSubs) html.classList.add('yt-hide-shorts-subs');
    else html.classList.remove('yt-hide-shorts-subs');

    // Shorts: Search
    if (settings.shortsSearch) html.classList.add('yt-hide-shorts-search');
    else html.classList.remove('yt-hide-shorts-search');

    // Shorts: Sidebar
    if (settings.shortsSidebar) html.classList.add('yt-hide-shorts-sidebar');
    else html.classList.remove('yt-hide-shorts-sidebar');

    // Playables
    if (settings.playables) html.classList.add('yt-hide-playables');
    else html.classList.remove('yt-hide-playables');

    // Paid Promotion
    if (settings.paidPromotion) html.classList.add('yt-hide-promoted');
    else html.classList.remove('yt-hide-promoted');

    // Mixes
    if (settings.hideMixes) html.classList.add('yt-hide-mixes');
    else html.classList.remove('yt-hide-mixes');
    
    // Live Streams
    if (settings.hideLive) html.classList.add('yt-hide-live');
    else html.classList.remove('yt-hide-live');

    // Dismissable Sections
    if (settings.hideSections) html.classList.add('yt-hide-sections');
    else html.classList.remove('yt-hide-sections');
}

// Selectors for elements we need to tag based on text content
function tagElements() {
    // 1. Tag Shorts Shelves (Grid/Reel)
    // Target both ytd-rich-shelf-renderer and grid-shelf-view-model
    const potentialShorts = document.querySelectorAll('ytd-rich-shelf-renderer, grid-shelf-view-model, ytd-reel-shelf-renderer');
    potentialShorts.forEach(el => {
        // Check exact title or spans
        const titleText = el.innerText || "";
        if (titleText.includes("Shorts") && !el.classList.contains('is-shorts-shelf')) {
            // Verify it's actually a header title, not just random text?
            // Usually "Shorts" is in a specific header.
            // For grid-shelf-view-model, user showed header structure.
            // Simple check:
            if (el.querySelector('.yt-shelf-header-layout__title, #title') &&
                (el.querySelector('.yt-shelf-header-layout__title, #title').textContent.includes("Shorts"))) {
                el.classList.add('is-shorts-shelf');
            }
            // Also check for the Shorts Icon if text matches, or just trust the text for now.
        }
    });

    // 2. Tag Sidebar Shorts Button
    const sidebarItems = document.querySelectorAll('ytd-guide-entry-renderer a, ytd-mini-guide-entry-renderer a');
    sidebarItems.forEach(link => {
        if (link.title === "Shorts" || link.getAttribute('aria-label') === "Shorts") {
            // Find the container to look like other renderers
            const container = link.closest('ytd-guide-entry-renderer') || link.closest('ytd-mini-guide-entry-renderer');
            if (container && !container.classList.contains('is-shorts-sidebar-entry')) {
                container.classList.add('is-shorts-sidebar-entry');
            }
        }
    });

    // 3. Tag Playables
    const potentialPlayables = document.querySelectorAll('ytd-rich-shelf-renderer, ytd-rich-section-renderer');
    potentialPlayables.forEach(el => {
        if (el.innerText.includes("Playables") && !el.classList.contains('is-playables-shelf')) {
            if (el.querySelector('#title') && el.querySelector('#title').textContent.includes("Playables")) {
                el.classList.add('is-playables-shelf');
            }
        }
    });

    // 4. Tag Individual Shorts in Search Results
    const videoRenderers = document.querySelectorAll('ytd-video-renderer');
    videoRenderers.forEach(el => {
        const thumbnail = el.querySelector('a#thumbnail');
        if (thumbnail && thumbnail.href.includes('/shorts/') && !el.classList.contains('is-individual-short')) {
            el.classList.add('is-individual-short');
        }
    });

    // 5. Tag Mixes and Podcasts
    // Look for ytd-rich-item-renderer that contains a "Mix" badge or "Podcast" link
    const items = document.querySelectorAll('ytd-rich-item-renderer');
    items.forEach(el => {
        if (!el.classList.contains('is-mix-item')) {
            // Check for the "Mix" badge text
            const badges = el.querySelectorAll('.yt-badge-shape__text');
            let isMix = false;
            badges.forEach(badge => {
                if (badge.textContent.trim() === 'Mix') {
                    isMix = true;
                }
            });

            // Also check for the specific svg path if text is unreliable (optional but good for robustness)
            if (!isMix) {
                const svgPath = el.querySelector('path[d="M3 3.657v16.689a1 1 0 001.466.883L8 19.369V4.632l-3.534-1.86A1 1 0 003 3.657ZM14 7.79l-4-2.105v12.631l4-2.106V7.79ZM22 12l-6-3.157v6.315L22 12Z"]');
                if (svgPath) isMix = true;
            }

            // Check for Podcasts
            if (!isMix) {
                const links = el.querySelectorAll('a');
                links.forEach(link => {
                    if (link.textContent.trim() === 'Podcast') {
                        isMix = true;
                    }
                });
            }

            if (isMix) {
                el.classList.add('is-mix-item');
            }
        }
    });

    // 6. Tag Live Streams
    const allContainers = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-guide-entry-renderer');
    allContainers.forEach(el => {
        if (el.classList.contains('is-live-item')) return;

        // 1. Direct Video Overlay (MOST RELIABLE)
        // Check for the specific thumbnail badge from the user's snippet
        const thumbBadge = el.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="LIVE"], .yt-badge-shape--thumbnail-live');
        
        // 2. Metadata Badge (Red "LIVE" text in video info)
        const metadataBadge = el.querySelector('#metadata-line .yt-badge-shape--live');

        // 3. Sidebar/Guide Indicators (Pulse icons)
        const sidebarLivePulse = el.querySelector('ytd-live-status-indicator-renderer');
        const broadcastPath = el.querySelector('path[d="M4.222 4.223a11 11 0 000 15.555 1 1 0 101.414-1.414 9 9 0 010-12.727 1 1 0 10-1.414-1.414Zm13.79.353a1 1 0 000 1.414 8.5 8.5 0 010 12.022 1 1 0 001.413 1.414 10.501 10.501 0 000-14.85 1 1 0 00-1.413 0Zm-2.83 2.827a1 1 0 000 1.414 4.501 4.501 0 010 6.365 1.001 1.001 0 001.414 1.414 6.5 6.5 0 000-9.193 1 1 0 00-1.415 0Zm-7.78 0a6.5 6.5 0 000 9.194 1 1 0 001.415-1.415 4.5 4.5 0 010-6.364 1.001 1.001 0 00-1.415-1.415ZM12 10a2 2 0 100 4 2 2 0 000-4Z"]');
        
        // 4. Timestamp Check (If it has a time like "10:30", it's NOT a current live stream)
        const hasTimestamp = el.querySelector('ytd-thumbnail-overlay-time-status-renderer:not([overlay-style="LIVE"])');

        // Video is live if it has any of the direct badges or indicators
        let isLive = !!(thumbBadge || metadataBadge || sidebarLivePulse || broadcastPath);

        // Absolute safety check: if it has a timestamp, it's definitely NOT a live stream
        if (hasTimestamp) isLive = false;

        if (isLive) {
            el.classList.add('is-live-item');
        }
    });

}

// Keys to retrieve
const keys = ['shortsHome', 'shortsSubs', 'shortsSearch', 'shortsSidebar', 'playables', 'paidPromotion', 'hideMixes', 'hideLive', 'hideSections'];

// Load initial settings
chrome.storage.sync.get(keys, (result) => {
    // Default to true if undefined
    const settings = {};
    keys.forEach(key => {
        settings[key] = result[key] !== undefined ? result[key] : true;
    });
    updateClasses(settings);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_SETTINGS') {
        chrome.storage.sync.get(keys, (result) => {
            updateClasses(result);
        });
    }
});

// Helper for debounce/throttling observer
let timeout = null;
const observer = new MutationObserver((mutations) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        tagElements();
    }, 100);
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial tag
tagElements();
