# Versions Cleanup Tool

A SitecoreAI Pages panel for content authors to review, open and clean up the
versions of the page they are editing.

Pages accumulate versions quickly in SitecoreAI (XM Cloud): every edit cycle
through workflow adds one, and old versions are rarely removed. Large version
histories make items harder to work with and clutter the version picker.

Versions Cleanup Tool lists every version of the current page in the current
language, shows its workflow state and whether it is live, and suggests which
versions can be removed safely based on configurable retention rules. Authors
review the suggestions, confirm, and the app deletes the flagged versions. The
live version and anything newer than it are never part of a cleanup.

## Features

- **Version list** — every version of the current page and language, newest
  first, with version number, version name, last-updated date (relative, with
  the exact date on hover), editor, and workflow state.
- **Live and current indicators** — the version published to Experience Edge
  is marked as live; the version open in Pages is outlined.
- **Open a version** — click a row to switch the Pages editor to that version.
- **Single delete** — delete one version after a confirmation dialog. The live
  version has no delete button.
- **Cleanup preview** — "Review Cleanup Suggestions" marks the versions the
  retention rules would remove, with a kept / to-clean count, before anything
  is changed.
- **Bulk cleanup** — "Perform Cleanup" deletes all flagged versions after a
  confirmation that lists them. If the version open in Pages was deleted, the
  editor switches to the latest remaining version.
- **Retention settings** — minimum number of versions and minimum age in days,
  stored in the content tree and shared by everyone in the environment.
- **Refresh** — reload the version list without reopening the panel.

## How it works

- **Extension point:** Pages Context Panel. The app subscribes to
  `pages.context` to get the current page ID, path, language and version, and
  uses `pages.context` mutations to switch the editor to another version.
- **APIs:** all calls go from the browser through the
  Marketplace SDK
  ([`@sitecore-marketplace-sdk/client`](https://www.npmjs.com/package/@sitecore-marketplace-sdk/client)
  and [`@sitecore-marketplace-sdk/xmc`](https://www.npmjs.com/package/@sitecore-marketplace-sdk/xmc)).
  There is no app server logic and there are no `/api` routes.
  - `xmc.authoring.graphql` (Authoring and Management GraphQL, preview
    context, `master` database): list versions, read each version's
    `__Updated`, `__Updated by`, version name and workflow state, delete
    versions (`deleteItemVersion`), and read/write the settings item.
  - `xmc.live.graphql` (Experience Edge, live context): read the version
    number of the page as currently published, used to mark the live version.

```
Pages editor (host) <-> Versions Cleanup Tool iframe
                          |
                          +-- Marketplace SDK --> Authoring GraphQL (master)
                          +-- Marketplace SDK --> Experience Edge (live)
```

### Retention rules

A version is kept if any of these rules protects it. Everything else is
flagged for removal.

| Rule | Description |
|------|-------------|
| **Live guard** | The live (published) version and every version newer than it are protected. |
| **Publish chain** | Walking back from the newest version, every version is protected up to and including the first one in a workflow final state. If no version is in a final state, all versions are protected. |
| **Age protection** | Versions whose `__Updated` date is within the last *D* days are protected (default **30**, allowed 0 to 3,650). |
| **Minimum count** | The *N* newest versions are always kept (default **3**, allowed 1 to 1,000). |

The rules only drive the cleanup suggestions. Single delete is not checked
against them.

## Requirements

- A SitecoreAI (XM Cloud) environment with Pages.
- Organization Admin or Owner rights in the Cloud Portal to register and
  install the app.
- For authors using the app: permission to delete versions of the pages they
  clean up. To save retention settings: permission to create and edit items
  under `/sitecore/system/Modules`.
- No extra credentials or third-party services.

## Install in SitecoreAI

1. In the Cloud Portal, open **App Studio** and choose **Create App**.
2. Enter an app name (for example `Versions Cleanup Tool`) and select type
   `Custom`.
3. Add the extension point **Pages Context Panel** with route `/`.
4. Under API access, enable **SitecoreAI APIs**.
5. No extra permissions are needed.
6. Set the deployment URL to `https://<your-deployment>/`.
7. Upload the app logo: `versions-cleanup-tool-icon.svg` in this repository.
8. Save, then install the app in your organization and grant it access to the
   environments where it should run.
9. Open a page in Pages and select the app from the context panel.

## Deploy your own instance

```bash
npm install
npm run build
npm start
```

Deploy to Vercel or any Node.js host that can run Next.js, then point the App
Studio deployment URL at the public HTTPS address.

No environment variables are required. Set these optional ones in your
host's environment settings (or a local `.env.local`) if you need them:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PRIMARY_LANGUAGE` | No | Fallback content language for GraphQL helpers (default `en`). The app normally uses the language of the page open in Pages. |
| `CSP_FRAME_ANCESTORS` | No | Sites allowed to embed the app, as space-separated CSP sources for the `Content-Security-Policy: frame-ancestors` header (default `'self' https://*.sitecorecloud.io`). |

Both are read at build time. There are no secrets.

The app only runs inside SitecoreAI: the Marketplace SDK needs the host
iframe, so opening the deployment URL directly in a browser stays on
"Waiting for page context..." or shows "Failed to initialize." For local
development, expose `npm run dev` (port 5000) over HTTPS, for example with
ngrok, and register that URL in a separate development app in App Studio.

## Configuration

Open **Settings** at the bottom of the panel to change the retention rules.

| Setting | Default | Allowed |
|---------|---------|---------|
| Minimum versions to keep | 3 | 1 to 1,000 |
| Minimum days to keep | 30 | 0 to 3,650 |

Settings are stored as JSON (for example
`{"minimumNumber":3,"numberOfDays":30}`) in the `Value` field of this item in
the `master` database:

```
/sitecore/system/Modules/Marketplace/VersioningCenter/Settings
```

The `Marketplace` and `VersioningCenter` folders and the `Settings` item are
created on first save. If the item does not exist, the app reads the legacy
location `/sitecore/system/Modules/VersioningCenter/Settings` instead; the next
save writes to the new path. If neither exists, the defaults apply. Details,
including item and template IDs, are in
[docs/settings-persistence.md](docs/settings-persistence.md).

## Security and privacy

- **Authentication:** the app has no login of its own. Every call runs through
  the Marketplace SDK with the signed-in SitecoreAI user's permissions, so a
  user can only delete versions they are allowed to delete.
- **Secrets:** none.
- **Data flow:** content data goes only between the browser and your
  SitecoreAI environment through the SDK. The app's server only serves the
  static Next.js app.
- **Analytics and tracking:** none. The app loads no third-party scripts or
  fonts.
- **Security headers:** every response sets HSTS, a
  `Content-Security-Policy: frame-ancestors` header that limits which sites
  can embed the app (see `CSP_FRAME_ANCESTORS`), `X-Content-Type-Options`,
  `Referrer-Policy` and `Permissions-Policy`.
- **Deletion is permanent:** versions are deleted through the Marketplace
  SDK (`deleteItemVersion`) with the signed-in user's own permissions. They
  cannot be restored from the app, so treat a deletion as irreversible
  unless you have your own backups of the environment. Both single delete
  and bulk cleanup ask for confirmation first.
- **Stored data:** the only thing the app writes, apart from deleting
  versions, is the retention settings item under
  `/sitecore/system/Modules/Marketplace/VersioningCenter` in your own
  environment. Delete that folder to remove it.
- **Policies:** [Privacy policy](PRIVACY.md),
  [Terms of service](TERMS.md),
  [Data usage disclosure](DATA-USAGE.md) and
  [Security policy](SECURITY.md).

## Limitations

- Works on one page and one language at a time. There is no bulk cleanup
  across a subtree or site.
- If the live version cannot be read from Experience Edge (for example the
  page was never published, or the query fails), no version is marked live
  and the live guard does not apply. The publish chain, age and count rules
  still apply.
- Single delete is only blocked for the live version itself; versions newer
  than the live one can still be deleted one by one.
- Versions are loaded with one GraphQL request per version and deleted one at
  a time, so pages with very many versions load and clean up slowly.
- Settings are read and written in the language of the page that is open.

## Development

- Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Radix UI,
  MDI icons, Marketplace SDK (`@sitecore-marketplace-sdk/client`,
  `@sitecore-marketplace-sdk/xmc`).
- `npm run dev` starts the dev server on port 5000.

```
src/
  app/          Panel page, layout and global styles
  types/        Version and settings types, defaults
  utils/        GraphQL calls, settings persistence, retention rules,
                Marketplace client hook
components/     Version list, cleanup toolbar, settings dialog, UI primitives
lib/            Icon wrapper and class name helper
docs/           Settings persistence details
```

See [docs/settings-persistence.md](docs/settings-persistence.md) for how
settings are stored.

## Support

Report bugs and request features in
[GitHub Issues](https://github.com/robertobarbedo/sitecoreai-marketplace-versions-cleanup-tool/issues).
Report security problems privately as described in the
[Security policy](SECURITY.md). This is a community app and is not an
official Sitecore product.

## License

Licensed under the Apache License 2.0 — see [LICENSE](LICENSE).
