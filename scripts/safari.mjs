import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const safariForbidden = /ko-fi|kofi|chromewebstore|microsoftedge\.microsoft\.com\/addons|addons\.mozilla|addons\.opera|store\.whale|reviewClicked|hasInteractedWithApp|checkReviewPrompt|simpleVideoSpeedController|Simple Video Speed Controller|simple-video-speed-controller/i;
const removedKeys = ['supportWork', 'reviewPrompt', 'needSpeedControls', 'trySpeedController'];
const actionTitles = {
  en: ['Rate this app', 'Support options'], ar: ['قيّم هذا التطبيق', 'خيارات الدعم'],
  de: ['Diese App bewerten', 'Support-Optionen'], es: ['Valorar esta app', 'Opciones de apoyo'],
  es_419: ['Califica esta app', 'Opciones de apoyo'], fr: ['Noter cette app', 'Options de soutien'],
  hi: ['इस ऐप को रेट करें', 'सहायता के विकल्प'], id: ['Beri nilai aplikasi ini', 'Opsi dukungan'],
  it: ['Valuta questa app', 'Opzioni di supporto'], ja: ['このアプリを評価', 'サポートのオプション'],
  ko: ['이 앱 평가하기', '후원 옵션'], pl: ['Oceń tę aplikację', 'Opcje wsparcia'],
  pt_BR: ['Avaliar este app', 'Opções de apoio'], pt_PT: ['Avaliar esta app', 'Opções de apoio'],
  th: ['ให้คะแนนแอปนี้', 'ตัวเลือกการสนับสนุน'], tr: ['Bu uygulamayı değerlendir', 'Destek seçenekleri'],
  uk: ['Оцінити цей застосунок', 'Варіанти підтримки'], vi: ['Đánh giá ứng dụng này', 'Tùy chọn hỗ trợ'],
  zh_CN: ['为此 App 评分', '支持选项'], zh_TW: ['為此 App 評分', '支持選項'], zh_HK: ['為此 App 評分', '支援選項']
};
const extensionNames = {
  ar: 'منظف واجهة YouTube', de: 'UI-Reiniger für YouTube',
  es: 'Limpiador de interfaz para YouTube', es_419: 'Limpiador de interfaz para YouTube',
  fr: 'Nettoyeur d’interface pour YouTube', hi: 'YouTube के लिए UI क्लीनर',
  id: 'Pembersih UI untuk YouTube', it: 'Pulizia interfaccia per YouTube',
  ja: 'YouTube 用 UI クリーナー', ko: 'YouTube용 UI 클리너',
  pl: 'Czyściciel interfejsu dla YouTube', pt_BR: 'Limpador de interface para YouTube',
  pt_PT: 'Limpeza da interface para YouTube', th: 'ตัวล้าง UI สำหรับ YouTube',
  tr: 'YouTube için Arayüz Temizleyici', uk: 'Очищувач інтерфейсу для YouTube',
  vi: 'Dọn giao diện cho YouTube', zh_CN: 'YouTube 界面清理工具',
  zh_HK: 'YouTube 介面清理工具', zh_TW: 'YouTube 介面清理工具'
};
const extensionDescriptions = {
  ar: 'إضافة مستقلة لإخفاء Shorts والعروض والعناصر غير المرغوبة على YouTube.',
  de: 'Unabhängige Erweiterung: Shorts, Werbung und störende Elemente auf YouTube ausblenden.',
  en: 'Independent extension to hide Shorts, promotions, and unwanted clutter on YouTube.',
  es: 'Extensión independiente para ocultar Shorts, promociones y elementos no deseados en YouTube.',
  es_419: 'Extensión independiente para ocultar Shorts, promociones y elementos no deseados en YouTube.',
  fr: 'Extension indépendante pour masquer Shorts, promotions et éléments indésirables sur YouTube.',
  hi: 'YouTube पर Shorts, प्रचार और अनचाहे तत्व छिपाने के लिए स्वतंत्र एक्सटेंशन।',
  id: 'Ekstensi independen untuk menyembunyikan Shorts, promosi, dan elemen tak diinginkan di YouTube.',
  it: 'Estensione indipendente per nascondere Short, promozioni ed elementi indesiderati su YouTube.',
  ja: 'YouTube の Shorts、プロモーション、不要な表示を非表示にする独立した 拡張機能。',
  ko: 'YouTube에서 Shorts, 프로모션, 불필요한 요소를 숨기는 독립 확장 프로그램입니다.',
  pl: 'Niezależne rozszerzenie do ukrywania Shortsów, promocji i zbędnych elementów na YouTube.',
  pt_BR: 'Extensão independente para ocultar Shorts, promoções e elementos indesejados no YouTube.',
  pt_PT: 'Extensão independente para ocultar Shorts, promoções e elementos indesejados no YouTube.',
  th: 'ส่วนขยาย อิสระสำหรับซ่อน Shorts โปรโมชัน และสิ่งรบกวนที่ไม่ต้องการบน YouTube',
  tr: "YouTube'da Shorts, tanıtımlar ve gereksiz öğeleri gizleyen bağımsız uzantısı.",
  uk: 'Незалежне розширення для приховування Shorts, реклами й зайвих елементів на YouTube.',
  vi: 'Tiện ích độc lập để ẩn Shorts, quảng bá và các thành phần không mong muốn trên YouTube.',
  zh_CN: '独立的 扩展，可隐藏 YouTube 上的 Shorts、推广内容和不需要的界面元素。',
  zh_HK: '獨立 延伸功能，可隱藏 YouTube 上的 Shorts、推廣內容及不需要的介面元素。',
  zh_TW: '獨立的 延伸功能，可隱藏 YouTube 上的 Shorts、宣傳內容和不需要的介面元素。'
};

export function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Safari transformation missing: ${label}`);
  return source.replace(before, after);
}
export function removeRange(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Safari transformation boundaries missing: ${start}`);
  return source.slice(0, a) + source.slice(b);
}

export async function prepareSafari(root, target, config) {
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(config.name ?? '') || config.name.length > 30) {
    throw new Error('Invalid Apple app name: use at most 30 letters, digits, spaces or hyphens.');
  }
  let html = await readFile(path.join(root, 'popup.html'), 'utf8');
  html = replaceRequired(html, '<title data-i18n="extensionName">YouTube UI Cleaner</title>', `<title data-i18n="extensionName">${config.name}</title>`, 'popup title');
  html = replaceRequired(html, '<span data-i18n="extensionName">YouTube UI Cleaner</span>', `<span data-i18n="extensionName">${config.name}</span>`, 'popup heading');
  const privacy = replaceRequired(await readFile(path.join(root, 'PRIVACYPOLICY.md'), 'utf8'), '**YouTube UI Cleaner**', `**${config.name}**`, 'privacy product name');
  html = removeRange(html, '    .kofi-link {', '    .section {');
  html = removeRange(html, '    .review-card,', '  </style>');
  const reviewURL = /^\d+$/.test(config.appStoreID) ? `https://apps.apple.com/app/id${config.appStoreID}?action=write-review` : '#';
  const star = 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
  const heart = 'M12 21s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12z';
  const action = (id, href, key, title, svg, cls = '') => `<a id="${id}" class="apple-action ${cls}" href="${href}" aria-label="${title}" data-i18n-aria-label="${key}" title="${title}" data-i18n-title="${key}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${svg}"/></svg><span class="action-label" data-i18n="${key}">${title}</span></a>`;
  const oldAction = html.match(/<a id="kofi-link"[\s\S]*?<\/a>/)?.[0];
  if (!oldAction) throw new Error('Safari support markup missing');
  html = html.replace(oldAction, action('apple-rate', reviewURL, 'rateThisApp', 'Rate this app', star) + action('apple-support', `${config.urlScheme}://support`, 'supportOptions', 'Support options', heart, 'support'));
  html = removeRange(html, '    <div id="review-card"', '  <div class="status"');
  html = html.replace('  <div class="status"', '  </div>\n  <p class="apple-notice" id="apple-notice" role="status" aria-live="polite"></p>\n  <div class="status"');
  html = html.replace('</head>', '<link rel="stylesheet" href="safari.css">\n</head>');
  html = html.replace('<script src="popup.js"></script>', '<script src="popup.js"></script>\n  <script src="actions.js"></script>');
  let script = await readFile(path.join(root, 'popup.js'), 'utf8');
  script = removeRange(script, "const KOFI_URL =", '// Helper to get element');
  script = removeRange(script, '    const shouldMarkInteraction =', '    chrome.storage.sync.set(payload, () => {');
  script = replaceRequired(script, '    chrome.storage.sync.set(payload, () => {\n        if (shouldMarkInteraction) {\n            checkReviewPrompt();\n        }', '    chrome.storage.sync.set(updates, () => {\n        if (chrome.runtime.lastError) {\n            document.getElementById("apple-notice").textContent = getMessage("saveFailed");\n            return;\n        }', 'settings persistence');
  script = removeRange(script, 'function checkReviewPrompt()', '// Add event listeners');
  script = removeRange(script, "    const kofiLink =", '    // Tab Switching');
  script = replaceRequired(script, "chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_SETTINGS' });", "chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_SETTINGS' }, () => { void chrome.runtime.lastError; });", 'message error handling');
  let content = await readFile(path.join(root, 'content.js'), 'utf8');
  content += `\n// Safari preferences are local; refresh every open YouTube tab on change.\nchrome.storage.onChanged.addListener((changes, area) => {\n    if ((area === 'sync' || area === 'local') && keys.some(key => Object.hasOwn(changes, key))) {\n        loadSettingsAndApply();\n    }\n});\n`;
  await Promise.all([
    writeFile(path.join(target, 'PRIVACYPOLICY.md'), privacy),
    writeFile(path.join(target, 'popup.html'), html), writeFile(path.join(target, 'popup.js'), script),
    writeFile(path.join(target, 'content.js'), content),
    writeFile(path.join(target, 'safari.css'), await readFile(path.join(root, 'platforms/safari/popup.css'))),
    writeFile(path.join(target, 'actions.js'), await readFile(path.join(root, 'platforms/safari/actions.js')))
  ]);
  for (const locale of await readdir(path.join(target, '_locales'))) {
    const file = path.join(target, '_locales', locale, 'messages.json');
    const messages = JSON.parse(await readFile(file, 'utf8'));
    for (const key of removedKeys) delete messages[key];
    const name = locale === 'en' ? config.name : extensionNames[locale];
    if (!name || !extensionDescriptions[locale] || !actionTitles[locale]) {
      throw new Error(`Missing Apple localization: ${locale}`);
    }
    messages.extensionName.message = name;
    messages.extensionDescription.message = extensionDescriptions[locale];
    const [rate, support] = actionTitles[locale];
    messages.rateThisApp = { message: rate };
    messages.supportOptions = { message: support };
    messages.ratingUnavailable = { message: 'Rating is unavailable until this app has an App Store page.' };
    messages.saveFailed = { message: 'Settings could not be saved. Please reopen the popup and try again.' };
    for (const [key, entry] of Object.entries(messages)) {
      entry.description = `Localized message for ${key}.`;
    }
    await writeFile(file, `${JSON.stringify(messages, null, 2)}\n`);
  }
}

export async function validateSafari(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await validateSafari(file);
    else if (/\.(js|json|css|html|md|txt|svg)$/.test(entry.name)) {
      const source = await readFile(file, 'utf8');
      if (safariForbidden.test(source)) throw new Error(`Non-Apple content in ${file}`);
      if (entry.name === 'messages.json') {
        const messages = JSON.parse(source);
        if (typeof messages.extensionName?.message !== 'string' || !messages.extensionName.message.trim() || Array.from(messages.extensionName.message).length > 40) {
          throw new Error(`Invalid Safari extension name: ${file}`);
        }
        if (typeof messages.extensionDescription?.message !== 'string' || !messages.extensionDescription.message.trim() || Array.from(messages.extensionDescription.message).length > 112) {
          throw new Error(`Invalid Safari extension description: ${file}`);
        }
        for (const [key, value] of Object.entries(messages)) {
          if (typeof value.description !== 'string' || !value.description || value.description.length > 112) {
            throw new Error(`Invalid Safari message description: ${file} (${key})`);
          }
        }
      }
    }
  }
}

// Xcode takes the app version and build number from this file, so it is rewritten with every
// Safari package; a stale copy would upload a build number App Store Connect has already seen.
export async function writeAppleSettings(root, config) {
  for (const key of ['bundleID', 'extensionBundleID', 'teamID', 'urlScheme', 'version', 'build', 'minimumMacOS', 'category']) {
    if (!/^[A-Za-z0-9.-]+$/.test(config[key] ?? '')) throw new Error(`Invalid Apple ${key}`);
  }
  const generated = path.join(root, 'apple/YouTube UI Cleaner/Configurations/Generated');
  await mkdir(generated, { recursive: true });
  const settings = {
    APPLE_APP_NAME: config.name, APPLE_EXTENSION_NAME: `${config.name} Extension`,
    APPLE_APP_ID: config.bundleID, APPLE_EXTENSION_ID: config.extensionBundleID, APPLE_URL_SCHEME: config.urlScheme,
    DEVELOPMENT_TEAM: config.teamID, MARKETING_VERSION: config.version, CURRENT_PROJECT_VERSION: config.build,
    MACOSX_DEPLOYMENT_TARGET: config.minimumMacOS, INFOPLIST_KEY_LSApplicationCategoryType: config.category,
    ARCHS: 'arm64 x86_64', ONLY_ACTIVE_ARCH: 'NO'
  };
  await writeFile(path.join(generated, 'Apple.xcconfig'), '// Generated from apple/configuration.json; do not edit.\n' + Object.entries(settings).map(([key, value]) => `${key} = ${value}`).join('\n') + '\n');
}
