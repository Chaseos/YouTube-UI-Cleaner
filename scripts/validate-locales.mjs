import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localesRoot = path.join(projectRoot, '_locales');
const expectedLocales = ['en', 'es', 'es_419', 'pt_PT', 'pt_BR', 'id', 'ja', 'de', 'fr', 'hi', 'vi', 'tr', 'ko', 'ar', 'th', 'it', 'pl', 'uk', 'zh_CN', 'zh_TW', 'zh_HK'];
const allowedUnchangedKeys = new Set([
    'extensionName', 'general', 'edit', 'mixes', 'podcasts', 'playlists',
    'keywordHintSpoiler', 'keywordHintScore', 'keywordHintHighlights', 'keywordHintFinale'
]);

function placeholderNames(entry) {
    return Object.keys(entry.placeholders || {}).sort();
}

function referencedPlaceholders(message) {
    return [...message.matchAll(/\$([A-Z0-9_]+)\$/gi)].map(match => match[1].toLowerCase()).sort();
}

const localeDirectories = (await readdir(localesRoot, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

const expectedSorted = [...expectedLocales].sort();
if (JSON.stringify(localeDirectories) !== JSON.stringify(expectedSorted)) {
    throw new Error(`Locale directories differ. Expected ${expectedSorted.join(', ')}; received ${localeDirectories.join(', ')}`);
}

const catalogs = {};
for (const locale of expectedLocales) {
    const filePath = path.join(localesRoot, locale, 'messages.json');
    const catalog = JSON.parse(await readFile(filePath, 'utf8'));
    catalogs[locale] = catalog;

    for (const [key, entry] of Object.entries(catalog)) {
        if (!entry || typeof entry.message !== 'string' || !entry.message.trim()) {
            throw new Error(`${locale}.${key} must have a non-empty message.`);
        }
        const declared = placeholderNames(entry);
        const referenced = referencedPlaceholders(entry.message);
        if (JSON.stringify(declared) !== JSON.stringify(referenced)) {
            throw new Error(`${locale}.${key} placeholder mismatch: declared ${declared}; referenced ${referenced}`);
        }
    }
}

const sourceKeys = Object.keys(catalogs.en).sort();
for (const locale of expectedLocales.slice(1)) {
    const keys = Object.keys(catalogs[locale]).sort();
    if (JSON.stringify(keys) !== JSON.stringify(sourceKeys)) {
        const missing = sourceKeys.filter(key => !keys.includes(key));
        const extra = keys.filter(key => !sourceKeys.includes(key));
        throw new Error(`${locale} key mismatch. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`);
    }

    for (const key of sourceKeys) {
        const sourcePlaceholders = placeholderNames(catalogs.en[key]);
        const translatedPlaceholders = placeholderNames(catalogs[locale][key]);
        if (JSON.stringify(sourcePlaceholders) !== JSON.stringify(translatedPlaceholders)) {
            throw new Error(`${locale}.${key} does not match the English placeholder schema.`);
        }
        if (catalogs[locale][key].message === catalogs.en[key].message && !allowedUnchangedKeys.has(key)) {
            throw new Error(`${locale}.${key} is unchanged from English and is not allowlisted.`);
        }
    }
}

for (const manifestKey of ['extensionName', 'extensionDescription']) {
    for (const locale of expectedLocales) {
        if (!catalogs[locale][manifestKey]) throw new Error(`${locale} is missing manifest message ${manifestKey}.`);
    }
}

const popupHtml = await readFile(path.join(projectRoot, 'popup.html'), 'utf8');
const popupScript = await readFile(path.join(projectRoot, 'popup.js'), 'utf8');
const referencedUiKeys = new Set([
    ...[...popupHtml.matchAll(/data-i18n(?:-[a-z-]+)?="([A-Za-z0-9_]+)"/g)].map(match => match[1]),
    ...[...popupScript.matchAll(/getMessage\('([A-Za-z0-9_]+)'/g)].map(match => match[1])
]);
for (const key of referencedUiKeys) {
    if (!catalogs.en[key]) throw new Error(`Popup references unknown localization key ${key}.`);
}

console.log(`Validated ${expectedLocales.length} locale catalogs with ${sourceKeys.length} messages each.`);
