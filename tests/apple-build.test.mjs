import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { removeRange, replaceRequired, validateSafari } from '../scripts/safari.mjs';

const build = spawnSync(process.execPath, ['scripts/build.mjs'], { encoding: 'utf8' });
assert.equal(build.status, 0, build.stderr);
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const runtime = ['content.js','youtube-locales.js','styles.css','popup.html','popup.js','icon.png','PRIVACYPOLICY.md','kofi_symbol.svg','simple-video-speed-controller-icon.png'];

test('browser packages preserve the shared runtime and locale values', async () => {
  for (const target of ['chromium','firefox']) {
    for (const file of runtime) assert.deepEqual(await readFile(`dist/${target}/${file}`), await readFile(file), `${target}/${file}`);
    for (const locale of (await readdir('_locales', {withFileTypes:true})).filter(entry => entry.isDirectory()).map(entry => entry.name)) assert.equal(await read(`dist/${target}/_locales/${locale}/messages.json`), await read(`_locales/${locale}/messages.json`));
  }
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
    for (const [key, entry] of Object.entries(messages)) {
      assert.equal(typeof entry.description, 'string', `${locale}.${key} description`);
      assert.ok(entry.description.length > 0 && entry.description.length <= 112, `${locale}.${key} description length`);
      for (const [name, placeholder] of Object.entries(entry.placeholders || {})) {
        assert.equal(typeof placeholder.description, 'string', `${locale}.${key}.${name} description`);
        assert.ok(placeholder.description.length > 0 && placeholder.description.length <= 112, `${locale}.${key}.${name} description length`);
      }
    }
    for (const match of html.matchAll(/data-i18n(?:-title|-aria-label|-placeholder|-show|-hide)?="([^"]+)"/g)) assert.ok(messages[match[1]], `${locale}: ${match[1]}`);
  }
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
  assert.doesNotMatch(normal,/StoreKitConfigurationFileReference/);assert.match(normal,/<ArchiveAction buildConfiguration="Release"/);
  assert.match(local,/StoreKitConfigurationFileReference/);assert.doesNotMatch(local,/<ArchiveAction/);assert.match(local,/buildForArchiving="NO"/);
});
