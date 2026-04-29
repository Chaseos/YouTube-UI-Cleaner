/* content.js */

console.log('YouTube Feed Cleaner: Active');

let currentCustomFilters = [];

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

    // Playables
    if (settings.playables) html.classList.add('yt-hide-playables');
    else html.classList.remove('yt-hide-playables');

    // Paid Promotion
    if (settings.paidPromotion) html.classList.add('yt-hide-promoted');
    else html.classList.remove('yt-hide-promoted');

    // Grouped Videos
    if (settings.groupedMixes) html.classList.add('yt-hide-mixes');
    else html.classList.remove('yt-hide-mixes');

    if (settings.groupedPodcasts) html.classList.add('yt-hide-podcasts');
    else html.classList.remove('yt-hide-podcasts');

    if (settings.groupedPlaylists) html.classList.add('yt-hide-playlists');
    else html.classList.remove('yt-hide-playlists');
    
    // Live Streams
    if (settings.hideLive) html.classList.add('yt-hide-live');
    else html.classList.remove('yt-hide-live');

    // Dismissable Sections
    if (settings.hideSections) html.classList.add('yt-hide-sections');
    else html.classList.remove('yt-hide-sections');

    // Feed Pills
    if (settings.feedPills) html.classList.add('yt-hide-feed-pills');
    else html.classList.remove('yt-hide-feed-pills');
}

// Selectors for elements we need to tag based on text content
function tagElements() {
    // 1. Tag Shorts Shelves (Grid/Reel)
    // Target both ytd-rich-shelf-renderer and grid-shelf-view-model
    const potentialShorts = document.querySelectorAll('ytd-rich-shelf-renderer:not(.is-shorts-shelf), grid-shelf-view-model:not(.is-shorts-shelf), ytd-reel-shelf-renderer:not(.is-shorts-shelf)');
    potentialShorts.forEach(el => {
        // Check exact title or spans
        const titleText = el.innerText || "";
        if (titleText.includes("Shorts")) {
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
    const sidebarItems = document.querySelectorAll('ytd-guide-entry-renderer:not(.is-shorts-sidebar-entry) a, ytd-mini-guide-entry-renderer:not(.is-shorts-sidebar-entry) a');
    sidebarItems.forEach(link => {
        if (link.title === "Shorts" || link.getAttribute('aria-label') === "Shorts") {
            // Find the container to look like other renderers
            const container = link.closest('ytd-guide-entry-renderer') || link.closest('ytd-mini-guide-entry-renderer');
            if (container) {
                container.classList.add('is-shorts-sidebar-entry');
            }
        }
    });

    // 3. Tag Playables
    const potentialPlayables = document.querySelectorAll('ytd-rich-shelf-renderer:not(.is-playables-shelf), ytd-rich-section-renderer:not(.is-playables-shelf)');
    potentialPlayables.forEach(el => {
        if (el.innerText.includes("Playables")) {
            if (el.querySelector('#title') && el.querySelector('#title').textContent.includes("Playables")) {
                el.classList.add('is-playables-shelf');
            }
        }
    });

    // 4. Tag Individual Shorts in Search Results
    const videoRenderers = document.querySelectorAll('ytd-video-renderer:not(.is-individual-short)');
    videoRenderers.forEach(el => {
        const thumbnail = el.querySelector('a#thumbnail');
        if (thumbnail && thumbnail.href.includes('/shorts/')) {
            el.classList.add('is-individual-short');
        }
    });

    // 5. Tag Mixes, Podcasts, and Playlists
    // Optimize: Only select elements that haven't been tagged yet
    const items = document.querySelectorAll('ytd-rich-item-renderer:not(.is-mix-item):not(.is-podcast-item):not(.is-playlist-item), ytd-video-renderer:not(.is-mix-item):not(.is-podcast-item):not(.is-playlist-item), ytd-grid-video-renderer:not(.is-mix-item):not(.is-podcast-item):not(.is-playlist-item), ytd-compact-video-renderer:not(.is-mix-item):not(.is-podcast-item):not(.is-playlist-item), ytd-radio-renderer:not(.is-mix-item):not(.is-podcast-item):not(.is-playlist-item), ytd-playlist-renderer:not(.is-mix-item):not(.is-podcast-item):not(.is-playlist-item)');
    
    items.forEach(el => {
        let isMix = false;
        let isPodcast = false;
        let isPlaylist = false;

        // 1. Direct tag checks based on element type
        if (el.tagName.toLowerCase() === 'ytd-playlist-renderer') isPlaylist = true;
        if (el.tagName.toLowerCase() === 'ytd-radio-renderer') isMix = true;

        // 2. Check Badge texts for "Mix" and "Podcast"
        if (!isMix && !isPodcast) {
            const badges = el.querySelectorAll('.yt-badge-shape__text');
            badges.forEach(badge => {
                const badgeText = badge.textContent.trim();
                if (badgeText === 'Mix') isMix = true;
                if (badgeText === 'Podcast') isPodcast = true;
            });
        }

        // 3. SVG Path check for Mixes (fallback)
        if (!isMix) {
            const svgPath = el.querySelector('path[d="M3 3.657v16.689a1 1 0 001.466.883L8 19.369V4.632l-3.534-1.86A1 1 0 003 3.657ZM14 7.79l-4-2.105v12.631l4-2.106V7.79ZM22 12l-6-3.157v6.315L22 12Z"]');
            if (svgPath) isMix = true;
        }

        // 4. Structural indicators for Playlists
        if (!isPlaylist) {
            const playlistIndicator = el.querySelector('ytd-playlist-thumbnail:not([hidden]), ytd-thumbnail-overlay-side-panel-renderer:not([hidden]), [overlay-style="PLAYLIST"]:not([hidden]), yt-collection-thumbnail-view-model:not([hidden])');
            if (playlistIndicator) isPlaylist = true;
        }

        // 5. Single loop over anchor tags for text and URL checks
        // We only need to run this if we haven't already identified a Mix or Podcast
        if (!isMix && !isPodcast) {
            const links = el.querySelectorAll('a');
            links.forEach(link => {
                const text = link.textContent.trim();
                
                if (text === 'Podcast') isPodcast = true;
                
                if (!isPlaylist) {
                    if (text === 'View full playlist' || text === 'Playlist') isPlaylist = true;
                    // Check href URL for playlist indicator
                    if (link.href && link.href.includes('/playlist?list=')) isPlaylist = true;
                }
            });
        }

        // Apply distinct classes independently based on what we found
        if (isMix) {
            el.classList.add('is-mix-item');
        } else if (isPodcast) {
            el.classList.add('is-podcast-item');
        } else if (isPlaylist) {
            el.classList.add('is-playlist-item');
        }
    });

    // 6. Tag Live Streams
    const allContainers = document.querySelectorAll('ytd-rich-item-renderer:not(.is-live-item), ytd-video-renderer:not(.is-live-item), ytd-grid-video-renderer:not(.is-live-item), ytd-compact-video-renderer:not(.is-live-item), ytd-guide-entry-renderer:not(.is-live-item)');
    allContainers.forEach(el => {
        // 1. Direct Video Overlay (MOST RELIABLE)
        // Check for the specific thumbnail badge from the user's snippet
        const thumbBadge = el.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="LIVE"], .yt-badge-shape--thumbnail-live, .ytBadgeShapeThumbnailLive');
        
        // 2. Metadata Badge (Red "LIVE" text in video info)
        const metadataBadge = el.querySelector('#metadata-line .yt-badge-shape--live, .ytSpecAvatarShapeLiveBadge');

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

    // 7. Tag Downloads Section
    const potentialDownloads = document.querySelectorAll('ytd-rich-section-renderer:not(.is-downloads-section)');
    potentialDownloads.forEach(el => {
        let isDownloads = false;
        
        // Check for Smart Downloads banner
        const alertBanner = el.querySelector('yt-alert-banner-view-model');
        if (alertBanner && alertBanner.innerText && alertBanner.innerText.toLowerCase().includes("downloads")) {
            isDownloads = true;
        }
        
        // Check for Your downloads shelf
        const titleEl = el.querySelector('#title');
        if (titleEl && titleEl.textContent && titleEl.textContent.toLowerCase().includes("downloads")) {
            isDownloads = true;
        }

        if (isDownloads) {
            el.classList.add('is-downloads-section');
        }
    });

    // 8. Tag Custom Keywords
    const activeFilters = [];
    if (currentCustomFilters && currentCustomFilters.length > 0) {
        currentCustomFilters.filter(f => f.enabled).forEach(f => {
            if (f.keywords && f.keywords.length > 0) {
                activeFilters.push(...f.keywords.map(k => k.toLowerCase()));
            }
        });
    }

    const potentialSpoilers = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer');
    
    potentialSpoilers.forEach(el => {
        let hasMatch = false;
        
        if (activeFilters.length > 0) {
            const fullText = el.textContent.toLowerCase();
            hasMatch = activeFilters.some(kw => {
                if (!kw) return false;
                return fullText.includes(kw);
            });
        }
        
        const isCurrentlyHidden = el.classList.contains('is-custom-hidden');
        
        if (hasMatch && !isCurrentlyHidden) {
            el.classList.add('is-custom-hidden');
        } else if (!hasMatch && isCurrentlyHidden) {
            el.classList.remove('is-custom-hidden');
        }
    });

}

// Function to inject custom hover buttons into the inline player
function injectHoverButtons() {
    const inlineControlsList = document.querySelectorAll('yt-inline-player-controls:not(.has-custom-hover-buttons)');
    
    inlineControlsList.forEach(controls => {
        // Find the top left container where we want to inject our buttons
        const topLeftContainer = controls.querySelector('.ytInlinePlayerControlsTopLeftControls');
        if (!topLeftContainer) return;

        controls.classList.add('has-custom-hover-buttons');

        // Check if our container already exists to avoid duplicates
        if (topLeftContainer.querySelector('.custom-hover-buttons-container')) return;

        // Create container for our buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'custom-hover-buttons-container';
        
        const eatEvent = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        };

        const attachButtonEvents = (btn, actionCallback) => {
            ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(evt => {
                btn.addEventListener(evt, eatEvent, true);
            });
            btn.addEventListener('click', (e) => {
                eatEvent(e);
                actionCallback(e);
            }, true);
        };

        // --- Watch Later Button ---
        const watchLaterBtn = document.createElement('div');
        watchLaterBtn.className = 'custom-hover-btn';
        watchLaterBtn.title = "Watch Later";
        // We add the 'ytp-button' class because YouTube's global click handler ignores clicks on .ytp-button elements,
        // preventing the click-through to the video!
        watchLaterBtn.innerHTML = `
            <button class="custom-hover-action-btn ytp-button" aria-label="Watch Later">
                <svg viewBox="0 0 24 24" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;">
                    <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 110 18.001A9 9 0 0112 3Zm0 3a1 1 0 00-1 1v5.565l.485.292 3.33 2a1 1 0 001.03-1.714L13 11.435V7a1 1 0 00-1-1Z"></path>
                </svg>
            </button>
        `;
        
        // --- Not Interested Button ---
        const notInterestedBtn = document.createElement('div');
        notInterestedBtn.className = 'custom-hover-btn';
        notInterestedBtn.title = "Not Interested";
        notInterestedBtn.innerHTML = `
            <button class="custom-hover-action-btn ytp-button" aria-label="Not Interested">
                <svg viewBox="0 0 24 24" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;">
                    <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 2a9 9 0 018.246 12.605L4.755 6.661A8.99 8.99 0 0112 3ZM3.754 8.393l15.491 8.944A9 9 0 013.754 8.393Z"></path>
                </svg>
            </button>
        `;
        
        const performMenuAction = (btn, actionText) => {
            const preview = controls.closest('ytd-video-preview');
            if (!preview) return;

            const mediaLink = preview.querySelector('a#media-container-link');
            if (!mediaLink) return;

            const href = mediaLink.getAttribute('href');
            if (!href) return;

            let videoId = '';
            try {
                const urlObj = new URL(href, window.location.origin);
                videoId = urlObj.searchParams.get('v');
            } catch (err) {}

            if (!videoId) {
                const match = href.match(/v=([^&]+)/);
                if (match) videoId = match[1];
            }
            
            if (!videoId) return;
            
            // Find any link with this videoId that is NOT in the preview portal
            const links = Array.from(document.querySelectorAll(`a[href*="${videoId}"]`));
            const originalLink = links.find(l => !l.closest('ytd-video-preview') && l.closest('ytd-rich-item-renderer, ytd-rich-grid-media, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer'));
            if (!originalLink) return;
            
            const container = originalLink.closest('ytd-rich-item-renderer, ytd-rich-grid-media, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer');
            if (!container) return;

            const menuBtn = container.querySelector('ytd-menu-renderer button, ytd-menu-renderer yt-icon-button, button[aria-label="Action menu"], button[aria-label="More actions"], button.dropdown-trigger, #menu button, yt-icon-button#button, .ytLockupMetadataViewModelMenuButton button');
            if (!menuBtn) return;

            // Inject temporary CSS to hide the dropdown instantly before it even renders
            let hideStyle = document.getElementById('temp-hide-yt-dropdown');
            if (!hideStyle) {
                hideStyle = document.createElement('style');
                hideStyle.id = 'temp-hide-yt-dropdown';
                document.head.appendChild(hideStyle);
            }
            hideStyle.textContent = 'tp-yt-iron-dropdown { opacity: 0 !important; }';

            const cleanupHideStyle = () => {
                setTimeout(() => {
                    if (hideStyle) hideStyle.textContent = '';
                }, 300); // Wait a fraction of a second before restoring to ensure the menu has closed
            };

            // Click the menu to open it (bubbling is fine since it's on the main document, not the preview portal)
            menuBtn.click();
            
            let attempts = 0;
            const findAndClickAction = setInterval(() => {
                attempts++;
                if (attempts > 40) { // 2 seconds
                    clearInterval(findAndClickAction);
                    cleanupHideStyle();
                    // close menu if we failed
                    document.body.click(); 
                    return;
                }

                const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view-model');
                for (const item of menuItems) {
                    const text = item.textContent.trim().toLowerCase();
                    if (text.includes(actionText)) {
                        clearInterval(findAndClickAction);

                        // Use a normal click so YouTube's delegated listeners catch it and show toasts/undo UI
                        item.click();
                        
                        cleanupHideStyle();
                        
                        if (actionText === 'not interested') {
                            // Hide the preview portal so the user can see the native Undo UI underneath
                            preview.style.display = 'none';
                            setTimeout(() => { preview.style.display = ''; }, 1500);
                        } else {
                            // Visual feedback for Watch Later directly on our button
                            const svg = btn.querySelector('svg');
                            const origPath = svg.innerHTML;
                            svg.innerHTML = '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path>'; // Checkmark
                            setTimeout(() => { svg.innerHTML = origPath; }, 2000);
                        }
                        
                        break;
                    }
                }
            }, 50);
        };

        attachButtonEvents(watchLaterBtn, () => performMenuAction(watchLaterBtn, 'watch later'));
        attachButtonEvents(notInterestedBtn, () => performMenuAction(notInterestedBtn, 'not interested'));

        buttonsContainer.appendChild(watchLaterBtn);
        buttonsContainer.appendChild(notInterestedBtn);

        topLeftContainer.appendChild(buttonsContainer);
    });
}

// Keys to retrieve
const keys = ['shortsHome', 'shortsSubs', 'shortsSearch', 'playables', 'paidPromotion', 'groupedMixes', 'groupedPodcasts', 'groupedPlaylists', 'hideLive', 'feedPills', 'hideSections', 'customFilters'];

// Apply defaults immediately to prevent flash on load
const defaultSettings = {};
keys.forEach(key => {
    if (key !== 'customFilters') defaultSettings[key] = true;
});
updateClasses(defaultSettings);

function loadSettingsAndApply() {
    chrome.storage.sync.get(keys, (result) => {
        // Default to true if undefined
        const settings = {};
        keys.forEach(key => {
            if (key !== 'customFilters') {
                settings[key] = result[key] !== undefined ? result[key] : true;
            }
        });
        currentCustomFilters = result['customFilters'] || [];
        updateClasses(settings);
        tagElements(); // Re-tag with new keywords
        injectHoverButtons(); // Inject buttons
    });
}

// Load initial settings from storage
loadSettingsAndApply();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_SETTINGS') {
        // Tag elements immediately in case the toggle was flipped but elements aren't tagged yet
        tagElements();
        loadSettingsAndApply();
    }
});

// Helper for faster tagging without a heavy flash
let taggingScheduled = false;
const observer = new MutationObserver((mutations) => {
    let hasAddedNodes = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            hasAddedNodes = true;
            break;
        }
    }
    
    if (!hasAddedNodes) return;

    if (!taggingScheduled) {
        taggingScheduled = true;
        requestAnimationFrame(() => {
            tagElements();
            injectHoverButtons();
            taggingScheduled = false;
        });
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

// Fallback interval to catch elements that might slip past the observer
setInterval(() => {
    tagElements();
    injectHoverButtons();
}, 2000);

// YouTube API SPA Navigation listeners
window.addEventListener('yt-navigate-finish', () => {
    tagElements();
    injectHoverButtons();
});

// Initial tag
tagElements();
injectHoverButtons();
