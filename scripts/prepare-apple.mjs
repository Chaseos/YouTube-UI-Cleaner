import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'apple/configuration.json')));
export function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
for (const key of ['bundleID', 'extensionBundleID', 'teamID', 'urlScheme', 'version', 'build', 'minimumMacOS', 'category']) {
  if (!/^[A-Za-z0-9.-]+$/.test(config[key] ?? '')) throw new Error(`Invalid Apple ${key}`);
}
if (!config.extensionBundleID.startsWith(`${config.bundleID}.`)) throw new Error('Extension ID must belong to the app');
if (config.tips.length !== new Set(config.tips.map(tip => tip.id)).size || config.tips.some(tip => !tip.id.startsWith(`${config.bundleID}.tip.`))) throw new Error('Invalid tip identifiers');
run(process.execPath, ['scripts/build.mjs', '--target=safari']);
const appleRoot = path.join(root, 'apple/YouTube UI Cleaner');
const generated = path.join(appleRoot, 'Configurations/Generated');
await mkdir(generated, { recursive: true });
const settings = {
  APPLE_APP_ID: config.bundleID, APPLE_EXTENSION_ID: config.extensionBundleID, APPLE_URL_SCHEME: config.urlScheme,
  DEVELOPMENT_TEAM: config.teamID, MARKETING_VERSION: config.version, CURRENT_PROJECT_VERSION: config.build,
  MACOSX_DEPLOYMENT_TARGET: config.minimumMacOS, INFOPLIST_KEY_LSApplicationCategoryType: config.category,
  ARCHS: 'arm64 x86_64', ONLY_ACTIVE_ARCH: 'NO'
};
await writeFile(path.join(generated, 'Apple.xcconfig'), '// Generated from apple/configuration.json; do not edit.\n' + Object.entries(settings).map(([key, value]) => `${key} = ${value}`).join('\n') + '\n');
const storekit = {
  identifier: 'EC3456A8-76B4-4AFE-AF74-445472B5F318', nonRenewingSubscriptions: [], subscriptionGroups: [],
  products: config.tips.map((tip, index) => ({ displayPrice: tip.price, familyShareable: false,
    internalID: `7EC85720-6D33-46C1-B271-00000000000${index + 1}`,
    localizations: [{ description: tip.description, displayName: tip.name, locale: 'en_US' }],
    productID: tip.id, referenceName: tip.name, type: 'Consumable' })),
  settings: { _applicationInternalID: config.appStoreID, _developerTeamID: config.teamID,
    _failTransactionsEnabled: false, _locale: 'en_US', _storefront: 'USA', _storeKitErrors: [] },
  version: { major: 3, minor: 0 }
};
const storekitPath = path.join(appleRoot, 'Configurations/TipProducts.storekit');
// Preserve Xcode simulation settings and transaction history; regenerate product metadata only.
let existing;
try { existing = JSON.parse(await readFile(storekitPath)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (existing) storekit.settings = { ...existing.settings, _applicationInternalID: config.appStoreID, _developerTeamID: config.teamID };
await writeFile(storekitPath, `${JSON.stringify(storekit, null, 2)}\n`);
run('swift', ['scripts/generate-apple-icons.swift', 'icon.png', path.join(appleRoot, 'YouTube UI Cleaner/Assets.xcassets/AppIcon.appiconset')]);
console.log('Prepared Mac Safari resources, identity, local products and icons.');
