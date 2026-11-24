# Contract: `search/builds.json` in Firebase Storage

**Producer**: `functions/builds/updateBuildTrend.js` (nightly 23:30 UTC), through a pure builder in
`functions/builds/searchIndex.js`.
**Consumer**: `src/composables/search/useSearchIndex.js`. No other reader. This is **not** part of
the public API surface (memory: API has two surfaces). It may change with a `v` bump.

## Location

| Environment | Bucket | Object |
|---|---|---|
| prod | `aoe4-guides.firebasestorage.app` (US-EAST1) | `search/builds.json` |
| dev | the dev project's default bucket (`VITE_FIREBASE_STORAGE_BUCKET` in its env) | same |

Client URL, built from `import.meta.env.VITE_FIREBASE_STORAGE_BUCKET`:

```
https://firebasestorage.googleapis.com/v0/b/${bucket}/o/search%2Fbuilds.json?alt=media
```

## Object metadata (set on every upload)

| Header / metadata | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Content-Encoding` | `gzip` (Admin SDK `save(…, { gzip: true })`) |
| `Cache-Control` | `public, max-age=3600` |
| custom `buildCount` | number of rows written |
| custom `generated` | same ISO string as the body |

## Access rule (`storage.rules`)

```
match /search/{file} {
  allow read;
  allow write: if false;   // only the Admin SDK writes, and it bypasses rules
}
```

Existing `/avatars/{fileName}` rule unchanged. Deploy with `firebase deploy --only storage`.

## Response expectations (checked in quickstart §2)

- `200` with `Content-Encoding: gzip` when the request sends `Accept-Encoding: gzip`, which every
  browser does.
- `Cache-Control` echoes the object's value. A second request within the hour comes from the
  browser cache. After an hour the browser revalidates with `If-None-Match` and gets `304`.
- No App Check token required, because Storage enforcement is `UNENFORCED`. **If enforcement is
  ever switched on, search breaks for attestation-failed clients.** That is the same class of trap
  as the Firestore notes, so the reason is written as a comment at the rule.

## Failure behaviour

| Situation | Producer | Consumer |
|---|---|---|
| Trending writes throw | index not written; yesterday's object stays | unaffected |
| Index write throws | `logger.error` `search index failed` (Error Reporting); Trending already committed | serves yesterday's object |
| New count 0 or < 50% of previous | not written; `logger.error` `search index withheld` | serves yesterday's object |
| Fetch fails / offline | n/a | dialog shows "Search can't load right now" plus an "All Builds" link; nothing else on the page changes |
| `v` unknown | n/a | treated as fetch failure, plus a `console.warn` |
