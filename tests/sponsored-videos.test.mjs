import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../content.js', import.meta.url), 'utf8');

function loadContent(saved, pathname = '/') {
    const classes = new Set();
    let requestedKeys, onStorageChanged;
    const context = vm.createContext({
        document: {
            documentElement: { classList: {
                add: name => classes.add(name), remove: name => classes.delete(name),
                toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }
            } },
            querySelectorAll: () => [], querySelector: () => null
        },
        window: { location: { pathname }, addEventListener() {} },
        YouTubeUICleanerLocales: { resolvePageLocale: () => 'en', getTerms: () => ({}) },
        chrome: {
            storage: {
                sync: { get(keys, callback) { requestedKeys = keys; callback(saved); } },
                onChanged: { addListener(listener) { onStorageChanged = listener; } }
            }
        },
        MutationObserver: class { observe() {} }, setInterval() {}, requestAnimationFrame() {}
    });
    // The production script runs its initial load and registers its normal change handler.
    vm.runInContext(source, context);
    return { classes, requestedKeys, reload: (changes = { hideSponsoredVideos: {} }, area = 'sync') => onStorageChanged(changes, area) };
}

test('sponsored video filter defaults on without changing an existing promotion preference', () => {
    const page = loadContent({ paidPromotion: false });
    assert.ok(page.requestedKeys.includes('hideSponsoredVideos'));
    assert.ok(page.classes.has('yt-hide-sponsored-videos'));
    assert.equal(page.classes.has('yt-hide-promoted'), false);
});

test('saved sponsored preference survives initial load and responds independently to storage changes', () => {
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

test('open tabs refresh for setting changes but ignore unrelated storage', () => {
    const saved = { hideSponsoredVideos: false };
    const page = loadContent(saved);
    saved.hideSponsoredVideos = true;
    page.reload({ hasInteractedWithApp: {} });
    page.reload({ hideSponsoredVideos: {} }, 'session');
    assert.equal(page.classes.has('yt-hide-sponsored-videos'), false);
    page.reload({ hideSponsoredVideos: {} }, 'local');
    assert.ok(page.classes.has('yt-hide-sponsored-videos'));
});

const recommendationFilters = ['yt-hide-members-only', 'yt-hide-upcoming', 'yt-hide-mixes', 'yt-hide-podcasts', 'yt-hide-playlists', 'yt-hide-live'];

test('content-type filters apply only where YouTube recommends videos', () => {
    for (const pathname of ['/', '/feed/subscriptions', '/results', '/watch']) {
        const page = loadContent({}, pathname);
        for (const name of recommendationFilters) assert.ok(page.classes.has(name), `${name} off on ${pathname}`);
    }
    for (const pathname of ['/@veritasium/playlists', '/@NASA/streams', '/podcasts', '/feed/playlists', '/feed/history']) {
        const page = loadContent({}, pathname);
        for (const name of recommendationFilters) assert.equal(page.classes.has(name), false, `${name} on on ${pathname}`);
        assert.ok(page.classes.has('yt-hide-sponsored-videos'), `ads shown on ${pathname}`);
    }
});
