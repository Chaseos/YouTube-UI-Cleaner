import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readCatalog(locale) {
    const fileUrl = new URL(`../_locales/${locale}/messages.json`, import.meta.url);
    return JSON.parse(await readFile(fileUrl, 'utf8'));
}

const supportedLocales = [
    'en', 'es', 'es_419', 'pt_PT', 'pt_BR', 'id', 'ja', 'de', 'fr', 'hi', 'vi',
    'tr', 'ko', 'ar', 'th', 'it', 'pl', 'uk', 'zh_CN', 'zh_TW', 'zh_HK'
];

test('keeps Spain and Latin American Spanish culturally distinct', async () => {
    const [spain, latinAmerica] = await Promise.all([
        readCatalog('es'),
        readCatalog('es_419')
    ]);

    assert.equal(spain.liveStreams.message, 'Emisiones en directo');
    assert.equal(latinAmerica.liveStreams.message, 'Transmisiones en vivo');
    assert.equal(spain.enterFilterName.message, 'Introduce el nombre del filtro');
    assert.equal(latinAmerica.enterFilterName.message, 'Ingresa el nombre del filtro');
});

test('uses concrete names for the grouped content controls', async () => {
    const english = await readCatalog('en');

    assert.equal(english.hideGroupedVideos.message, 'Hide Mixes, Podcasts & Playlists');
    assert.equal(english.feedPills.message, 'Home Categories');
    assert.equal(english.dismissibleSections.message, 'Extra Home Sections');
    assert.equal(english.featuredServiceVideos.message, 'Service Offer Videos');
});

test('does not add an unsupported free-trial promise', async () => {
    const [hindi, japanese, thai] = await Promise.all([
        readCatalog('hi'),
        readCatalog('ja'),
        readCatalog('th')
    ]);

    assert.doesNotMatch(hindi.featuredServiceDescription.message, /मुफ़्त/);
    assert.doesNotMatch(japanese.featuredServiceDescription.message, /無料/);
    assert.doesNotMatch(thai.featuredServiceDescription.message, /ฟรี/);
});

test('preserves functional meaning in previously weak locale strings', async () => {
    const [arabic, french, vietnamese] = await Promise.all([
        readCatalog('ar'),
        readCatalog('fr'),
        readCatalog('vi')
    ]);

    assert.match(arabic.keywordHintDrafted.message, /درافت/);
    assert.equal(french.keywordHintDefeats.message, 'Bat');
    assert.equal(vietnamese.liveStreams.message, 'Video phát trực tiếp');
    assert.equal(vietnamese.settingsSaved.message, 'Đã lưu cài đặt!');
});

test('keeps spoiler keyword suggestions semantically distinct in every locale', async () => {
    for (const locale of supportedLocales) {
        const catalog = await readCatalog(locale);
        const hints = Object.entries(catalog)
            .filter(([key]) => key.startsWith('keywordHint'))
            .map(([, entry]) => entry.message.toLocaleLowerCase(locale.replace('_', '-')));

        assert.equal(new Set(hints).size, hints.length, `${locale} has duplicate spoiler keyword suggestions`);
    }
});

test('uses verified product terminology in context-sensitive controls', async () => {
    const [arabic, french, polish, vietnamese, traditionalChinese] = await Promise.all([
        readCatalog('ar'),
        readCatalog('fr'),
        readCatalog('pl'),
        readCatalog('vi'),
        readCatalog('zh_TW')
    ]);

    assert.equal(arabic.mixes.message, 'ميكسات YouTube');
    assert.equal(french.paidPromotionBanners.message, 'Bannières « Promotion payante »');
    assert.match(polish.needSpeedControls.message, /prędkości odtwarzania/);
    assert.equal(vietnamese.feedPills.message, 'Danh mục trên Trang chủ');
    assert.equal(traditionalChinese.hideMembersOnlyVideos.message, '隱藏會員專屬影片');
});
