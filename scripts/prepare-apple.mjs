import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'apple/configuration.json')));
export function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
if (!config.extensionBundleID.startsWith(`${config.bundleID}.`)) throw new Error('Extension ID must belong to the app');
if (config.tips.length !== new Set(config.tips.map(tip => tip.id)).size || config.tips.some(tip => !tip.id.startsWith(`${config.bundleID}.tip.`))) throw new Error('Invalid tip identifiers');
const appleRoot = path.join(root, 'apple/YouTube UI Cleaner');
const icons = path.join(appleRoot, 'YouTube UI Cleaner/Assets.xcassets/AppIcon.appiconset');
run('swift', ['scripts/generate-apple-icons.swift', 'apple/artwork/icon.png', icons]);
// The Safari build also writes the generated Xcode settings from apple/configuration.json.
run(process.execPath, ['scripts/build.mjs', '--target=safari']);
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
console.log('Prepared Mac Safari resources, identity, local products and icons.');
