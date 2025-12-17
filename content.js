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

}

// Keys to retrieve
const keys = ['shortsHome', 'shortsSubs', 'shortsSearch', 'shortsSidebar', 'playables', 'paidPromotion'];

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
