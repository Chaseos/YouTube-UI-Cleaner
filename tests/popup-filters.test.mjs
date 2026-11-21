import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../popup.js', import.meta.url), 'utf8');
const isEmptyFilter = vm.runInNewContext(source.match(/const isEmptyFilter = (.+);/)[1]);

test('a filter with no name and no keywords is empty', () => {
    assert.equal(isEmptyFilter({ title: '', keywords: [] }), true);
    assert.equal(isEmptyFilter({ title: '   ', keywords: [] }), true);
    assert.equal(isEmptyFilter({ title: '' }), true);
});

test('a filter with a name or keywords is kept', () => {
    assert.equal(isEmptyFilter({ title: 'Sports', keywords: [] }), false);
    assert.equal(isEmptyFilter({ title: '', keywords: ['spoiler'] }), false);
});
