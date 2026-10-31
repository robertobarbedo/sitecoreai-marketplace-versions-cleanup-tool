# Marketplace submission: Versions Cleanup Tool

Copy-paste text for Sitecore's public-app submission form, in form order.
Replace every `{{...}}` placeholder before submitting.

## 1. App name

Versions Cleanup Tool

## 2. Headline

<!-- 365 chars -->

Keep SitecoreAI page version histories under control from the Pages editor. List every version of the current page and language with its workflow state and live marker, open any version, delete one, or review cleanup suggestions from configurable retention rules and remove the flagged versions in one step. The live version and anything newer are never cleaned up.

## 3. Description

Pages accumulate versions quickly in SitecoreAI: every edit cycle through workflow adds one, and old versions are rarely removed. Large version histories make items harder to work with and clutter the version picker. Versions Cleanup Tool is a Pages context panel that lists every version of the page you are editing, shows which one is live, and suggests which versions can be removed safely.

Key features:
- Version list for the current page and language, newest first, with version number, name, last-updated date, editor and workflow state
- Live and current indicators: the version published to Experience Edge is marked live; the version open in Pages is outlined
- Click a row to switch the Pages editor to that version
- Delete a single version after confirmation (the live version has no delete button)
- Cleanup preview: marks the versions the retention rules would remove, with a kept / to-clean count, before anything changes
- Bulk cleanup: deletes all flagged versions after a confirmation that lists them
- Retention settings shared by the environment: minimum number of versions to keep (default 3) and minimum age in days (default 30)

Retention rules: a version is kept if any rule protects it. The live version and every newer version are protected; walking back from the newest version, every version up to the first one in a workflow final state is protected; versions updated within the last N days are protected; and the newest N versions are always kept.

Use cases:
- Tidy up pages with long edit histories
- Apply a consistent version-retention policy across an authoring team
- Quickly open and compare older versions in Pages

The app has no server logic or credentials; every call runs with the signed-in user's own permissions.

## 4. Financial model

Free

## 5. Categories

Suggested (match to the portal's category list before submitting):
- Content management
- Workflow

## 6. Screenshots to capture

PNG, shown as 600×900 thumbnails. Capture during live QA, with the panel open next to a page that has many versions.

1. Version list with the live marker, the current-version outline and workflow states.
2. Cleanup preview after "Review Cleanup Suggestions" with kept / to-clean counts.
3. Bulk cleanup confirmation dialog listing the versions to delete.
4. Settings dialog with the retention rules.

## 7. Links

- Website: https://github.com/robertobarbedo/sitecoreai-marketplace-versions-cleanup-tool
- Support: https://github.com/robertobarbedo/sitecoreai-marketplace-versions-cleanup-tool/issues
- Privacy policy: https://github.com/robertobarbedo/sitecoreai-marketplace-versions-cleanup-tool/blob/main/PRIVACY.md
- Terms of service: https://github.com/robertobarbedo/sitecoreai-marketplace-versions-cleanup-tool/blob/main/TERMS.md

## 8. Data usage disclosure

Paste from `DATA-USAGE.md` (replace `rb205@proton.me` in it first).

Summary: the app is client-side only. Version data is read and versions are deleted through the Marketplace SDK with the user's own permissions, and nothing reaches the app's server, which only serves static files. The only data it writes is the retention settings item in the customer's own environment; the hosting provider keeps standard request logs for 90 days.

## 9. AI usage disclosure switch

Off. The app does not use AI or machine learning.

## 10. Configuration tab

- Extension point: **Pages Context Panel**, route `/`.
- API access: **SitecoreAI APIs** (the app calls `xmc.authoring.graphql` and `xmc.live.graphql` through the Marketplace SDK, plus `application.context` and `pages.context` query/mutation to switch versions).
- Permissions: none (the code doesn't use pop-ups, the clipboard or file downloads).
- Deployment URL: `{{APP_URL}}`
- Client credentials (custom authorization): **No**. The app has no `/api` routes and uses only the Marketplace SDK's built-in authorization.
- Environment variables on the host: none required. Optional: `NEXT_PUBLIC_PRIMARY_LANGUAGE` (default `en`), `CSP_FRAME_ANCESTORS`.
- App logo: `versions-cleanup-tool-icon.svg`

## 11. Submission details (visible only to Sitecore)

- Contact name: `Roberto Barbedo`
- Contact email: `rb205@proton.me`

**App functionality**

Versions Cleanup Tool is a client-side Next.js 15 app on the Pages Context Panel extension point, with built-in Marketplace authorization only; there are no API routes and the server serves only the static app. It subscribes to `pages.context` for the current page ID, path, language and version and uses `pages.context` mutations to switch the editor to another version. Through the Marketplace SDK it calls `xmc.authoring.graphql` (master database) to list versions, read `__Updated`, `__Updated by`, version name and workflow state, delete versions with `deleteItemVersion` and read/write the settings item, and `xmc.live.graphql` to read the published version number. The retention rules are evaluated in the browser. The only data it stores is a JSON settings item at `/sitecore/system/Modules/Marketplace/VersioningCenter/Settings` in the customer's environment.

**Business value / alignment with Sitecore standards**

The app gives authors a safe, rule-based way to remove obsolete versions from the page they are editing, which keeps items manageable without custom scripts. It uses only supported Marketplace SDK APIs (`pages.context`, `xmc.authoring.graphql`, `xmc.live.graphql`), and every read and delete runs with the signed-in user's own permissions, so users can only delete versions Sitecore already lets them delete. The UI follows the Blok design language (Tailwind CSS v4, Radix UI). Safety and security measures: the live version and all newer versions are never part of a cleanup, the publish chain up to the first workflow-final version is protected, every delete is confirmed, and responses carry security headers (HSTS, CSP frame-ancestors limited to SitecoreAI, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). No secrets, no server-side processing, no analytics and no third-party scripts or fonts.

**Licensing note**

Next.js lists sharp (LGPL-3.0 libvips) as an optional dependency for image optimization; this app doesn't use next/image and sets images.unoptimized, so sharp is never loaded. lightningcss (MPL-2.0) is a build-time-only dependency of Tailwind CSS and is not shipped.

## 12. Pre-submit checklist

- [ ] Live QA in the Pages editor: version list, live marker, open a version
- [ ] Live QA: single delete and bulk cleanup on a test page; the editor switches to the latest remaining version if the open one was deleted
- [ ] Live QA: save retention settings and confirm the suggestions change
- [ ] Screenshots captured (PNG)
- [ ] `rb205@proton.me` replaced in DATA-USAGE.md, PRIVACY.md, TERMS.md, SECURITY.md; `Roberto Barbedo`, `rb205@proton.me`, `{{APP_URL}}` replaced in this form
