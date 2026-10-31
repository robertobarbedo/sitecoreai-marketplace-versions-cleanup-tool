# Privacy Policy

**Last updated: 2026-10-31**

## Overview

This policy explains what data the Versions Cleanup Tool ("the app")
handles, where it goes, what is stored, and how you can exercise your
rights. It applies to the hosted app listed in the Sitecore Marketplace.

## Summary

- The app runs entirely in your browser. It has no `/api` routes, no
  database, no sign-in of its own and no server-side logic; its server only
  serves the static app files.
- The app uses no analytics, tracking or advertising services, and loads no
  third-party scripts or fonts.
- The app stores nothing on its own servers and nothing in your browser's
  storage. The only thing it writes is its retention settings item in your
  own SitecoreAI environment.
- The app deletes item versions in your environment when you ask it to.
  Deletions use your own SitecoreAI permissions and are irreversible unless
  you have your own backups.

## How the app works

The app runs inside the SitecoreAI Pages editor as a context panel. It talks
to your environment through the Sitecore Marketplace SDK, with the signed-in
SitecoreAI user's own permissions:

- Sitecore Authoring and Management GraphQL API (`master` database): list
  the versions of the current page, read their metadata, delete versions,
  and read and write the settings item.
- Experience Edge Delivery GraphQL API (Live): read which version of the
  page is published.

All of these calls go from your browser to Sitecore through the SDK. None of
them pass through the app's server.

## What data the app handles

- **Page context** (page ID, path, language, current version): received
  from the Pages editor.
- **Version metadata** (version number, version name, `__Updated` date,
  `__Updated by` user name, workflow state, live version number): read from
  your environment and shown in your browser only.
- **Retention settings** (minimum number of versions and minimum age in
  days): read from and written to your environment.
- **Delete requests**: the page ID, language and version number of each
  version you choose to delete, sent to your environment.

## Where data goes

1. **Sitecore.** Authoring and Experience Edge queries and mutations, made
   from your browser through the Marketplace SDK.
2. **The app's server.** Your browser downloads the app's static files.
   These requests carry no Sitecore data.

The app does not sell or share data with anyone else.

## What is stored and where

| Data | Where | Retention |
| --- | --- | --- |
| Retention settings, as JSON (for example `{"minimumNumber":3,"numberOfDays":30}`) | Your SitecoreAI environment, item `/sitecore/system/Modules/Marketplace/VersioningCenter/Settings` (`master` database) | Until you change or delete it |
| Standard request metadata recorded by the hosting provider when the app's files are served (IP address, time, path, user agent) | Vercel | 90 days at most |

The app keeps no copy of your content or version data. It writes nothing to
`localStorage`, `sessionStorage` or cookies.

## Who can access it

- **Settings item:** users of your environment with read access to the
  module folder; changing it needs write access. Governed by your SitecoreAI
  security and your agreement with Sitecore.
- **Hosting request logs:** only the app's maintainer, for operating and
  securing the app, and the hosting provider as a sub-processor.
- **Sitecore data:** governed by your SitecoreAI permissions; the app does
  not keep a copy.

## How data is protected

- All traffic uses HTTPS (TLS 1.2 or later) with HSTS.
- Every Sitecore call runs with the signed-in user's own permissions, so a
  user can only read or delete what SitecoreAI allows them to.
- Single delete and bulk cleanup ask for confirmation before anything is
  deleted, and the live version is never part of a cleanup.
- Security headers restrict which sites may embed the app.
- Logs and stored data are protected by the providers' encryption at rest.

## Sub-processors and third parties

- **Vercel Inc.** (hosting of the static app). Serverless functions run in
  the United States (region `iad1`, Washington, D.C.) unless a deployment
  sets another region. See https://vercel.com/legal/privacy-policy.
- **Sitecore** (the SitecoreAI APIs), under your own agreement with
  Sitecore.

No analytics, tracking or advertising services are used.

## Your rights

Depending on where you live (for example under the GDPR or CCPA), you may
have the right to access, correct, delete, restrict or object to the
processing of your personal data, and to receive a copy of it.

To make a request, email rb205@proton.me with the subject "Data request".
We answer within 30 days. The publisher holds no personal data beyond the
hosting provider's request logs described above. Data in your SitecoreAI
environment (including the settings item and the `__Updated by` values shown
by the app) is governed by your agreement with Sitecore. You can also
complain to your local data protection authority.

## Deletion

- **Settings:** delete the `/sitecore/system/Modules/Marketplace/VersioningCenter`
  folder (and, on older installs, `/sitecore/system/Modules/VersioningCenter`)
  in your environment. Uninstalling the app does not remove it.
- **Hosting request logs** are deleted automatically after 90 days at most.
- **Deleted versions:** versions you delete with the app are removed from
  your environment for good. The app cannot restore them; only your own
  backups can.

## Changes to this policy

We may update this policy from time to time. Changes are published in this
file and reflected in the "Last updated" date at the top.

## Contact

Questions about this policy: email rb205@proton.me or open an issue at
https://github.com/robertobarbedo/sitecoreai-marketplace-versions-cleanup-tool/issues.
