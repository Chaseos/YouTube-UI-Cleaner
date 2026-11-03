import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../popup.js', import.meta.url), 'utf8');
const popupHtml = await readFile(new URL('../popup.html', import.meta.url), 'utf8');
const parseKeywords = vm.runInNewContext(source.match(/const parseKeywords = (.+);/)[1]);

test('keywords split on the comma used by each supported language', () => {
    for (const comma of [',', '，', '、', '،', '﹐', '､']) {
        assert.deepEqual(Array.from(parseKeywords(` spoiler ${comma} finale `)), ['spoiler', 'finale']);
    }
});

test('blank keywords are dropped', () => {
    assert.deepEqual(Array.from(parseKeywords(',  ,、')), []);
});

test('popup declares UTF-8 so its scripts keep non-ASCII separators intact', () => {
    assert.match(popupHtml, /<head>\s*<meta charset="utf-8">/);
});
