import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareSafari, validateSafari } from './safari.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json')));
const config = JSON.parse(await readFile(path.join(root, 'apple/configuration.json')));
const runtimeFiles = ['_locales', 'content.js', 'youtube-locales.js', 'styles.css', 'popup.html', 'popup.js', 'icon.png', 'PRIVACYPOLICY.md'];
const browserAssets = ['kofi_symbol.svg', 'simple-video-speed-controller-icon.png'];
const selected = process.argv.find(arg => arg.startsWith('--target='))?.split('=')[1];
if (selected && !['chromium', 'firefox', 'safari'].includes(selected)) throw new Error(`Unknown target: ${selected}`);
for (const target of selected ? [selected] : ['chromium', 'firefox', 'safari']) {
  const directory = path.join(root, 'dist', target);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  for (const file of [...runtimeFiles, ...(target === 'safari' ? [] : browserAssets)]) {
    await cp(path.join(root, file), path.join(directory, file), { recursive: true, filter: file => path.basename(file) !== '.DS_Store' });
  }
  const outputManifest = structuredClone(manifest);
  if (target !== 'firefox') delete outputManifest.browser_specific_settings;
  await writeFile(path.join(directory, 'manifest.json'), `${JSON.stringify(outputManifest, null, 4)}\n`);
  if (target === 'safari') {
    await prepareSafari(root, directory, config);
    await validateSafari(directory);
  }
  const archive = path.join(root, 'dist', `youtube-ui-cleaner-${target}.zip`);
  await rm(archive, { force: true });
  const zipped = spawnSync('zip', ['-q', '-r', archive, '.'], { cwd: directory, encoding: 'utf8' });
  if (zipped.status !== 0) throw new Error(zipped.stderr || 'zip failed');
  console.log(`Built dist/${target} and ${path.basename(archive)}`);
}
