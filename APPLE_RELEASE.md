# macOS Safari release notes

Status: owner confirms the updated UI and all three tips work; **Apple submission preparation remains incomplete**. Mac only (macOS 13+, arm64 and x86_64). No iPhone/iPad targets. Browser version remains 2.13.

## Source and builds

`apple/configuration.json` owns app/extension IDs, team, URL scheme, Apple version/build, public URLs, numeric App Store ID, and consumable metadata. It contains public identifiers, not signing credentials. Contributors must configure their own team before signing.

| Command | Effect |
| --- | --- |
| `npm run build` | Validate locales, run JavaScript tests, package Chromium/Firefox/Safari |
| `npm run prepare:apple` | Generate Safari resources, xcconfig, local product metadata, and icon sizes from existing artwork |
| `npm run build:apple:debug` | Unsigned universal Debug compilation |
| `npm run build:apple:release` | Unsigned universal Release compilation |
| Append `-- --signed` to either build command | Development-signed build, separate output directory |
| `npm run test:apple` | Packaging tests plus executable native routing/purchase-state tests |
| `npm run validate:apple:release` | Validate signed Release bundle, identities, architecture, sandbox, resources and metadata |

Outputs are isolated under `build/apple-{debug,release}-{unsigned,signed}`. Native build/test commands limit compilation to one job to reduce CPU and memory use. No command creates distribution archives or uploads anything. Run preparation before opening the tracked Xcode project. Normal **YouTube UI Cleaner** launch is unbound to local StoreKit; Archive uses Release. **StoreKit Testing (macOS)** binds `Configurations/TipProducts.storekit` only for Debug launches and has no Archive action. Preserve transaction history; reset only temporary simulation settings after testing.

Safari uses a runtime-file allowlist. Build transformations remove Ko-fi, other-browser review engagement tracking, and cross-promotion only from Safari. Chromium/Firefox runtime files remain byte-identical to their source, with browser-specific manifest handling. All 21 locales retain cleanup controls and receive Apple action labels. English currently remains the fallback for the two new error messages. Safari names are checked against the converter's 40-character limit, separate from the App Store listing limit.

The owner separately authorized a shared **Hide Sponsored Videos** control on August 31, so this feature intentionally changes the common Chromium/Firefox/Safari runtime. It is an independently adjustable, default-on filter under **Hide Promotions & Sponsors**, alongside service offers and paid-promotion banners. The master controls all three options and reflects mixed child states without migrating saved values. Sponsored filtering covers YouTube feeds, search and recommendations. Labels are translated in all 21 catalogs; the owner requested no description beneath the sponsored toggle. Structural ad containers/badges are used instead of matching titles or creator sponsorship disclosures. This is cosmetic filtering, not network blocking or in-player ad skipping.

The native implementation separates configuration, routing, StoreKit adapter/state, views, and app lifetime. It uses an AppKit sheet container, a weak visible-window purchase anchor, app-owned transaction updates and serialized unfinished-transaction recovery. Verification, expected product IDs, completion deduplication, concurrency guards, retry and terminal-state cleanup are executable-test covered. These tests use a fake client and do not certify real StoreKit delivery.

## Identity and portal drafts

- App: `app.chaseos.YouTubeUICleaner`; extension: `app.chaseos.YouTubeUICleaner.Extension`.
- Support route: `youtubeuicleaner://support` (opens UI only; rejects other hosts, paths, credentials, query and fragment).
- App Store Connect: `6806902230`, SKU `YTUC-MAC-001`, macOS version **2.13**, build **1**, English (U.S.), Utilities.
- Free public app; all 175 countries or regions selected for availability on release. This is not public release authorization.
- Support: <https://github.com/Chaseos/YouTube-UI-Cleaner>.
- Privacy: <https://github.com/Chaseos/YouTube-UI-Cleaner/blob/main/PRIVACYPOLICY.md>.
- Repeatable consumables: `.tip.small` $0.99, `.tip.standard` $2.99, `.tip.generous` $4.99, each prefixed with the app bundle ID. All features work without tipping; tips confer no lasting benefit.

Draft listing text, keywords, copyright and review instructions have been saved. Product creation/configuration is tracked in the ignored `build/release-check/PORTAL_ACTIONS.md`; never infer approval from record creation. No distribution build has been archived/uploaded, no testers added, no review submission or release performed.

## Observed results — updated 2026-08-31

Environment: macOS 26.6.2, Xcode 26.6 (17F113), macOS SDK 26.5, Apple Silicon Mac. Older macOS and Intel runtime remain unverified.

| Scenario | Result and scope |
| --- | --- |
| Baseline and Safari JavaScript/package checks | 22 tests passed (13 existing, 7 Apple, 2 sponsored-filter state tests), including executable persistence/message tests and browser-package byte preservation |
| Native logic | 6 executable tests passed, covering routing, load failures/empty/partial/retry, verification, completion deduplication, updates/recovery, concurrent attempts and terminal states |
| Universal builds | Current source passed Debug and Release development-signed builds and both artifact validators on August 31, using one compilation job at reduced priority. Unsigned builds passed earlier in the session |
| Native setup/support | Observed real Mac UI, extension status/instructions, product loading, all three localized product prices, Done and Escape dismissal |
| Normal launch without local products | Empty/unavailable state with retry observed |
| Tip purchases — latest owner test | Owner reports testing all three tips successfully in the latest build. This supersedes the earlier purchase-button issue as a current blocker. The test environment was not specified; do not label it Sandbox, TestFlight or production verification |
| Earlier local confirmation and isolation | Historical agent test: Xcode/no-charge confirmation had a blank Purchase-button area in both this app and a temporary plain AppKit diagnostic. Cancel restored usable controls. Retained for context, not as a current failure after the owner's successful test |
| Reference comparison | Read-only comparison with SimpleVideoSpeedController at `2a397da`. Its owner reports successful purchases on all platforms in the latest build; older repository failure notes must not override that user report. This app's local failure remains independently observed |
| Repeats/pending/relaunch delivery | Owner confirms successful tip purchases; repeat purchases, pending approval and interrupted/relaunch delivery were not separately reported. Fake-client tests cover these state paths but are not real StoreKit delivery evidence |
| Safari extension enablement | Enabled, with private browsing and youtube.com access working. The popup renders current controls. Native setup previously reported status unavailable; that status has not been rechecked |
| Sponsored-video live smoke test | Actual Safari extension UI opened in a temporary full-page tab because automated popover clicks dismissed it. Turning the saved preference off revealed four sponsored Home cards; on hid all four without a page refresh, while ordinary videos remained. This also exercised cross-tab propagation. Earlier read-only Web Inspector inspection confirmed four hidden ad-slot containers; no account actions were invoked |
| Existing Home Categories control | Disabling hiding revealed topic chips; enabling hiding removed them again, without refreshing. Original setting restored. Shorts expansion worked, but an automation safety rejection prevented its on/off test; do not count that as verified |
| Promotions & Sponsors grouping | Generated Safari popup tested locally with a storage stub: saved mixed preferences preserved on load; master enabled/disabled all three children; sponsored child changed independently and restored the mixed indicator. No console errors observed |
| Safari header expansion | Owner confirms the updated layout works well. Safari-only CSS keeps the header on one line and ellipsizes the app name as action labels expand. Generated markup also checked in a local browser: Rate/Support hover, keyboard focus plus simultaneous hover, German labels and Arabic RTL kept the same header height with no horizontal overflow |
| Site-wide sponsored CSS regression | Local browser fixture passed Home, Subscriptions, Explore, search, legacy and modern recommendation layouts, localized ad badges, off/on restoration, insertion, card reuse and navigation. Ordinary cards, creator disclosure overlays and in-player UI remained visible. Live non-Home ad placements remain unverified |
| Accessibility | Semantic labels observed; full VoiceOver, larger text, long/RTL locale, keyboard order, Reduce Motion and light/dark runtime matrix incomplete |
| Sandbox/TestFlight | Not performed by the agent; environment of the owner's successful tip tests was not specified. Do not infer distribution-environment verification from that report |

The owner requested lower CPU/memory usage and no new Xcode projects. All task-owned test apps were stopped, the diagnostic and app project windows closed, and the temporary diagnostic project/source removed. No additional native builds or launches should run merely to repeat existing evidence; resume targeted verification when appropriate. Existing unrelated apps and transaction history were preserved.

Sanitized screenshots and logs stay in ignored `build/release-check/`. Current native captures are window-sized JPEG diagnostic evidence, not complete store-ready assets. No personal YouTube feed screenshots should enter source control or listings.

For repeatable cosmetic-filter checks, serve the repository locally and open `tests/fixtures/sponsored-videos.html`. The fixture uses the production stylesheet and reports each card's visibility; it does not simulate real ad delivery or replace live browser checks. Safari's page console showed YouTube media 403/privacy warnings and the extension's activation message; no extension runtime error was observed in that inspection. One console syntax error was caused by the test command, not shipped code.

## Privacy and declarations awaiting owner confirmation

Source audit found no developer endpoint, analytics SDK, receipt server, URLSession client, fetch, XHR, beacon or websocket in the Apple artifact. Preferences and keyword filters use browser storage. Safari implements `storage.sync` locally without cross-device sync. Content scripts read YouTube's DOM to apply filters and invoke the site's existing controls; user-initiated quick actions may change the user's YouTube account data through YouTube itself. StoreKit communicates with Apple for payment/product information. Help/privacy/rating links open the selected external destination. No page data is passed to the native extension handler.

Proposed App Privacy answer: **Data Not Collected by the developer**, subject to the owner confirming these data flows and third-party collection responsibilities. Do not publish the attestation without confirmation. No direct required-reason APIs were identified in native source; re-audit the final binary/dependencies and current Apple requirements before deciding whether a privacy manifest declaration is needed. Do not copy a reason code from another app.

Proposed export answer: no custom or non-exempt encryption; only operating-system/StoreKit services and browser HTTPS. No `ITSAppUsesNonExemptEncryption` declaration has been submitted on the owner's behalf. Owner must confirm. Age rating and content rights also require owner decisions: the utility itself has no mature content, but interacts with YouTube's unrestricted third-party video pages. Do not assume a 4+ rating or claim rights to third-party material. Read-only portal verification found Free/Paid Apps agreements, banking and tax status Active; those records were left unchanged. DSA trader verification remains required from the owner. Changes to any legal, banking or tax records remain owner-only actions.

## Release gates and review instructions

1. Enable the specific development extension in Safari Settings → Extensions, grant youtube.com access, reload the page. The containing app cannot infer website permissions from extension enablement.
2. Verify a representative set of reliably visible cleanup controls (for example, Shorts and sidebar entries), popup reopen and persistence, then watch for errors during ordinary navigation. The owner explicitly accepts that content-dependent toggles cannot all be exercised on demand; record those as unverified. Check custom filters and account-dependent quick actions only where suitable test content or an authorized review account is available. Do not modify a personal account to manufacture evidence.
3. Verify star's exact app-specific write-review destination (unpublished page may be unavailable), heart handoff, cold/warm/duplicate URL handling and dismissal. A support URL must never initiate a purchase.
4. All three tips are owner-verified working. Remaining purchase checks concern repeat purchases, pending approve/decline, interruption, closed-sheet updates and relaunch recovery in explicit test environments. Product/purchase errors and retry are executable-test covered; record any further real StoreKit results without assuming an environment or scenario from the basic success report.
5. Capture final real native and Safari screenshots after runtime fixes. Mac listing and IAP review screenshots support 16:10 at 1280×800, 1440×900, 2560×1600 or 2880×1800. Use JPEG/PNG without transparency, inspect every image, and distinguish private review evidence from public listing screenshots.
6. Obtain owner confirmation for privacy/age/content-rights/export declarations and any account agreements. Confirm review contact details and an authorized third-party account path where necessary.
7. Rebuild current resources, run final tests and inspect a fresh distribution archive only after separate authorization. Use a new Apple build number if replacing an uploaded build. Upload, tester invitations, review submission and public release each require their own authorization.

The Safari popup's requested rating/support handoff remains an App Review §4.4 risk even though purchases occur in the containing app. Disclose the flow accurately. If Apple objects, request a product decision about a neutral Open App/help action rather than silently redesigning it.

Official references checked during implementation: [App Review Guidelines §4.4](https://developer.apple.com/app-store/review/guidelines/#extensions), [StoreKit purchase API](https://developer.apple.com/documentation/storekit/product/purchase(confirmin:options:)-8eai6), [local StoreKit testing](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-in-xcode), [IAP information and review screenshots](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information/), [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).
