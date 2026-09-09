# YouTube filtering terminology audit

Audited **2026-09-09** against the pre-fix working tree (extension manifest version 2.14). This report and its matrix preserve the research baseline. The subsequent implementation is described in [implementation status](implementation.md); references to “current” behavior below mean behavior at audit time.

The app already localizes most text-based detection through `youtube-locales.js`. The problem is incomplete or unverified YouTube terminology, plus a few matching behaviors that translations cannot fix. App translations and YouTube detection terms are separate: 21 app catalogs exist, but only 20 page dictionaries exist because `es_419` resolves to `es`.

- [Readable terminology matrix](terminology-matrix.md): official terms, links, evidence status, and current mismatches.
- [Complete matrix data](terminology-matrix.json): **378 rows** = 21 locales × 18 groups. Includes every existing alias, matching mode, UI context, structural fallback, evidence term, source, and match result.

## Findings and correction list

### 1. Separate Latin American Spanish page terminology

`youtube-locales.js:187` reduces all Spanish variants to `es`; `tests/localization.test.mjs:8` explicitly expects that behavior. Google distinguishes **Jugables** in Spain from **Sala de juegos** in Latin America. The latter fails the current shelf matcher. The regional documentation also distinguishes **Ver lista de reproducción completa** from **Ver playlist completa**, and the playlist noun itself. [Spain Playables](https://support.google.com/youtube/answer/14328604?hl=es), [Latin American Playables](https://support.google.com/youtube/answer/14328604?hl=es-419), [Latin American playlist link](https://support.google.com/youtube/answer/3127309?hl=es-419).

**Proposed correction:** add an explicit `es_419` page dictionary, normalize `es-419` and `es_419` to it before the base-language fallback, and replace the test that enshrines the collapse. Do not silently map every country-specific Spanish locale to Latin America without checking YouTube's emitted locale codes. Preserve existing Portuguese and Chinese branches.

Spain's documented podcast term is **pódcast**, while the current exact matcher only has `podcast`. Treat adding the accented term as a source-backed candidate; verify the actual badge before claiming complete coverage. [Podcast documentation](https://support.google.com/youtube/answer/12751636?hl=es).

### 2. Add the missing documented reminder labels

`content.js:240` uses exact matching for reminder buttons. These official control names are absent from their current locale's `notifyMe` aliases:

| Locale | Documented label |
|---|---|
| es | [Recibir aviso](https://support.google.com/youtube/answer/9879686?hl=es) |
| ja | [通知を受け取る](https://support.google.com/youtube/answer/9879686?hl=ja) |
| de | [Benachrichtigung erhalten](https://support.google.com/youtube/answer/9879686?hl=de) |
| fr | [M'avertir](https://support.google.com/youtube/answer/9879686?hl=fr) |
| vi | [Thông báo cho tôi](https://support.google.com/youtube/answer/9879686?hl=vi) |
| tr | [Beni bilgilendir](https://support.google.com/youtube/answer/9879686?hl=tr) |
| ar | [إرسال إشعار إليّ](https://support.google.com/youtube/answer/9879686?hl=ar) |
| th | [แจ้งเตือนให้ฉันทราบ](https://support.google.com/youtube/answer/9879686?hl=th) |

**Proposed correction:** add these as documented aliases, retaining existing aliases until contrary UI evidence exists. These pages describe live/Premiere reminder controls; live inspection is still needed to confirm feed placement and renderer coverage. This is a text-fallback gap, not proof that all upcoming filtering fails: structural `UPCOMING` indicators already work without translations.

### 3. Correct European Portuguese action terminology

The European Portuguese recommendation instructions name **Sem interesse**; another official article uses **Não me interessa**. The current table instead contains only `não tenho interesse`, which these sources do not establish for Portugal. Consequently the documented action does not match, and the injected label is questionable. [Recommendation instructions](https://support.google.com/youtube/answer/6342839?hl=pt), [Playables instructions](https://support.google.com/youtube/answer/14328604?hl=pt).

**Proposed correction:** include the documented European Portuguese variants in action matching; use the observed desktop label for the injected button once captured. Do not copy the Brazilian Portuguese label into the European table. `Ver mais tarde` is already documented for Portugal, distinct from Brazil's `Assistir mais tarde`. [Portugal Watch later](https://support.google.com/youtube/answer/56101?hl=pt&co=GENIE.Platform%3DDesktop), [Brazil Watch later](https://support.google.com/youtube/answer/56101?hl=pt-BR&co=GENIE.Platform%3DDesktop).

### 4. Review membership-tag variants against video badges

The membership Help article explicitly names exclusive-content tags, including posts. These tag strings fail current exact matching:

| Locale | Documented tag |
|---|---|
| pt_PT | [Apenas apoiantes](https://support.google.com/youtube/answer/14917424?hl=pt) |
| pt_BR | [Só para membros](https://support.google.com/youtube/answer/14917424?hl=pt-BR) |
| hi | [पैसे चुकाकर बने सदस्यों के लिए उपलब्ध](https://support.google.com/youtube/answer/14917424?hl=hi) |
| tr | [Üyelere özel](https://support.google.com/youtube/answer/14917424?hl=tr) |
| ar | [الأعضاء فقط](https://support.google.com/youtube/answer/14917424?hl=ar) |
| th | [สมาชิกเท่านั้น](https://support.google.com/youtube/answer/14917424?hl=th) |
| zh_TW | [頻道會員專屬](https://support.google.com/youtube/answer/14917424?hl=zh-TW) |

**Proposed correction:** capture the corresponding video badge before treating these as canonical video labels. They are useful documented alias candidates, not proven replacements for existing video aliases. Retain the existing structural members-only renderer/classes/overlay/icon checks (`content.js:212`), which are independent of language.

For Hong Kong, the retrieved Help pages returned generic Traditional Chinese, including the same membership term and Playables name as Taiwan. **Do not replace Hong Kong's dictionary based on those responses.** The matrix explicitly marks those rows as regional fallback evidence.

### 5. Fill playlist-link gaps; distinguish product terms from badge labels

Missing documented full-playlist link aliases include:

| Locale | Documented link |
|---|---|
| es_419 | [Ver playlist completa](https://support.google.com/youtube/answer/3127309?hl=es-419) |
| ja | [再生リストの全体を見る](https://support.google.com/youtube/answer/3127309?hl=ja) |
| de | [Komplette Playlist ansehen](https://support.google.com/youtube/answer/3127309?hl=de) |
| ar | [عرض قائمة التشغيل بالكامل](https://support.google.com/youtube/answer/3127309?hl=ar) |
| th | [ดูทั้งเพลย์ลิสต์](https://support.google.com/youtube/answer/3127309?hl=th) |

The official Mix articles use Japanese **ミックスリスト** and Arabic **ميكس**, neither of which matches the current exact badge dictionary. A product article title does not prove that the short badge uses the full product name. [Japanese Mix](https://support.google.com/youtube/answer/9011078?hl=ja), [Arabic Mix](https://support.google.com/youtube/answer/9011078?hl=ar).

**Proposed correction:** add documented link aliases; capture Mix badge wording before replacing its aliases. Reuse the existing renderer/thumbnail/overlay/URL checks. Maintain Mix → Podcast → Playlist classification priority and the `/feed/playlists` library exemption. The podcast `/podcast/` fallback currently exists only in CSS for `ytd-rich-item-renderer` (`styles.css:104`); consider sharing that detection with the other supported card renderers after validating the URL structure.

### 6. Downloads terminology protects a section from hiding

`content.js:275` identifies downloads sections, but **does not hide downloads**. `styles.css:123` excludes `.is-downloads-section` from the general section filter. A missed translation can therefore cause downloaded content to disappear when “hide sections” is enabled.

Arabic Help names the destination **المحتوى الذي تم تنزيله**, which the current aliases do not match. [Smart Downloads documentation](https://support.google.com/youtube/answer/12002587?hl=ar&co=GENIE.Platform%3DDesktop).

**Proposed correction:** add that destination alias and verify the actual heading/banner. Check Smart Downloads branding separately: Japanese **スマート一時保存** does not contain the existing destination aliases, even though **オフライン** itself is documented and already supported. A banner containing only the Smart Downloads brand is a coverage candidate; no such live banner was captured here. [Japanese Smart Downloads](https://support.google.com/youtube/answer/12002587?hl=ja&co=GENIE.Platform%3DDesktop).

### 7. Tighten action and prefix matching before expanding aliases

Two problems were reproduced with the production matching helper:

- **Save versus remove:** `matchesAny('Remove from Watch later', watchLaterActions, 'contains')` returns `true`. The removal action is officially documented. In a card menu exposing that option, `performMenuAction` can click it when the user intends to save (`content.js:477`). [Watch later add/remove instructions](https://support.google.com/youtube/answer/56101?hl=en&co=GENIE.Platform%3DDesktop).
- **Upcoming versus completed:** `matchesAny('Premiered yesterday', premierePrefixes, 'prefix')` returns `true`. Normalization trims the trailing space from `premiere `, so it becomes a prefix of `Premiered`. The input is a synthetic regression case, not a captured YouTube badge. The affected caller checks badge aria-labels, so actual impact depends on markup.

**Proposed correction:** extract and compare the primary native menu action label, using explicit full save/action aliases or a verified semantic action identifier. Never broaden matching to all languages or rely on a bare destination substring. A remove action should produce no save click or success feedback. For dynamic premiere/schedule text, use verified locale-specific templates that preserve word boundaries and distinguish completed content; do not apply a universal space rule to scripts without spaces.

The premiere fallback currently checks only `aria-label`, not visible premiere text (`content.js:234`). Scheduled matching requires the entire metadata row to start with the stored phrase (`content.js:237`). Both need real before/after fixtures, including dates preceding the status. No exact localized dynamic templates were established in this audit.

NFKC and whitespace normalization do not equate straight/curly apostrophes, strip bidi marks, remove accents, or implement language-specific morphology. A straight-versus-curly French apostrophe mismatch was reproduced. Use explicit observed variants or narrowly justified normalization, rather than removing meaningful accents globally. Browser-default `toLocaleLowerCase()` is also worth replacing with deterministic normalization if testing establishes a host-locale difference; the existing dotted Turkish I case is covered by tests.

### 8. Reuse structural menu and Shorts signals

`content.js:331` includes English-only `Action menu` and `More actions` aria-label fallbacks, alongside several structural selectors. On one live English home card, the **More actions** button was nested beneath `.ytLockupMetadataViewModelMenuButton`; the existing structural selector already covers that card. Its native menu exposed **Save to Watch later** and **Not interested**. No menu action was invoked. [Live surface](https://www.youtube.com/).

**Proposed correction:** retain and verify these structural menu selectors before adding 21 translated accessibility names. Localize aria-only fallback paths only from actual button captures. Shorts has hardcoded case-sensitive text checks in `content.js:94`, `content.js:103`, and `styles.css:13`. Reuse `/shorts/` destinations for sidebar detection and existing Shorts attributes/child renderers for shelves; do not assume a translated prose reference is the sidebar label. Constrain destination matching to the relevant link and renderer.

### 9. Recompute derived tags when content changes

The page locale is read from `document.documentElement.lang`, independently of the extension/browser language. A `lang` observer reruns tagging and updates injected labels (`content.js:657`). That is the right source of language, but previously tagged Playables, Mix/Podcast/Playlist, Downloads, Shorts, and Live elements can be excluded from subsequent tagging or never have their classes removed.

A focused execution of the production `tagElements()` reproduced a Playables shelf keeping its tag after changing from a Spanish Playables heading to ordinary English content. This is a reused-element/content-change bug that a language switch can expose, not evidence that translating the same valid shelf should remove its tag.

**Proposed correction:** recompute these derived classifications on relevant reused elements and clear stale classes when evidence disappears, using the same toggling approach already used for members-only, featured-service, upcoming, and custom keyword tags. Avoid treating language change alone as proof a category changed.

## Matcher inventory and unaffected behavior

The matrix covers all 14 array groups plus two injected labels, Shorts, and menu discovery. Its per-row context and fallback columns identify exactly where each term is used.

Language-independent mechanisms already cover paid-promotion overlays, sponsored ad renderers/badges, live indicators, feed pills, structural playlist cases, and individual `/shorts/` video links. They can still break when YouTube changes markup, but they do not require translations of words such as “Sponsored” or “Live.” General section hiding depends on the localized Downloads exemption and Shorts classification discussed above.

User-entered custom keywords intentionally match literal lowercased content. Do not translate, expand, or migrate them. No settings/storage schema or extension permission changes are needed for the proposed corrections.

## Evidence method and limits

- Compared nine official Help article families across the 21 requested locale codes, then checked the full-playlist link article and European Portuguese sources separately. Only Google/YouTube documentation and the rendered YouTube UI support the terminology conclusions.
- Every matrix row carries an evidence status. A documented term is not automatically an observed badge; a documented label is stronger evidence but can still differ across desktop/mobile, experiments, and account states. Some Help pages explicitly disclose AI-translated content.
- Initial `hl=pt-PT` HTTP responses used Brazilian wording; they were excluded from Portugal's findings. European Portuguese evidence was obtained using `hl=pt`, with its wording checked. Do not rely on a URL parameter or HTML language tag alone to establish the regional dialect.
- `zh-HK` requests returned generic `zh-Hant` content. All corresponding term evidence is marked **F**, not Hong Kong UI verification. Mainland and Taiwan evidence remains separate.
- A live browser visit with `?hl=es-419` landed on English YouTube with `html.lang=en`. The audit did not change the user's account language. Only English menu labels were confirmed in the rendered UI; no personalized video titles or account details were saved in these artifacts.
- Google Help later rate-limited direct retrieval. Web retrieval supplied most full-playlist link terms; Italian, Vietnamese, and Taiwan exact full-playlist link wording remains **U** after failed/inapplicable retrievals. The JSON retains existing aliases for comparison without endorsing them.
- Exact trial badges, upcoming badges, premiere/schedule templates, and localized Shorts/menu accessibility labels remain **U** across the relevant locales. Generic marketing copy and machine translations were not substituted for missing evidence.
- Existing alternate aliases are retained verbatim in the JSON. An evidence match validates only the named evidence string, not every alias in that row. `current_match` is a string-helper result, not an end-to-end guarantee that the DOM selector reaches the UI.

## Validation performed

- `node --test tests/localization.test.mjs tests/message-localization.test.mjs`: **13 passed**.
- `node scripts/validate-locales.mjs`: **21 catalogs, 67 messages each validated**.
- Temporary Node VM checks executed the production locale helper and `tagElements()`: page-language precedence and language changes passed; members-only and UPCOMING structural detection worked with no visible labels; a removed UPCOMING signal cleared its tag.
- The same checks reproduced five source-backed terminology misses, save/remove substring overlap, completed-tense prefix overlap, straight/curly apostrophe mismatch, and the reused Playables shelf's stale tag. These are audit observations, not tests newly added to the project.
- Live DOM inspection confirmed one existing structural menu-button fallback and the two English native action labels. Full browser automation across 21 languages, Safari/Firefox runs, and an application build were not performed for this documentation-only change.

### Regression cases for the implementation phase

| Scenario | Required result |
|---|---|
| `es-419` / `es_419` page with Sala de juegos | Resolve to the distinct dictionary; classify shelf as Playables |
| Spain and Latin America playlist links | Match each sourced full link; preserve playlist-library exemption |
| Sourced reminder aliases from the matrix | Exact label accepted; unrelated button rejected |
| Portugal recommendation menu | Recognize sourced Portuguese action; keep Brazil distinct |
| Save, remove, Share, and Don't recommend channel | Only intended native action is clicked; removal never treated as save |
| Future versus completed premiere | Accept observed future template; reject completed template |
| Date before status; CJK no-space template; Arabic bidi text | Match only source-backed intended states without broad substring matching |
| Browser English, YouTube Japanese; then page language change | Use page terms; update injected labels and rerun classification |
| Reused shelf/card changes category | Clear old class, apply current category; do not hide unrelated content |
| Members-only/UPCOMING cards with no readable text | Structural detection still works |
| Shorts/sidebar or menu with non-English aria label | Verified structural/URL path still works |
| Arabic downloads or Japanese Smart Downloads shelf | Preserve downloads under hideSections using captured shelf evidence |
| Unknown locale | Preserve current English fallback; do not guess translations |
| User custom keywords | Literal semantics unchanged |

The missing live fixtures are implementation prerequisites for promoting **T**, **F**, or **U** evidence to canonical UI labels. All confirmed documentation gaps and independently reproduced matcher problems are recorded above; none has been silently fixed in this research phase.
