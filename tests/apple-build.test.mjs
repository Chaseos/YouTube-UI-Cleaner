import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import { removeRange, replaceRequired, prepareSafari, validateSafari } from '../scripts/safari.mjs';

const build = spawnSync(process.execPath, ['scripts/build.mjs'], { encoding: 'utf8' });
assert.equal(build.status, 0, build.stderr);
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const config = JSON.parse(await read('apple/configuration.json'));
const runtime = ['content.js','youtube-locales.js','styles.css','popup.html','popup.js','icon.png','PRIVACYPOLICY.md','kofi_symbol.svg','simple-video-speed-controller-icon.png'];

test('browser packages preserve the shared runtime and locale values', async () => {
  for (const target of ['chromium','firefox']) {
    for (const file of runtime) assert.deepEqual(await readFile(`dist/${target}/${file}`), await readFile(file), `${target}/${file}`);
    for (const locale of (await readdir('_locales', {withFileTypes:true})).filter(entry => entry.isDirectory()).map(entry => entry.name)) assert.equal(await read(`dist/${target}/_locales/${locale}/messages.json`), await read(`_locales/${locale}/messages.json`));
  }
});
test('Mac package includes the shared filtering fixes', async () => {
  assert.equal(await read('dist/safari/youtube-locales.js'), await read('youtube-locales.js'));
  assert.equal(await read('dist/safari/styles.css'), await read('styles.css'));
  assert.ok((await read('dist/safari/content.js')).startsWith(await read('content.js')));
});
test('packages contain only runtime resources and target-specific manifest settings', async () => {
  for (const target of ['chromium','firefox','safari']) {
    const expected = target === 'safari' ? [...runtime.filter(f => !/kofi|simple-video/.test(f)), 'actions.js','safari.css'] : runtime;
    assert.deepEqual((await readdir(`dist/${target}`)).sort(), [...expected,'manifest.json','_locales'].sort());
    const manifest = JSON.parse(await read(`dist/${target}/manifest.json`));
    assert.deepEqual(manifest.permissions, ['storage']);
    assert.deepEqual(manifest.host_permissions, ['*://*.youtube.com/*']);
    assert.equal(Boolean(manifest.browser_specific_settings), target === 'firefox');
    assert.equal(manifest.background, undefined);
    const zip = spawnSync('unzip', ['-Z1', `dist/youtube-ui-cleaner-${target}.zip`], {encoding:'utf8'});
    assert.equal(zip.status,0);
    assert.doesNotMatch(zip.stdout, /(?:^|\/)(?:apple|build|scripts|tests|\.git)(?:\/|$)/m);
  }
});
test('Safari strips engagement, preserves controls and resolves all markup translations', async () => {
  await validateSafari('dist/safari');
  const html = await read('dist/safari/popup.html');
  assert.match(html, /youtubeuicleaner:\/\/support/);
  for (const id of ['shorts','grouped','liveUpcoming','feedExtras','hideSponsoredVideos','promotions','filterList','createGroupBtn']) assert.ok(html.includes(`id="${id}"`));
  assert.equal((html.match(/<div\b/g)||[]).length, (html.match(/<\/div>/g)||[]).length);
  for (const locale of (await readdir('_locales', {withFileTypes:true})).filter(entry => entry.isDirectory()).map(entry => entry.name)) {
    const messages = JSON.parse(await read(`dist/safari/_locales/${locale}/messages.json`));
    assert.ok(Array.from(messages.extensionName.message).length <= 40);
    assert.ok(Array.from(messages.extensionDescription.message).length <= 112, `${locale} extension description length`);
    for (const [key, entry] of Object.entries(messages)) {
      assert.equal(typeof entry.description, 'string', `${locale}.${key} description`);
      assert.ok(entry.description.length > 0 && entry.description.length <= 112, `${locale}.${key} description length`);
    }
    for (const match of html.matchAll(/data-i18n(?:-title|-aria-label|-placeholder|-show|-hide)?="([^"]+)"/g)) assert.ok(messages[match[1]], `${locale}: ${match[1]}`);
  }
});
test('Apple branding covers every Safari locale without changing cleanup translations or other browsers’ artwork', async () => {
  assert.equal(config.name, 'UI Cleaner for YouTube');
  assert.ok(Array.from(config.name).length <= 30);
  const locales = (await readdir('_locales', { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);
  assert.equal(locales.length, 21);
  for (const locale of locales) {
    const original = JSON.parse(await read(`_locales/${locale}/messages.json`));
    const messages = JSON.parse(await read(`dist/safari/_locales/${locale}/messages.json`));
    assert.notEqual(messages.extensionName.message, original.extensionName.message, `${locale}: stale name`);
    assert.match(messages.extensionName.message, /YouTube/, `${locale}: retain brand spelling`);
    assert.notEqual(messages.extensionDescription.message, original.extensionDescription.message, `${locale}: stale description`);
    assert.doesNotMatch(messages.extensionDescription.message, /Safari/i, `${locale}: browser-neutral description`);
    assert.match(messages.extensionDescription.message, /YouTube/, `${locale}: identify the supported site`);
    if (locale === 'en') {
      assert.equal(messages.extensionName.message, config.name);
      assert.equal(messages.extensionDescription.message, 'Independent extension to hide Shorts, promotions, and unwanted clutter on YouTube.');
    } else {
      assert.notEqual(messages.extensionName.message, config.name, `${locale}: translate the product name`);
    }
    for (const [key, entry] of Object.entries(original)) {
      if (['extensionName', 'extensionDescription', 'supportWork', 'reviewPrompt', 'needSpeedControls', 'trySpeedController'].includes(key)) continue;
      assert.equal(messages[key].message, entry.message, `${locale}.${key}: preserve controls`);
    }
  }
  const html = await read('dist/safari/popup.html');
  assert.ok(html.includes(`<title data-i18n="extensionName">${config.name}</title>`));
  assert.ok(html.includes(`<span data-i18n="extensionName">${config.name}</span>`));
  assert.doesNotMatch(html, /YouTube UI Cleaner/);
  assert.equal(await read('dist/safari/PRIVACYPOLICY.md'), (await read('PRIVACYPOLICY.md')).replace('**YouTube UI Cleaner**', `**${config.name}**`));
  assert.deepEqual(await readFile('dist/safari/icon.png'), await readFile('apple/artwork/icon.png'));
  assert.notDeepEqual(await readFile('dist/safari/icon.png'), await readFile('icon.png'));
  const listing = await read('apple/APP_STORE.md');
  assert.ok(listing.includes(`## Name\n\n${config.name}\n`));
});
test('Safari rejects missing or overlong branding and unsafe English build names', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'apple-branding-'));
  try {
    for (const [name, description] of [['', 'Description'], ['x'.repeat(41), 'Description'], ['Name', ''], ['Name', 'x'.repeat(113)]]) {
      await writeFile(path.join(directory, 'messages.json'), JSON.stringify({
        extensionName: { message: name, description: 'Name' },
        extensionDescription: { message: description, description: 'Description' }
      }));
      await assert.rejects(validateSafari(directory), /Invalid Safari extension/);
    }
    for (const name of ['', 'x'.repeat(31), 'Invalid\nName', '$(TARGET_NAME)']) {
      await assert.rejects(prepareSafari('.', directory, { ...config, name }), /Invalid Apple app name/);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('required transformations fail closed instead of producing incomplete packages', () => {
  assert.throws(() => removeRange('source', 'missing', 'end'));
  assert.throws(() => replaceRequired('source', 'missing', '', 'fixture'));
});
test('Safari settings persist only preferences and handle messaging failure', async () => {
  const script = await read('dist/safari/popup.js');
  const logic = script.slice(script.indexOf('function saveSettingsAndNotify('), script.indexOf('// Add event listeners'));
  let saved, notified = 0, completed = 0;
  const notice = {textContent:''};
  const chrome = {storage:{sync:{set(data, callback){saved=data;callback();}}},runtime:{lastError:null},tabs:{query(_query, callback){callback([{id:42}]);},sendMessage(_id,_message,callback){notified++;callback();}}};
  const context = vm.createContext({chrome, document:{getElementById(){return notice;}},getMessage:key=>key});
  vm.runInContext(logic, context);
  context.updates = {shortsHome:false,customFilters:[{id:'1',title:'Topics',keywords:['spoiler'],enabled:true}]};
  context.finished = () => completed++;
  vm.runInContext('saveSettingsAndNotify(updates, {onComplete: finished})',context);
  assert.deepEqual(saved,context.updates); assert.equal(notified,1); assert.equal(completed,1);
  chrome.runtime.lastError={message:'quota'};
  vm.runInContext('saveSettingsAndNotify(updates)',context);
  assert.equal(notified,1);assert.equal(notice.textContent,'saveFailed');
});
test('Safari propagates settings changes to other open tabs but ignores unrelated storage', async () => {
  const script = await read('dist/safari/content.js');
  const added = script.slice(script.indexOf('// Safari preferences are local;'));
  let listener, loads=0;
  const context=vm.createContext({chrome:{storage:{onChanged:{addListener(fn){listener=fn;}}}},keys:['shortsHome','customFilters'],loadSettingsAndApply(){loads++;}});
  vm.runInContext(added,context);
  listener({unrelated:{}},'sync');listener({shortsHome:{}},'session');assert.equal(loads,0);
  listener({customFilters:{}},'sync');listener({shortsHome:{}},'local');assert.equal(loads,2);
});
test('normal scheme has no local billing configuration and local scheme cannot archive', async () => {
  const base='apple/YouTube UI Cleaner/YouTube UI Cleaner.xcodeproj/xcshareddata/xcschemes/';
  const normal=await read(base+'YouTube UI Cleaner.xcscheme');
  const local=await read(base+'StoreKit Testing (macOS).xcscheme');
  for (const scheme of [normal, local]) {
    const references = [...scheme.matchAll(/BuildableName="([^"]+)"/g)];
    assert.ok(references.length > 0);
    for (const reference of references) assert.equal(reference[1], `${config.name}.app`);
  }
  assert.doesNotMatch(normal,/StoreKitConfigurationFileReference/);assert.match(normal,/<ArchiveAction buildConfiguration="Release"/);
  assert.match(local,/StoreKitConfigurationFileReference/);assert.doesNotMatch(local,/<ArchiveAction/);assert.match(local,/buildForArchiving="NO"/);
});
