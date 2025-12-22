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

    // 5. Tag Mixes
    // Look for ytd-rich-item-renderer that contains a "Mix" badge
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

            if (isMix) {
                el.classList.add('is-mix-item');
            }
        }
    });

}

// Keys to retrieve
const keys = ['shortsHome', 'shortsSubs', 'shortsSearch', 'shortsSidebar', 'playables', 'paidPromotion', 'hideMixes'];

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
