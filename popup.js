/* popup.js */

const keys = [
    'shorts',
    'shortsHome',
    'shortsSubs',
    'shortsSearch',
    'playables',
    'paidPromotion',
    'grouped',
    'groupedMixes',
    'groupedPodcasts',
    'groupedPlaylists',
    'hideLive',
    'feedPills',
    'hideSections'
];

const subKeys = ['shortsHome', 'shortsSubs', 'shortsSearch'];
const groupedSubKeys = ['groupedMixes', 'groupedPodcasts', 'groupedPlaylists'];
const KOFI_URL = 'https://ko-fi.com/chaseos';
const REVIEW_STORE_URLS = Object.freeze({
    chrome: 'https://chromewebstore.google.com/detail/youtube-ui-cleaner/blnbifjnjgpgfigcpkhcfkiiepokhkdf/reviews',
    edge: 'https://microsoftedge.microsoft.com/addons/detail/youtube-ui-cleaner/dmfgeiiikimggajkkdefmngleooclhci',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/youtube-ui-cleaner/reviews/',
    opera: 'https://addons.opera.com/en/extensions/details/youtube-ui-cleaner/#feedback-container'
});
const REVIEW_STORE_EXTENSION_IDS = Object.freeze({
    chrome: 'blnbifjnjgpgfigcpkhcfkiiepokhkdf',
    edge: 'dmfgeiiikimggajkkdefmngleooclhci',
    firefox: '@youtube-ui-cleaner'
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
        settings[key] = result[key] !== undefined ? result[key] : true;
        const el = getEl(key);
        if (el) el.checked = settings[key];
    });

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
            summaryHtml = `<div class="filter-summary">${filter.keywords.join(', ')}</div>`;
        } else {
            summaryHtml = `<div class="filter-summary filter-no-keywords">No keywords added</div>`;
        }
        
        const hints = ['Spoiler', 'Score', 'Result', 'Ending', 'Winner', 'Highlights', 'Finale', 'Defeats', 'Eliminated', 'Drafted', 'Review', 'Reaction'];
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        
        item.innerHTML = `
            <div class="filter-header">
              <label class="toggle">
                <input type="checkbox" class="filter-toggle" ${filter.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <div class="filter-title-container">
                <div class="filter-title">${filter.title || 'Unnamed Filter'}</div>
                ${summaryHtml}
              </div>
              <input type="text" class="filter-title-input" value="${filter.title || ''}" placeholder="Enter Filter Name" />
              <div class="filter-actions">
                <button class="icon-btn edit-btn" title="Edit">
                  ${EDIT_ICON}
                </button>
                <button class="icon-btn delete-btn" title="Delete">
                  ${DELETE_ICON}
                </button>
              </div>
            </div>
            <div class="filter-body">
              <div class="filter-keywords-label">Keywords in this group:</div>
              <div class="keyword-input-group">
                <input type="text" class="group-keyword-input" placeholder="Add keyword (e.g., ${randomHint})" />
                <button class="add-group-keyword-btn">Add</button>
              </div>
              <div class="keyword-list">
                ${filter.keywords.map(kw => `
                  <div class="keyword-chip">
                    ${kw}
                    <button class="remove-kw-btn" data-kw="${kw}">&#10005;</button>
                  </div>
                `).join('')}
              </div>
              <button class="done-btn">${SAVE_ICON} SAVE</button>
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

// Update Main Toggle based on Sub-toggles
function updateMasterToggleState() {
    const anySubOn = subKeys.some(key => getEl(key).checked);
    getEl('shorts').checked = anySubOn;

    const anyGroupedOn = groupedSubKeys.some(key => getEl(key).checked);
    if (getEl('grouped')) getEl('grouped').checked = anyGroupedOn;
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
    chrome.storage.sync.get(['hasInteractedWithApp', 'reviewClicked'], updateReviewPromptVisibility);
}

function updateReviewPromptVisibility(state) {
    const reviewCard = getEl('review-card');
    if (!reviewCard) return;

    reviewCard.style.display = state.hasInteractedWithApp && !state.reviewClicked
        ? 'block'
        : 'none';
}

function determineStoreUrl() {
    return REVIEW_STORE_URLS[detectReviewStore()];
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
                    reviewClicked: true
                });
            });

            if (reviewUrl && reviewUrl !== '#') {
                chrome.tabs.create({ url: reviewUrl });
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



    // Main Shorts Toggle
    getEl('shorts').addEventListener('change', (e) => {
        const isChecked = e.target.checked;

        // Update UI for sub-toggles
        subKeys.forEach(key => {
            getEl(key).checked = isChecked;
        });

        // Save all states
        const updates = { 'shorts': isChecked };
        subKeys.forEach(key => updates[key] = isChecked);

        saveSettingsAndNotify(updates);
    });

    // Sub-toggles
    subKeys.forEach(key => {
        getEl(key).addEventListener('change', (e) => {
            const anyOn = subKeys.some(k => getEl(k).checked);
            const masterEl = getEl('shorts');
            
            const updates = { [key]: e.target.checked };
            
            if (masterEl.checked !== anyOn) {
                masterEl.checked = anyOn;
                updates['shorts'] = anyOn;
            }

            saveSettingsAndNotify(updates);
        });
    });

    // Main Grouped Videos Toggle
    getEl('grouped').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        groupedSubKeys.forEach(key => {
            getEl(key).checked = isChecked;
        });
        const updates = { 'grouped': isChecked };
        groupedSubKeys.forEach(key => updates[key] = isChecked);
        saveSettingsAndNotify(updates);
    });

    // Grouped Videos Sub-toggles
    groupedSubKeys.forEach(key => {
        getEl(key).addEventListener('change', (e) => {
            const anyOn = groupedSubKeys.some(k => getEl(k).checked);
            const masterEl = getEl('grouped');
            
            const updates = { [key]: e.target.checked };

            if (masterEl.checked !== anyOn) {
                masterEl.checked = anyOn;
                updates['grouped'] = anyOn;
            }

            saveSettingsAndNotify(updates);
        });
    });

    // Other separate toggles
    ['playables', 'paidPromotion', 'hideLive', 'feedPills', 'hideSections'].forEach(key => {
        getEl(key).addEventListener('change', (e) => {
            saveSetting(key, e.target.checked);
        });
    });

    // Generic row click handler for better UX
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', (e) => {
            // If the user clicked the toggle itself, do nothing (let default behavior happen)
            if (e.target.closest('.toggle')) return;

            // Otherwise, find the checkbox and click it
            const checkbox = option.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.click();
            }
        });
    });

    // Save Button Removed
});
