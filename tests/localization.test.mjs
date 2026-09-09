import test from 'node:test';
import assert from 'node:assert/strict';

await import('../youtube-locales.js');
const locales = globalThis.YouTubeUICleanerLocales;

test('normalizes supported locale aliases and falls back safely', () => {
    assert.equal(locales.normalizeLocale('es-419'), 'es_419');
    assert.equal(locales.normalizeLocale('pt-BR'), 'pt_BR');
    assert.equal(locales.normalizeLocale('pt-PT'), 'pt_PT');
    assert.equal(locales.normalizeLocale('pt'), 'pt_PT');
    assert.equal(locales.normalizeLocale('zh-CN'), 'zh_CN');
    assert.equal(locales.normalizeLocale('zh-Hans-SG'), 'zh_CN');
    assert.equal(locales.normalizeLocale('zh'), 'zh_CN');
    assert.equal(locales.normalizeLocale('zh-Hant-HK'), 'zh_HK');
    assert.equal(locales.normalizeLocale('zh-HK'), 'zh_HK');
    assert.equal(locales.normalizeLocale('zh-TW'), 'zh_TW');
    assert.equal(locales.normalizeLocale('zh-Hant'), 'zh_TW');
    assert.equal(locales.normalizeLocale('ar-AE'), 'ar');
    assert.equal(locales.normalizeLocale('th-TH'), 'th');
    assert.equal(locales.normalizeLocale('it-IT'), 'it');
    assert.equal(locales.normalizeLocale('pl-PL'), 'pl');
    assert.equal(locales.normalizeLocale('uk-UA'), 'uk');
    assert.equal(locales.normalizeLocale('ru'), 'en');
});

test('keeps Portuguese variants distinct', () => {
    assert.equal(locales.getTerms('pt-BR').watchLaterLabel, 'Assistir mais tarde');
    assert.equal(locales.getTerms('pt-PT').watchLaterLabel, 'Ver mais tarde');
});

test('preserves Playables names and separates the documented Spanish variants', () => {
    const officialNames = new Map([
        ['en', 'playables'],
        ['es', 'jugables'],
        ['es-419', 'sala de juegos'],
        ['pt-PT', 'sala de jogos'],
        ['pt-BR', 'sala de jogos'],
        ['id', 'ruang game'],
        ['ja', 'ゲームルーム'],
        ['de', 'playables'],
        ['fr', 'jeux intégrés'],
        ['hi', 'playables'],
        ['vi', 'chơi game'],
        ['tr', 'hazır oyunlar'],
        ['ko', '게임 룸'],
        ['ar', 'هيّا نلعب'],
        ['th', 'ฟีเจอร์เล่นเกม'],
        ['it', 'sala giochi'],
        ['pl', 'pokój gier'],
        ['uk', 'ігрова кімната'],
        ['zh-CN', '游戏大本营'],
        ['zh-TW', '遊戲角落'],
        ['zh-HK', 'playables']
    ]);

    for (const [locale, productName] of officialNames) {
        assert.equal(locales.getTerms(locale).playables[0], productName);
    }
});

test('matches localized YouTube actions but rejects unrelated text', () => {
    assert.equal(locales.matchesAny('Guardar en Ver más tarde', locales.getTerms('es').watchLaterActions), true);
    assert.equal(locales.matchesAny('儲存至「稍後觀看」', locales.getTerms('zh-TW').watchLaterActions), true);
    assert.equal(locales.matchesAny('保存到“稍后观看”', locales.getTerms('zh-CN').watchLaterActions), true);
    assert.equal(locales.matchesAny('儲存至「稍後觀看」', locales.getTerms('zh-HK').watchLaterActions), true);
    assert.equal(locales.matchesAny('İlgilenmiyorum', locales.getTerms('tr').notInterestedActions), true);
    assert.equal(locales.matchesAny('興味がない', locales.getTerms('ja').notInterestedActions), true);
    assert.equal(locales.matchesAny('لا يهمّني', locales.getTerms('ar').notInterestedActions), true);
    assert.equal(locales.matchesAny('الحفظ في قائمة المشاهدة لاحقًا', locales.getTerms('ar').watchLaterActions), true);
    assert.equal(locales.matchesAny('ดูภายหลัง', locales.getTerms('th').watchLaterActions), true);
    assert.equal(locales.matchesAny('ไม่สนใจ', locales.getTerms('th').notInterestedActions), true);
    assert.equal(locales.matchesAny('Salva in Guarda più tardi', locales.getTerms('it').watchLaterActions), true);
    assert.equal(locales.matchesAny('Non mi interessa', locales.getTerms('it').notInterestedActions), true);
    assert.equal(locales.matchesAny('Zapisz na liście Do obejrzenia', locales.getTerms('pl').watchLaterActions), true);
    assert.equal(locales.matchesAny('Nie interesuje mnie to', locales.getTerms('pl').notInterestedActions), true);
    assert.equal(locales.matchesAny('Зберегти в список «Переглянути пізніше»', locales.getTerms('uk').watchLaterActions), true);
    assert.equal(locales.matchesAny('Не цікавить', locales.getTerms('uk').notInterestedActions), true);
    assert.equal(locales.matchesAny('Compartir', locales.getTerms('es').watchLaterActions), false);
    assert.equal(locales.matchesAny('No recomendar este canal', locales.getTerms('es').notInterestedActions), false);
});

test('rejects unrelated localized menu actions in every new locale', () => {
    const unrelatedActions = new Map([
        ['ar', 'مشاركة'],
        ['th', 'แชร์'],
        ['it', 'Condividi'],
        ['pl', 'Udostępnij'],
        ['uk', 'Поділитися']
    ]);

    for (const [locale, action] of unrelatedActions) {
        const terms = locales.getTerms(locale);
        assert.equal(locales.matchesAny(action, terms.watchLaterActions, 'contains'), false);
        assert.equal(locales.matchesAny(action, terms.notInterestedActions, 'contains'), false);
    }
});

test('supports prefix and contains matching explicitly', () => {
    assert.equal(locales.matchesAny('Premieres tomorrow', locales.getTerms('en').premierePrefixes, 'prefix'), true);
    assert.equal(locales.matchesAny('Save to Watch Later', ['watch later'], 'contains'), true);
    assert.equal(locales.matchesAny('Watch history', ['watch later'], 'contains'), false);
});

test('every supported page locale has complete and distinct terminology', () => {
    const expectedLocales = ['en', 'es', 'es_419', 'pt_PT', 'pt_BR', 'id', 'ja', 'de', 'fr', 'hi', 'vi', 'tr', 'ko', 'ar', 'th', 'it', 'pl', 'uk', 'zh_CN', 'zh_TW', 'zh_HK'];
    const arrayKeys = [
        'playables', 'mix', 'podcast', 'viewFullPlaylist', 'playlist', 'tryNow', 'membersOnly',
        'upcoming', 'premierePrefixes', 'scheduledPrefixes', 'notifyMe', 'downloads',
        'watchLaterActions', 'notInterestedActions'
    ];

    assert.deepEqual(Object.keys(locales.localeTerms), expectedLocales);
    for (const locale of expectedLocales) {
        const terms = locales.getTerms(locale);
        for (const key of arrayKeys) {
            assert.ok(Array.isArray(terms[key]) && terms[key].length > 0, `${locale}.${key} must contain aliases`);
            assert.equal(locales.matchesAny(terms[key][0], terms[key]), true, `${locale}.${key} must match its canonical term`);
        }
        assert.ok(terms.watchLaterLabel, `${locale}.watchLaterLabel must be present`);
        assert.ok(terms.notInterestedLabel, `${locale}.notInterestedLabel must be present`);
        assert.equal(locales.matchesAny('share this video', terms.watchLaterActions, 'contains'), false);
        assert.equal(locales.matchesAny('share this video', terms.notInterestedActions, 'contains'), false);
    }
});


test('uses independent audit evidence for documented terms in each supported locale', async () => {
    const { readFile } = await import('node:fs/promises');
    const audit = JSON.parse(await readFile(new URL('../docs/localization-audit/terminology-matrix.json', import.meta.url), 'utf8'));
    for (const row of audit.rows) {
        if (!['documented-label', 'documented-term'].includes(row.evidence_status)) continue;
        const terms = locales.getTerms(row.locale);
        const aliases = terms[row.group];
        assert.equal(locales.matchesAny(row.evidence_term, Array.isArray(aliases) ? aliases : [aliases],
            row.matching_mode === 'display' ? 'exact' : row.matching_mode), true, `${row.locale}.${row.group}: ${row.evidence_term}`);
    }
});

test('keeps regional page dictionaries distinct and uses the page language', () => {
    assert.equal(locales.normalizeLocale('es_419'), 'es_419');
    assert.equal(locales.normalizeLocale('es-419-u-nu-latn'), 'es_419');
    assert.equal(locales.normalizeLocale('es-ES'), 'es');
    assert.notEqual(locales.getTerms('es'), locales.getTerms('es-419'));
    assert.equal(locales.getTerms('pt-PT').notInterestedLabel, 'Sem interesse');
    assert.equal(locales.getTerms('pt-BR').notInterestedLabel, 'Não tenho interesse');
    const page = { lang: 'ja' };
    assert.equal(locales.resolvePageLocale(page), 'ja');
    page.lang = 'es-419';
    assert.equal(locales.resolvePageLocale(page), 'es_419');
    page.lang = '';
    assert.equal(locales.resolvePageLocale(page), 'en');
});

test('preserves prefix boundaries and permits no-space dates without word suffixes', () => {
    const terms = locales.getTerms('en');
    assert.equal(locales.matchesAny('Premieres tomorrow', terms.premierePrefixes, 'prefix'), true);
    assert.equal(locales.matchesAny('Premiere tomorrow', terms.premierePrefixes, 'prefix'), true);
    assert.equal(locales.matchesAny('Premiered yesterday', terms.premierePrefixes, 'prefix'), false);
    assert.equal(locales.matchesAny('Premieresque', terms.premierePrefixes, 'prefix'), false);
    assert.equal(locales.matchesAny('Scheduled for tomorrow', terms.scheduledPrefixes, 'prefix'), true);
    assert.equal(locales.matchesAny('プレミア公開2026/09/10', locales.getTerms('ja').premierePrefixes, 'prefix'), true);
    assert.equal(locales.matchesAny('プレミア公開済み', locales.getTerms('ja').premierePrefixes, 'prefix'), false);
    assert.equal(locales.matchesAny('anything', [''], 'prefix'), false);
});

test('normalizes observed typography and bidi controls without losing accents', () => {
    assert.equal(locales.matchesAny('M’avertir', locales.getTerms('fr').notifyMe), true);
    assert.equal(locales.matchesAny('\u2067إرسال إشعار إليّ\u2069', locales.getTerms('ar').notifyMe), true);
    assert.equal(locales.matchesAny('  ＭＩＸ  ', locales.getTerms('en').mix), true);
    assert.equal(locales.matchesAny('Premieres\u00a0tomorrow', locales.getTerms('en').premierePrefixes, 'prefix'), true);
    assert.notEqual(locales.normalizeText('pódcast'), locales.normalizeText('podcast'));
    assert.equal(locales.matchesAny('スマート一時保存', locales.getTerms('ja').downloads, 'contains'), true);
});


test('recognizes Smart Downloads brands that do not contain the destination name', () => {
    // Localized YouTube Help article 12002587, retrieved during the audit.
    for (const [locale, label] of [
        ['ja', 'スマート一時保存'], ['vi', 'Tải xuống thông minh'], ['ko', '스마트 오프라인 저장'],
        ['ar', 'التنزيل الذكي'], ['pl', 'Inteligentne pobieranie'], ['zh-CN', '智能下载'], ['zh-TW', '智慧下載']
    ]) {
        assert.equal(locales.matchesAny(label, locales.getTerms(locale).downloads, 'contains'), true, locale);
    }
});
