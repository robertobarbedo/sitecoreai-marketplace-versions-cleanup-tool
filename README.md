# Sitecore XM Cloud Versioning Center

A [Sitecore Marketplace](https://marketplace.sitecore.com/) tool that lets editors view, navigate, and trim item versions directly inside **Sitecore XM Cloud Pages**. It surfaces as an embedded panel in the Pages editor, giving content authors full visibility into the version history of the page they are working on, and a one-click cleanup flow driven by configurable retention rules.

---

## Features

- **Version list** — shows every version of the current item with its number, display name, last-updated date, editor, workflow state, and a live/current indicator.
- **Individual delete** — remove any single version from the list.
- **Smart trim preview** — calculates which versions are safe to delete based on the retention algorithm and highlights them before anything is touched.
- **Bulk trim** — deletes all flagged versions in one action and automatically navigates to the latest remaining version.
- **Configurable retention settings** — tune the two threshold values from the Settings modal; settings are persisted in the Sitecore content tree so every editor shares them.
- **Live version protection** — the currently published (live) version and anything newer than it are always protected, regardless of other settings.

---

## Retention Algorithm

When a trim is requested the tool applies four rules in order:

| Rule | Description |
|------|-------------|
| **Rule 0 — Live guard** | Protects the live (published) version and every version newer than it. |
| **Rule 1 — Minimum count** | Always keeps the *N* newest versions (default **3**). Configurable from 1 – 1,000. |
| **Rule 2 — Age protection** | Keeps any version updated within the last *D* days (default **30**). Configurable from 0 – 3,650. |
| **Rule 3 — Publish chain** | Walks backward from the latest version and protects every version until a workflow final-state version is found, ensuring the publish chain stays intact. |

Only versions not protected by any rule are flagged for removal.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4, Radix UI, MDI icons |
| Sitecore integration | [`@sitecore-marketplace-sdk/client`](https://www.npmjs.com/package/@sitecore-marketplace-sdk/client), [`@sitecore-marketplace-sdk/xmc`](https://www.npmjs.com/package/@sitecore-marketplace-sdk/xmc) |
| API | XM Cloud Authoring GraphQL + Experience Edge GraphQL |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An XM Cloud environment with Sitecore Pages
- The app registered as a Marketplace tool in your XM Cloud instance

### Install & run locally

```bash
npm install
npm run dev        # starts on http://localhost:5000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # start the production server
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PRIMARY_LANGUAGE` | Default content language (falls back to `en`) |

---

## Project Structure

```
src/
  app/
    page.tsx            # Root panel component (VersioningCenterPanel)
    layout.tsx          # App shell
    globals.css         # Tailwind base styles
  types/
    version.ts          # VersionInfo and TrimSettings interfaces
  utils/
    sitecore-graphql.ts # XM Cloud GraphQL queries and mutations
    sitecore-settings.ts# Persist/load retention settings in Sitecore
    trim-versions.ts    # Retention algorithm (calculateVersionsToTrim)
    hooks/
      useMarketplaceClient.ts  # SDK client initialisation hook
  constants.ts          # Database names, default language

components/
  versions-list.tsx     # Version list UI with per-row actions
  trim-actions.tsx      # Preview / trim toolbar
  settings-modal.tsx    # Retention settings dialog
  ui/                   # Shared primitives (Button, Input, Dialog, Separator)

lib/
  icon.tsx              # MDI icon wrapper
  utils.ts              # Class name helper (clsx + tailwind-merge)

References/
  Oneok.Feature.VersionsTrimmer/   # Legacy XM (non-cloud) C# scheduled task
  publishing center/               # Reference implementation for another Marketplace tool
```

---

## Settings Persistence

Retention settings are stored as a JSON field in the Sitecore content tree at:

```
/sitecore/system/Modules/VersioningCenter/Settings
```

The item and its parent folder are created automatically on first save if they do not exist.

Default values:

| Setting | Default |
|---------|---------|
| Minimum versions to keep | 3 |
| Minimum days to keep | 30 |

---

## References

The `References/Oneok.Feature.VersionsTrimmer/` folder contains a legacy **Sitecore XM** (on-premise) implementation using a C# scheduled task (`VersionsTrimmerTask`) and a Sitecore command (`TrimItemVersions`). It is included for reference only and is not required to run the Marketplace tool.

---

## Author

Developed by **Roberto Barbedo**.
