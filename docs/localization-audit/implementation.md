# Localization filtering fixes

Implemented 2026-09-09 after the [research audit](README.md). The matrix remains the pre-fix evidence snapshot so future changes can be compared with it.

## Changes

- Added a separate `es_419` YouTube dictionary and locale normalization. Spain and Latin America now use their own Playables and playlist terms.
- Added all missing non-fallback documented terms from the audit: reminder buttons, playlist links, podcast/Mix names, membership tags, and downloads. Existing aliases remain accepted; documented concept/tag aliases are additions, not claims that every live video badge was observed.
- Added the documented European Portuguese recommendation variants and changed the injected label to `Sem interesse`. Portuguese variants remain separate.
- Included Smart Downloads brand names where the brand does not contain the existing downloads-destination wording: Japanese, Vietnamese, Korean, Arabic, Polish, Simplified Chinese, and Taiwan Traditional Chinese. Sources are the localized [YouTube Smart Downloads Help article](https://support.google.com/youtube/answer/12002587?hl=en).
- Native actions now compare the primary label exactly. The modern `.ytListItemViewModelTitle` was confirmed in the live English menu; legacy `yt-formatted-string` and whole-item exact matching remain fallbacks. Save cannot match a remove action or a description containing the destination name.
- Prefix matching preserves declared trailing-space boundaries and rejects arbitrary letter suffixes for no-space prefixes. Visible premiere badges are checked as well as accessibility labels. Typography normalization handles curved apostrophes and bidi formatting controls, uses deterministic lowercasing, and preserves accents.
- Recomputed derived tags for reused cards and shelves, clearing stale categories. Shared video-card selection covers modern `yt-lockup-view-model` cards. Text replacements, relevant attribute changes, and removals schedule tagging; extension class/style writes do not trigger that observer.
- Sidebar Shorts detection uses same-origin parsed destinations alongside the existing brand fallback. CSS falls back to relative Shorts URLs. Playlist URL matching parses query parameters, and the existing podcast URL signal is shared across supported cards.
- Preserved playlist-library and downloads-section exemptions, language-independent badge detection, stored settings, and literal custom keyword behavior.

## Verification

- `npm test`: **34 passed**, including existing browser-package/Safari transformation checks.
- `npm run check:locales`: **21 catalogs, 67 messages each**.
- `git diff --check`: passed.
- [Native browser fixture](../../tests/fixtures/localized-filtering.html): **14 checks passed** in Chrome against production JavaScript and CSS. Includes multiple locale examples within checks, reused DOM nodes, modern cards, structural-only badges, Smart Downloads, library exemptions, and custom keywords.
- Read-only live YouTube inspection confirmed the English primary-menu-label selector. No save, remove, recommendation, or account-language actions were performed on YouTube.

To rerun the browser fixture, serve the repository root with `python3 -m http.server 8766 --bind 127.0.0.1`, then open `http://127.0.0.1:8766/tests/fixtures/localized-filtering.html`. These synthetic fixtures test behavior and selectors; they are not captures proving all localized YouTube variants.

## Remaining evidence limits

No new wording was invented for Hong Kong, trial badges, localized menu/Shorts accessibility labels, or date-first dynamic metadata. Hong Kong's dictionary remains separate rather than being replaced by Google's generic Traditional Chinese Help response. Existing structural menu selectors remain the first available locale-independent coverage.

Unverified dynamic templates retain conservative matching. For example, a no-space numeric date is accepted after the existing Japanese premiere prefix, but an arbitrary letter suffix is rejected; date-first text relies on structural UPCOMING or reminder evidence. Additional live fixtures are needed before expanding that grammar. Full live validation across every language and native Safari/Firefox execution were not performed.

No settings migration, permission changes, commit, or push was made.
