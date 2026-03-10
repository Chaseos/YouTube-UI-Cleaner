/* popup.js */

const keys = [
    'shorts',
    'shortsHome',
    'shortsSubs',
    'shortsSearch',
    'shortsSidebar',
    'playables',
    'paidPromotion',
    'hideMixes',
    'hideLive',
    'hideSections'
];

const subKeys = ['shortsHome', 'shortsSubs', 'shortsSearch', 'shortsSidebar'];

// Helper to get element
const getEl = (id) => document.getElementById(id);

// Load saved settings
chrome.storage.sync.get(keys, (result) => {
    // Default to true if not set (first run), except maybe sub-options should track master if undefined?
    // Let's default all to true for "cleaner" experience out of box.
    const settings = {};
    keys.forEach(key => {
        settings[key] = result[key] !== undefined ? result[key] : true;
        const el = getEl(key);
        if (el) el.checked = settings[key];
    });

    // Ensure consistency on load
    updateMasterToggleState();
});

// Update Main Toggle based on Sub-toggles
function updateMasterToggleState() {
    const anySubOn = subKeys.some(key => getEl(key).checked);
    getEl('shorts').checked = anySubOn;
}

// Save specific key
function saveSetting(key, val) {
    chrome.storage.sync.set({ [key]: val }, () => {
        // Notify content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_SETTINGS' });
            }
        });
    });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {

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

        chrome.storage.sync.set(updates, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_SETTINGS' });
            });
        });
    });

    // Sub-toggles
    subKeys.forEach(key => {
        getEl(key).addEventListener('change', (e) => {
            // Save this specific setting
            saveSetting(key, e.target.checked);

            // Check if we need to update Main
            // Rule: "If at least 1 subtoggle is on, this is on"
            // Rule: "Toggling off all 3 (now 4) subtoggles toggles this off"
            const anyOn = subKeys.some(k => getEl(k).checked);
            const masterEl = getEl('shorts');

            if (masterEl.checked !== anyOn) {
                masterEl.checked = anyOn;
                saveSetting('shorts', anyOn);
            }
        });
    });

    // Other separate toggles
    ['playables', 'paidPromotion', 'hideMixes', 'hideLive', 'hideSections'].forEach(key => {
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
