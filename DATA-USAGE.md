# Data usage disclosure

Versions Cleanup Tool is a Pages context panel for SitecoreAI that lists the
versions of the current page and deletes the ones you choose, or the ones
its retention rules flag. Every read and delete goes from the user's browser
to SitecoreAI through the Marketplace SDK, with the user's own permissions.
The app has no `/api` routes, no database, no sign-in of its own, no
browser storage and no analytics; its server only serves the static app.

Hosting: Vercel. Serverless functions run in the United States (Vercel
default region `iad1`, Washington, D.C.) unless the deployment sets another
region. In transit, all data uses TLS 1.2+ and HSTS.

| Data type | Source | Purpose | Retention | Storage region | Access | Protection | Your rights (DSAR) | Deletion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Page context (page ID, path, language, current version) | SitecoreAI Pages editor via the Marketplace SDK | Know which page and language to work on, and switch the editor to another version | Not stored; held in the browser while the panel is open | Not stored (customer's SitecoreAI environment) | The signed-in user | TLS 1.2+; passed between the Pages host and the app iframe by the SDK | Governed by the customer's Sitecore agreement; email rb205@proton.me | Nothing to delete; closing the panel clears it |
| Version metadata (version number, version name, `__Updated`, `__Updated by` user name, workflow state, live version number) | Authoring GraphQL (`master`) and Experience Edge (Live) via the Marketplace SDK | Show the version list and work out the cleanup suggestions | Not stored; held in the browser while the panel is open | Not stored (customer's SitecoreAI environment) | The signed-in user, with their own SitecoreAI read permissions | TLS 1.2+; SitecoreAI permissions enforced by Sitecore; never sent to the app's server | Governed by the customer's Sitecore agreement; email rb205@proton.me | Nothing to delete; closing the panel clears it |
| Version deletions (page ID, language, version number) | User action in the panel (single delete or bulk cleanup, after confirmation) | Remove old versions of the page | Deleted versions are removed from the environment permanently; the app keeps no record | Customer's SitecoreAI environment | The signed-in user, with their own SitecoreAI delete rights | TLS 1.2+; sent from the browser through the Marketplace SDK (`deleteItemVersion`), never via the app's server; confirmation required; live version never part of a cleanup | Governed by the customer's Sitecore agreement | Irreversible: deleted versions can't be restored by the app, only from the customer's own backups |
| Retention settings (minimum versions to keep, minimum days to keep, as JSON) | Users, in the app's Settings | Configure the cleanup rules for everyone in the environment | Until changed or deleted | Customer's SitecoreAI environment (its region), `master` database | Users with read access to the module folder; write access to change | Customer's SitecoreAI security and provider encryption at rest; TLS 1.2+ | Governed by the customer's Sitecore agreement | Delete `/sitecore/system/Modules/Marketplace/VersioningCenter` (and legacy `/sitecore/system/Modules/VersioningCenter`) |
| Hosting request logs (IP address, time, path, user agent) for the app's static files | Vercel, when the browser loads the app | Operate and secure the hosting | 90 days | Publisher's log store (Vercel) | The publisher and the hosting provider | Provider encryption at rest; TLS 1.2+; no content, tokens or secrets | Email rb205@proton.me; the publisher keeps no personal data beyond logs | Deleted automatically after 90 days, or earlier on request |

## AI usage

This app does not use AI or machine learning.
