import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const localeSource = await readFile(new URL('../youtube-locales.js', import.meta.url), 'utf8');
const contentSource = await readFile(new URL('../content.js', import.meta.url), 'utf8');

function loadPage(lang = 'en') {
    const classes = new Set();
    const intervals = new Map();
    const timeouts = [];
    const observers = [];
    const frames = [];
    const styles = new Map();
    const wrappers = [];
    let timerId = 0;
    const dropdown = { getBoundingClientRect: () => ({ width: 100 }), querySelectorAll: () => [] };
    const document = {
        documentElement: { lang, classList: {
            add: name => classes.add(name), remove: name => classes.delete(name),
            toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }
        } },
        querySelectorAll(selector) {
            if (selector === 'tp-yt-iron-dropdown') return [dropdown];
            if (selector === '.custom-hover-btn[data-action]') return wrappers;
            return [];
        },
        querySelector: () => null,
        getElementById: id => styles.get(id),
        createElement: () => ({}),
        head: { appendChild: element => styles.set(element.id, element) }
    };
    const context = vm.createContext({
        document, URL, navigator: { language: 'en-US' },
        window: { location: { pathname: '/', origin: 'https://www.youtube.com' }, addEventListener() {} },
        console: { log() {} },
        chrome: {
            storage: { sync: { get(keys, callback) { callback({}); } } },
            runtime: { onMessage: { addListener() {} } }
        },
        MutationObserver: class {
            constructor(callback) { this.callback = callback; observers.push(this); }
            observe(target, options) { this.options = options; }
        },
        setInterval(callback, delay) { intervals.set(++timerId, { callback, delay }); return timerId; },
        clearInterval: id => intervals.delete(id),
        setTimeout(callback) { timeouts.push(callback); return timeouts.length; },
        requestAnimationFrame: callback => frames.push(callback)
    });
    vm.runInContext(localeSource, context);
    vm.runInContext(contentSource, context);
    // These visual effects are independent of native menu action selection.
    vm.runInContext('guardScrollPosition = () => {}; showWatchLaterFeedback = () => { feedbackCount++; };', context);
    context.feedbackCount = 0;
    return { context, document, dropdown, intervals, observers, frames, wrappers, styles };
}

function menuItem(label, { primary = label, legacy = false, hasLabel = true } = {}) {
    const item = { clicks: 0, textContent: label, click() { this.clicks++; } };
    item.querySelector = selector => {
        if (selector === (legacy ? 'yt-formatted-string' : '.ytListItemViewModelTitle') && hasLabel) return { textContent: primary };
        if (selector === '[role="menuitem"], button, a') return item;
        return null;
    };
    return item;
}

function runMenu(page, action, items) {
    const menuButton = { clicks: 0, click() { this.clicks++; } };
    const card = { querySelector(selector) {
        assert.ok(selector.includes('.ytLockupMetadataViewModelMenuButton button'));
        return menuButton;
    } };
    page.dropdown.querySelectorAll = () => items;
    page.context.performMenuAction({}, () => card, action);
    const timer = [...page.intervals.values()].find(timer => timer.delay === 50);
    assert.ok(timer);
    timer.callback();
    return { menuButton, timer };
}

test('save never clicks removal or an unrelated action, even when its description mentions Watch later', () => {
    const page = loadPage();
    const remove = menuItem('Remove from Watch later');
    const share = menuItem('Share Save to Watch later', { primary: 'Share' });
    const save = menuItem('Save to Watch later Extra description', { primary: 'Save to Watch later' });
    runMenu(page, 'watchLater', [remove, share, save]);
    assert.equal(remove.clicks, 0);
    assert.equal(share.clicks, 0);
    assert.equal(save.clicks, 1);
    assert.equal(page.context.feedbackCount, 1);
});

test('a remove-only menu times out without a save click or success feedback', () => {
    const page = loadPage();
    const remove = menuItem('Remove from Watch later', { hasLabel: false });
    const { timer, menuButton } = runMenu(page, 'watchLater', [remove]);
    for (let i = 0; i < 40; i++) timer.callback();
    assert.equal(remove.clicks, 0);
    assert.equal(page.context.feedbackCount, 0);
    assert.equal(menuButton.clicks, 2); // Open, then close on timeout.
    assert.equal([...page.intervals.values()].some(timer => timer.delay === 50), false);
});

test('legacy localized menu labels are matched exactly using the page locale', () => {
    const page = loadPage('pt-PT');
    const other = menuItem('Não recomendar canal', { legacy: true });
    const action = menuItem('Sem interesse', { legacy: true });
    runMenu(page, 'notInterested', [other, action]);
    assert.equal(other.clicks, 0);
    assert.equal(action.clicks, 1);
});

test('language changes refresh injected labels and observe content reuse without class feedback loops', () => {
    const page = loadPage('ja');
    const attrs = {};
    const wrapper = { dataset: { action: 'notInterested' }, querySelector: () => ({ setAttribute: (key, value) => { attrs[key] = value; } }) };
    page.wrappers.push(wrapper);
    const langObserver = page.observers.find(observer => observer.options.attributeFilter?.includes('lang'));
    page.document.documentElement.lang = 'pt-PT';
    langObserver.callback();
    assert.equal(wrapper.title, 'Sem interesse');
    assert.equal(attrs['aria-label'], 'Sem interesse');
    const contentObserver = page.observers.find(observer => observer.options.subtree);
    assert.equal(contentObserver.options.characterData, true);
    assert.equal(contentObserver.options.attributeFilter.includes('class'), false);
    contentObserver.callback([{ type: 'childList', addedNodes: [], removedNodes: [{}] }]);
    contentObserver.callback([{ type: 'characterData' }]);
    assert.equal(page.frames.length, 1); // Coalesces updates before the next frame.
    page.frames.shift()();
});

test('Shorts URLs use parsed same-origin paths and reject lookalikes', () => {
    const { context } = loadPage();
    const link = href => ({ getAttribute: () => href });
    for (const href of ['/shorts', '/shorts/123?feature=share', 'https://www.youtube.com/shorts/123']) {
        assert.equal(Boolean(context.isShortsLink(link(href))), true, href);
    }
    for (const href of [null, '/watch?v=shorts', '/shortstuff', 'https://example.org/shorts/123', 'https://www.youtube.com.evil.test/shorts/123']) {
        assert.equal(Boolean(context.isShortsLink(link(href))), false, href);
    }
});
