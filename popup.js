/* popup.js */

function getMessage(key, substitutions = undefined, fallback = '') {
    const translated = chrome.i18n?.getMessage(key, substitutions);
    return translated || fallback || key;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function localizeDocument() {
    const uiLanguage = chrome.i18n?.getUILanguage?.();
    if (uiLanguage) document.documentElement.lang = uiLanguage.replace('_', '-');

    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = getMessage(element.dataset.i18n, undefined, element.textContent);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        element.title = getMessage(element.dataset.i18nTitle, undefined, element.title);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        element.placeholder = getMessage(element.dataset.i18nPlaceholder, undefined, element.placeholder);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        element.setAttribute('aria-label', getMessage(element.dataset.i18nAriaLabel, undefined, element.getAttribute('aria-label')));
    });
    document.querySelectorAll('.group-expander[data-i18n-show]').forEach(element => {
        element.setAttribute('aria-label', getMessage(element.dataset.i18nShow, undefined, element.getAttribute('aria-label')));
    });
}

localizeDocument();

const keys = [
    'shorts',
    'shortsHome',
    'shortsSubs',
    'shortsSearch',
    'shortsSidebar',
    'playables',
    'paidPromotion',
    'grouped',
    'groupedMixes',
    'groupedPodcasts',
    'groupedPlaylists',
    'hideLive',
    'hideUpcoming',
    'hideMembersOnly',
    'hideFeaturedServices',
    'feedPills',
    'hideSections'
];

const toggleGroups = Object.freeze([
    { masterId: 'shorts', childKeys: ['shortsHome', 'shortsSidebar', 'shortsSubs', 'shortsSearch'], storeMaster: true },
    { masterId: 'grouped', childKeys: ['groupedMixes', 'groupedPodcasts', 'groupedPlaylists'], storeMaster: true },
    { masterId: 'liveUpcoming', childKeys: ['hideLive', 'hideUpcoming'], storeMaster: false },
    { masterId: 'feedExtras', childKeys: ['feedPills', 'hideSections'], storeMaster: false },
    { masterId: 'promotions', childKeys: ['hideFeaturedServices', 'paidPromotion'], storeMaster: false }
]);
const KOFI_URL = 'https://ko-fi.com/chaseos';
const REVIEW_STORE_URLS = Object.freeze({
    chrome: 'https://chromewebstore.google.com/detail/youtube-ui-cleaner/blnbifjnjgpgfigcpkhcfkiiepokhkdf/reviews',
    edge: 'https://microsoftedge.microsoft.com/addons/detail/youtube-ui-cleaner/dmfgeiiikimggajkkdefmngleooclhci',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/youtube-ui-cleaner/reviews/',
    opera: 'https://addons.opera.com/en/extensions/details/youtube-ui-cleaner/#feedback-container',
    whale: 'https://store.whale.naver.com/detail/nkiaddacajkdagoaajbjdlfglidkedlk'
});
const SIMPLE_VIDEO_SPEED_CONTROLLER_STORE_URLS = Object.freeze({
    chrome: 'https://chromewebstore.google.com/detail/simple-video-speed-contro/kcjfpmjkbkhgojilpihplkedadndnked',
    edge: 'https://microsoftedge.microsoft.com/addons/detail/simple-video-speed-contro/mnmagmdfgdjhbfkdnonnhkfnbnjpehja',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/simple-video-speed-controller/',
    opera: 'https://addons.opera.com/en/extensions/details/simple-video-speed-controller/',
    whale: 'https://store.whale.naver.com/detail/fkcbnblnjclbfnkkhnmoaelklgfiigbc'
});
const REVIEW_STORE_EXTENSION_IDS = Object.freeze({
    chrome: 'blnbifjnjgpgfigcpkhcfkiiepokhkdf',
    edge: 'dmfgeiiikimggajkkdefmngleooclhci',
    firefox: '@youtube-ui-cleaner',
    whale: 'nkiaddacajkdagoaajbjdlfglidkedlk'
});
const SIMPLE_VIDEO_SPEED_CONTROLLER_AD = Object.freeze({
    cardId: 'simple-video-speed-controller-ad-card',
    linkId: 'simple-video-speed-controller-ad-link',
    storageKey: 'simpleVideoSpeedControllerAdShown',
    urls: SIMPLE_VIDEO_SPEED_CONTROLLER_STORE_URLS
});

// Helper to get element
const getEl = (id) => document.getElementById(id);

// Icons
const EDIT_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
const DELETE_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
const SAVE_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`;

let customFilters = []; // Array of { id, keyword, enabled }

// Load saved settings
chrome.storage.sync.get([...keys, 'customFilters'], (result) => {
    // Default to true if not set (first run), except maybe sub-options should track master if undefined?
    // Let's default all to true for "cleaner" experience out of box.
    const settings = {};
    keys.forEach(key => {
        // When the sidebar setting was previously removed, it followed the
        // Home setting. Preserve that behavior until the user changes it.
        settings[key] = key === 'shortsSidebar' && result[key] === undefined
            ? (result.shortsHome !== undefined ? result.shortsHome : true)
            : (result[key] !== undefined ? result[key] : true);
        const el = getEl(key);
        if (el) el.checked = settings[key];
    });

    // Persist the inferred value once so Home and Sidebar are independent
    // after this migration, even if only the Home option changes later.
    if (result.shortsSidebar === undefined) {
        chrome.storage.sync.set({ shortsSidebar: settings.shortsSidebar });
    }

    // Handle custom filters list
    customFilters = result['customFilters'] || [];
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFilters);
    } else {
        renderFilters();
    }

    // Ensure consistency on load
    updateMasterToggleState();
});

// Custom Filter Rendering
function renderFilters(focusId = null) {
    const list = getEl('filterList');
    if (!list) return; // In case it runs before DOM is ready somehow
    list.innerHTML = '';
    customFilters.forEach((filter, index) => {
        // Ensure keywords array exists
        if (!filter.keywords) filter.keywords = [];
        
        const item = document.createElement('div');
        item.className = 'filter-item';
        item.dataset.id = filter.id;
        
        let summaryHtml = '';
        if (filter.keywords.length > 0) {
            summaryHtml = `<div class="filter-summary">${filter.keywords.map(escapeHtml).join(', ')}</div>`;
        } else {
            summaryHtml = `<div class="filter-summary filter-no-keywords">${getMessage('noKeywordsAdded', undefined, 'No keywords added')}</div>`;
        }
        
        const hints = [
            'keywordHintSpoiler', 'keywordHintScore', 'keywordHintResult', 'keywordHintEnding',
            'keywordHintWinner', 'keywordHintHighlights', 'keywordHintFinale', 'keywordHintDefeats',
            'keywordHintEliminated', 'keywordHintDrafted', 'keywordHintReview', 'keywordHintReaction'
        ].map(key => getMessage(key));
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        const removeKeywordLabel = keyword => getMessage('removeKeyword', keyword, `Remove ${keyword}`);
        
        item.innerHTML = `
            <div class="filter-header">
              <label class="toggle">
                <input type="checkbox" class="filter-toggle" aria-label="${escapeHtml(filter.title || getMessage('unnamedFilter', undefined, 'Unnamed Filter'))}" ${filter.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <div class="filter-title-container">
                <div class="filter-title">${escapeHtml(filter.title || getMessage('unnamedFilter', undefined, 'Unnamed Filter'))}</div>
                ${summaryHtml}
              </div>
              <input type="text" class="filter-title-input" value="${escapeHtml(filter.title || '')}" placeholder="${escapeHtml(getMessage('enterFilterName', undefined, 'Enter Filter Name'))}" />
              <div class="filter-actions">
                <button class="icon-btn edit-btn" title="${getMessage('edit', undefined, 'Edit')}" aria-label="${getMessage('edit', undefined, 'Edit')}">
                  ${EDIT_ICON}
                </button>
                <button class="icon-btn delete-btn" title="${getMessage('delete', undefined, 'Delete')}" aria-label="${getMessage('delete', undefined, 'Delete')}">
                  ${DELETE_ICON}
                </button>
              </div>
            </div>
            <div class="filter-body">
              <div class="filter-keywords-label">${getMessage('keywordsInGroup', undefined, 'Keywords in this group:')}</div>
              <div class="keyword-input-group">
                <input type="text" class="group-keyword-input" placeholder="${escapeHtml(getMessage('addKeywordExample', randomHint, `Add keyword (e.g., ${randomHint})`))}" />
                <button class="add-group-keyword-btn">${getMessage('add', undefined, 'Add')}</button>
              </div>
              <div class="keyword-list">
                ${filter.keywords.map(kw => `
                  <div class="keyword-chip">
                    ${escapeHtml(kw)}
                    <button class="remove-kw-btn" data-kw="${escapeHtml(kw)}" title="${escapeHtml(removeKeywordLabel(kw))}" aria-label="${escapeHtml(removeKeywordLabel(kw))}">&#10005;</button>
                  </div>
                `).join('')}
              </div>
              <button class="done-btn">${SAVE_ICON} ${getMessage('save', undefined, 'Save').toLocaleUpperCase()}</button>
            </div>
        `;
        
        // Toggle Listener
        item.querySelector('.filter-toggle').addEventListener('change', (e) => {
            filter.enabled = e.target.checked;
            saveSetting('customFilters', customFilters);
        });

        // Edit/Expand Listener
        const editBtn = item.querySelector('.edit-btn');
        const titleInput = item.querySelector('.filter-title-input');
        
        editBtn.addEventListener('click', () => {
            renderFilters(filter.id);
        });

        // Done/Collapse Listener
        item.querySelector('.done-btn').addEventListener('click', () => {
            const val = titleInput.value.trim();
            if (val && val !== filter.title) {
                filter.title = val;
                saveSetting('customFilters', customFilters);
            }
            item.classList.remove('editing');
            renderFilters();
        });

        // Handle enter on title
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') item.querySelector('.done-btn').click();
        });

        // Auto-save title to memory so it's not lost on re-renders
        titleInput.addEventListener('input', () => {
            filter.title = titleInput.value.trim();
        });

        // Save title to storage if user clicks away or closes popup while editing
        titleInput.addEventListener('change', () => {
            filter.title = titleInput.value.trim();
            saveSetting('customFilters', customFilters);
        });

        // Add Group Keyword Listener
        const addKwBtn = item.querySelector('.add-group-keyword-btn');
        const kwInput = item.querySelector('.group-keyword-input');
        
        const addKeyword = () => {
            const rawVal = kwInput.value;
            const kws = rawVal.split(',').map(k => k.trim()).filter(k => k.length > 0);
            
            // Ensure title is saved before re-rendering
            const currentTitle = titleInput.value.trim();
            if (currentTitle !== filter.title) {
                filter.title = currentTitle;
            }
            
            let addedAny = false;
            kws.forEach(kw => {
                if (!filter.keywords.includes(kw)) {
                    filter.keywords.push(kw);
                    addedAny = true;
                }
            });
            
            if (addedAny || currentTitle !== filter.title) {
                saveSetting('customFilters', customFilters);
            }
            
            if (kws.length > 0 || currentTitle !== filter.title) {
                renderFilters(filter.id + '_kw');
            }
        };

        addKwBtn.addEventListener('click', addKeyword);
        kwInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addKeyword();
        });

        // Remove Group Keyword Listener
        item.querySelectorAll('.remove-kw-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Ensure title is saved before re-rendering
                const currentTitle = titleInput.value.trim();
                if (currentTitle !== filter.title) {
                    filter.title = currentTitle;
                }
                const kwToRemove = btn.dataset.kw;
                filter.keywords = filter.keywords.filter(k => k !== kwToRemove);
                saveSetting('customFilters', customFilters);
                renderFilters(filter.id + '_kw');
            });
        });

        // Delete Group Listener
        item.querySelector('.delete-btn').addEventListener('click', () => {
            customFilters = customFilters.filter(f => f.id !== filter.id);
            saveSetting('customFilters', customFilters);
            renderFilters();
        });

        list.appendChild(item);

        // Handle Focus
        if (focusId === filter.id) {
            item.classList.add('editing');
            setTimeout(() => item.querySelector('.filter-title-input').focus(), 0);
        } else if (focusId === filter.id + '_kw') {
            item.classList.add('editing');
            setTimeout(() => item.querySelector('.group-keyword-input').focus(), 0);
        }
    });
}

// Update grouped master toggles, including a mixed-state indicator.
function updateMasterToggleState() {
    toggleGroups.forEach(({ masterId, childKeys }) => {
        const master = getEl(masterId);
        const enabledCount = childKeys.filter(key => getEl(key).checked).length;
        master.checked = enabledCount === childKeys.length;
        master.indeterminate = enabledCount > 0 && enabledCount < childKeys.length;
    });
}

// Save specific key
function saveSetting(key, val) {
    saveSettingsAndNotify({ [key]: val });
}

function saveSettingsAndNotify(updates, options = {}) {
    const shouldMarkInteraction = options.markInteraction !== false;
    const payload = shouldMarkInteraction
        ? { ...updates, hasInteractedWithApp: true }
        : updates;

    chrome.storage.sync.set(payload, () => {
        if (shouldMarkInteraction) {
            checkReviewPrompt();
        }

        notifyContentScript();

        if (typeof options.onComplete === 'function') {
            options.onComplete();
        }
    });
}

function notifyContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_SETTINGS' });
        }
    });
}

function checkReviewPrompt() {
    chrome.storage.sync.get([
        'hasInteractedWithApp',
        'reviewClicked',
        SIMPLE_VIDEO_SPEED_CONTROLLER_AD.storageKey
    ], updateReviewPromptVisibility);
}

function updateReviewPromptVisibility(state) {
    const reviewCard = getEl('review-card');
    if (!reviewCard) {
        updatePromotedExtensionAdVisibility(state);
        return;
    }

    const shouldShowReviewPrompt = state.hasInteractedWithApp && !state.reviewClicked;

    reviewCard.style.display = shouldShowReviewPrompt ? 'block' : 'none';

    if (shouldShowReviewPrompt) {
        hidePromotedExtensionAd();
    } else {
        updatePromotedExtensionAdVisibility(state);
    }
}

function determineStoreUrl() {
    return REVIEW_STORE_URLS[detectReviewStore()];
}

function determineSimpleVideoSpeedControllerStoreUrl() {
    return SIMPLE_VIDEO_SPEED_CONTROLLER_AD.urls[detectReviewStore()];
}

function updatePromotedExtensionAdVisibility(state) {
    const card = getEl(SIMPLE_VIDEO_SPEED_CONTROLLER_AD.cardId);
    if (!card) return;

    card.style.display = state.reviewClicked && !state[SIMPLE_VIDEO_SPEED_CONTROLLER_AD.storageKey]
        ? 'block'
        : 'none';
}

function hidePromotedExtensionAd() {
    const card = getEl(SIMPLE_VIDEO_SPEED_CONTROLLER_AD.cardId);
    if (card) card.style.display = 'none';
}

function getReviewRoutingEnvironment() {
    const runtime = typeof chrome !== 'undefined' ? chrome.runtime : null;
    const userAgentData = navigator.userAgentData || {};

    return {
        extensionId: runtime && runtime.id ? runtime.id : '',
        extensionUrl: runtime && runtime.getURL ? runtime.getURL('') : '',
        userAgent: navigator.userAgent || '',
        userAgentBrands: Array.isArray(userAgentData.brands) ? userAgentData.brands : []
    };
}

function detectReviewStore(env = getReviewRoutingEnvironment()) {
    const extensionId = env.extensionId || '';
    const extensionUrl = env.extensionUrl || '';
    const ua = env.userAgent || '';
    const brandText = (env.userAgentBrands || [])
        .map(brand => brand && brand.brand)
        .filter(Boolean)
        .join(' ');

    if (extensionId === REVIEW_STORE_EXTENSION_IDS.firefox || extensionUrl.startsWith('moz-extension://') || ua.includes('Firefox')) {
        return 'firefox';
    }

    if (extensionId === REVIEW_STORE_EXTENSION_IDS.whale || /\bWhale\b/.test(brandText) || /Whale\//.test(ua)) {
        return 'whale';
    }

    if (extensionId === REVIEW_STORE_EXTENSION_IDS.edge || /\bMicrosoft Edge\b/.test(brandText) || /Edg(A|iOS)?\//.test(ua)) {
        return 'edge';
    }

    if (/\bOpera\b/.test(brandText) || ua.includes('OPR/') || ua.includes('Opera')) {
        return 'opera';
    }

    return 'chrome';
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const kofiLink = getEl('kofi-link');
    if (kofiLink) kofiLink.href = KOFI_URL;

    const reviewLink = getEl('review-link');
    if (reviewLink) {
        reviewLink.href = determineStoreUrl();
        reviewLink.addEventListener('click', (e) => {
            e.preventDefault();
            const reviewUrl = reviewLink.href;

            chrome.storage.sync.set({ reviewClicked: true }, () => {
                updateReviewPromptVisibility({
                    hasInteractedWithApp: true,
                    reviewClicked: true,
                    [SIMPLE_VIDEO_SPEED_CONTROLLER_AD.storageKey]: false
                });
            });

            if (reviewUrl && reviewUrl !== '#') {
                chrome.tabs.create({ url: reviewUrl });
            }
        });
    }

    const promotedExtensionLink = getEl(SIMPLE_VIDEO_SPEED_CONTROLLER_AD.linkId);
    if (promotedExtensionLink) {
        promotedExtensionLink.href = determineSimpleVideoSpeedControllerStoreUrl();
        promotedExtensionLink.addEventListener('click', (e) => {
            e.preventDefault();
            const promotedExtensionUrl = promotedExtensionLink.href;

            chrome.storage.sync.set({ [SIMPLE_VIDEO_SPEED_CONTROLLER_AD.storageKey]: true }, () => {
                hidePromotedExtensionAd();
            });

            if (promotedExtensionUrl && promotedExtensionUrl !== '#') {
                chrome.tabs.create({ url: promotedExtensionUrl });
            }
        });
    }

    checkReviewPrompt();

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs and views
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding view
            btn.classList.add('active');
            getEl(btn.dataset.target).classList.add('active');
        });
    });

    // Initial render in case it was missed
    renderFilters();

    // Add Filter Group Handler
    const createBtn = getEl('createGroupBtn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            const newId = Date.now().toString();
            customFilters.unshift({
                id: newId,
                title: '',
                keywords: [],
                enabled: true
            });
            saveSetting('customFilters', customFilters);
            renderFilters(newId);
        });
    }



    // Expandable master toggles and their independent child settings.
    toggleGroups.forEach(({ masterId, childKeys, storeMaster }) => {
        getEl(masterId).addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            e.target.indeterminate = false;

            const updates = {};
            childKeys.forEach(key => {
                getEl(key).checked = isChecked;
                updates[key] = isChecked;
            });
            if (storeMaster) updates[masterId] = isChecked;

            saveSettingsAndNotify(updates);
        });

        childKeys.forEach(key => {
            getEl(key).addEventListener('change', (e) => {
                updateMasterToggleState();
                const updates = { [key]: e.target.checked };
                if (storeMaster) updates[masterId] = getEl(masterId).checked;
                saveSettingsAndNotify(updates);
            });
        });
    });

    document.querySelectorAll('.group-expander').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const group = button.closest('.option-group');
            const isExpanded = group.classList.toggle('expanded');
            const children = group.querySelector('.option-group-children');
            children.toggleAttribute('inert', !isExpanded);
            children.setAttribute('aria-hidden', String(!isExpanded));
            button.setAttribute('aria-expanded', String(isExpanded));
            const messageKey = isExpanded ? button.dataset.i18nHide : button.dataset.i18nShow;
            button.setAttribute('aria-label', getMessage(messageKey, undefined, button.getAttribute('aria-label')));
        });
    });

    // Other separate toggles
    ['playables', 'hideMembersOnly'].forEach(key => {
        getEl(key).addEventListener('change', (e) => {
            saveSetting(key, e.target.checked);
        });
    });

    // Generic row click handler for better UX
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', (e) => {
            // If the user clicked the toggle itself, do nothing (let default behavior happen)
            if (e.target.closest('.toggle, .group-expander')) return;

            // Otherwise, find the checkbox and click it
            const checkbox = option.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.click();
            }
        });
    });

    // Save Button Removed
});
