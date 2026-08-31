import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../content.js', import.meta.url), 'utf8');

function loadContent(saved) {
    const classes = new Set();
    let requestedKeys, onMessage;
    const context = vm.createContext({
        document: {
            documentElement: { classList: {
                add: name => classes.add(name), remove: name => classes.delete(name),
                toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }
            } },
            querySelectorAll: () => [], querySelector: () => null
        },
        window: { location: { pathname: '/' }, addEventListener() {} },
        YouTubeUICleanerLocales: { resolvePageLocale: () => 'en', getTerms: () => ({}) },
        chrome: {
            storage: { sync: { get(keys, callback) { requestedKeys = keys; callback(saved); } } },
            runtime: { onMessage: { addListener(listener) { onMessage = listener; } } }
        },
        MutationObserver: class { observe() {} }, setInterval() {}, requestAnimationFrame() {}
    });
    // The production script runs its initial load and registers its normal message handler.
    vm.runInContext(source, context);
    return { classes, requestedKeys, reload: () => onMessage({ type: 'UPDATE_SETTINGS' }) };
}

test('sponsored video filter defaults on without changing an existing promotion preference', () => {
    const page = loadContent({ paidPromotion: false });
    assert.ok(page.requestedKeys.includes('hideSponsoredVideos'));
    assert.ok(page.classes.has('yt-hide-sponsored-videos'));
    assert.equal(page.classes.has('yt-hide-promoted'), false);
});

test('saved sponsored preference survives initial load and responds independently to popup messages', () => {
    const saved = { hideSponsoredVideos: false, paidPromotion: true };
    const page = loadContent(saved);
    assert.equal(page.classes.has('yt-hide-sponsored-videos'), false);
    saved.hideSponsoredVideos = true;
    page.reload();
    assert.ok(page.classes.has('yt-hide-sponsored-videos'));
    saved.hideSponsoredVideos = false;
    page.reload();
    assert.equal(page.classes.has('yt-hide-sponsored-videos'), false);
    assert.ok(page.classes.has('yt-hide-promoted'));
});
