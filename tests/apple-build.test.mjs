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
const runtime = ['content.js','youtube-locales.js','styles.css','popup.html','popup.js','icon.png','chaseos_symbol.png','PRIVACYPOLICY.md','kofi_symbol.svg','simple-video-speed-controller-icon.png'];

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
    assert.deepEqual(manifest.host_permissions, ['*://www.youtube.com/*', '*://m.youtube.com/*']);
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
  assert.throws(() => replaceRequired('a b a', 'a', '', 'fixture'), /ambiguous/);
  assert.throws(() => replaceRequired('<i></i><i></i>', /<i><\/i>/, '', 'fixture'), /ambiguous/);
  assert.throws(() => removeRange('start x start end', 'start', 'end'), /ambiguous/);
});
test('browser popups put the Chaseos Apps link beside the Ko-fi link with its shared styles', async () => {
  const html = await read('popup.html');
  const header = html.slice(html.indexOf('<div class="creator-links">'), html.indexOf('<div class="tabs">'));
  assert.deepEqual([...header.matchAll(/<a id="([^"]+)"/g)].map(match => match[1]), ['site-link', 'kofi-link']);
  const site = html.match(/<a id="site-link"[\s\S]*?<\/a>/)[0];
  for (const attribute of ['href="https://chaseos.app"', 'target="_blank"', 'rel="noopener noreferrer"', 'class="kofi-link site-link"', 'title="Chaseos Apps"', 'aria-label="Chaseos Apps"']) assert.ok(site.includes(attribute), attribute);
  assert.match(site, /<span class="kofi-message site-wordmark" dir="ltr">Chaseos Apps<span aria-hidden="true">°<\/span><\/span>\s*<img src="chaseos_symbol\.png" alt="" class="kofi-icon">/);
  assert.doesNotMatch(site, /data-i18n/);
});
test('Safari keeps the Chaseos Apps link as a third app action without browser support markup', async () => {
  assert.deepEqual(await readFile('dist/safari/chaseos_symbol.png'), await readFile('chaseos_symbol.png'));
  const html = await read('dist/safari/popup.html');
  const actions = html.slice(html.indexOf('<div class="header-actions">'), html.indexOf('<div class="tabs">'));
  assert.deepEqual([...actions.matchAll(/<a id="([^"]+)" class="apple-action/g)].map(match => match[1]), ['apple-rate', 'apple-support', 'apple-site']);
  const site = actions.match(/<a id="apple-site".*?<\/a>/)[0];
  for (const attribute of ['class="apple-action site"', 'href="https://chaseos.app"', 'target="_blank"', 'rel="noopener noreferrer"', 'aria-label="Chaseos Apps"', '<img src="chaseos_symbol.png" alt="">', '<span class="action-label site-wordmark" dir="ltr">Chaseos Apps<span aria-hidden="true">°</span></span>']) assert.ok(site.includes(attribute), attribute);
  assert.doesNotMatch(html, /creator-links|site-link|kofi/i);
  // The shared wordmark style sits outside the stripped support styles.
  assert.match(html, /\.site-wordmark \{[\s\S]*?font-weight: 800;/);
  assert.match(await read('dist/safari/safari.css'), /\.apple-action\.site:hover/);
});
test('Safari settings persist only preferences and report save failures', async () => {
  const script = await read('dist/safari/popup.js');
  const logic = script.slice(script.indexOf('function saveSettings('), script.indexOf('// Add event listeners'));
  let saved, completed = 0;
  const shown = new Set();
  const status = {textContent:'',classList:{add:name=>shown.add(name),remove:name=>shown.delete(name)}};
  const chrome = {storage:{sync:{set(data, callback){saved=data;callback();}}},runtime:{lastError:null}};
  const context = vm.createContext({chrome,getEl:()=>status,getMessage:key=>key});
  vm.runInContext(logic, context);
  context.updates = {shortsHome:false,customFilters:[{id:'1',title:'Topics',keywords:['spoiler'],enabled:true}]};
  context.finished = () => completed++;
  vm.runInContext('saveSettings(updates, {onComplete: finished})',context);
  assert.deepEqual(saved,context.updates); assert.equal(completed,1); assert.equal(shown.has('show'),false);
  chrome.runtime.lastError={message:'quota'};
  vm.runInContext('saveSettings(updates, {onComplete: finished})',context);
  assert.equal(completed,1);assert.equal(status.textContent,'saveFailed');assert.ok(shown.has('show'));
});
test('Safari build refreshes Xcode version settings and Xcode rejects stale ones', async () => {
  const settings = await read('apple/YouTube UI Cleaner/Configurations/Generated/Apple.xcconfig');
  assert.ok(settings.includes(`\nMARKETING_VERSION = ${config.version}\n`), 'stale marketing version');
  assert.ok(settings.includes(`\nCURRENT_PROJECT_VERSION = ${config.build}\n`), 'stale build number');
  const project = await read('apple/YouTube UI Cleaner/YouTube UI Cleaner.xcodeproj/project.pbxproj');
  const appPhases = project.slice(project.indexOf('"productType" = "com.apple.product-type.application"')).match(/"buildPhases" = \(\s*"([0-9A-F]+)"/)[1];
  assert.match(project, new RegExp(`"${appPhases}" = \\{[^}]*check-apple-version\\.sh[^}]*\\.\\./configuration\\.json`), 'app target must check its version first');
  const check = (version, build) => spawnSync('/bin/sh', ['scripts/check-apple-version.sh', 'apple/configuration.json'],
    { encoding: 'utf8', env: { ...process.env, MARKETING_VERSION: version, CURRENT_PROJECT_VERSION: build } });
  assert.equal(check(config.version, config.build).status, 0);
  const stale = check(config.version, String(Number(config.build) - 1));
  assert.equal(stale.status, 1);
  assert.match(stale.stdout, /^error: .*npm run build/);
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
