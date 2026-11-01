# Wholesale Sourcing Log — iPhone PWA (Google Sheets + Drive edition)

An offline-first PWA for collecting children's clothing and electronics suppliers, product samples, prices, MOQ, WeChat contacts, notes and photos.

## What this version does
- Saves records and photos immediately in IndexedDB on the iPhone.
- Resizes captured photos to a practical upload size before local storage.
- Shows photo previews and a record detail gallery.
- Automatically attempts to sync when the app is open and the device comes online.
- Writes supplier records to a Google Sheet (`Suppliers` and `Products` tabs).
- Uploads photo copies to a private Google Drive folder and stores their Drive URLs in the matching spreadsheet row.
- Verifies sync using a record ID status check before marking a local record as synced.
- Retries pending records on reconnect, app launch and when returning to the app.
- CSV export and full JSON backup/restore including local photos.

## Important behavior and limitations
- **Offline-first:** no internet is required to save, browse or view records/photos already on this iPhone.
- **Automatic sync:** browsers and iOS may suspend a PWA while it is closed. Sync happens when the app is open/foregrounded and online, not guaranteed in the background while closed.
- **China connectivity:** Google Sheets and Drive may be unreachable on ordinary mainland Chinese internet. Records queue locally and retry when the service is reachable (for example, later on a connection that can access Google).
- Drive files are **private by default**. They are viewable by the Google account that owns the Drive folder and anyone you explicitly share with. Do not make supplier photos public unless you intend to.
- Keep regular full JSON backups. Clearing Safari website data can erase local IndexedDB data.
- Existing local records from v1 remain in the same IndexedDB database and can be synced by this version.

## Setup A — create Google Sheet
1. Sign in to the Google account where you want the database.
2. Create a spreadsheet named `Wholesale Sourcing Database`.
3. Copy the spreadsheet ID from its URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.

## Setup B — create Google Drive photo folder
1. In Google Drive, create a folder named `Wholesale Sourcing Photos`.
2. Open it and copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID`.
3. Keep this folder private. The script creates photo files inside it.

## Setup C — deploy Apps Script
1. Open the Google Sheet → **Extensions → Apps Script**.
2. Replace the editor contents with `Code.gs` from this package.
3. Set `SHEET_ID` to your spreadsheet ID.
4. Set `DRIVE_FOLDER_ID` to your Drive folder ID.
5. Replace `SYNC_KEY` with a long private random value (at least 32 characters). Example: generate a random password; do not reuse your Google password.
6. Save the project.
7. Select **Deploy → New deployment → Web app**.
8. Execute as: **Me**.
9. Who has access: choose **Anyone** only if required for the PWA to reach the endpoint. The secret key protects write requests; the status endpoint only reveals whether an unguessable record UUID has synced. If your organization offers a narrower setting that works, use it.
10. Deploy and authorize the requested Sheets and Drive permissions.
11. Copy the Web app URL ending in `/exec`.

### When you change Code.gs later
Use **Deploy → Manage deployments → Edit** (pencil) → select **New version** → Deploy. The existing `/exec` URL normally remains the same.

## Setup D — connect the iPhone app
1. Open your hosted PWA in Safari.
2. Go to **Sync & backup**.
3. Paste the Apps Script `/exec` URL.
4. Paste the exact `SYNC_KEY` value from Code.gs.
5. Tap **Save sync settings**.
6. Add a test supplier with one photo. Keep the PWA open while it syncs.
7. Check the `Suppliers` sheet and `Wholesale Sourcing Photos` Drive folder. The row should contain Drive photo links and the app should show `Synced to Google`.

## Where to view your data
- Supplier records: Google Sheet → `Suppliers` tab.
- Product/sample records: Google Sheet → `Products` tab.
- Photos: Google Drive → `Wholesale Sourcing Photos` folder. The spreadsheet row also contains clickable Drive URLs in `photoLinks`.
- The hidden `_SyncLog` sheet is used by the PWA to confirm that an upload completed. Do not delete it.

## Security notes
- Keep the Apps Script URL and sync key private.
- Drive photos are private by default; sharing the spreadsheet does not automatically grant access to Drive photos.
- Anyone who can access the Apps Script deployment URL can call its endpoint, but write operations require the secret key. For a production multi-user app, use a proper authenticated backend.

## PWA hosting / update
Upload the contents of this folder to your existing HTTPS host, replacing the old files. Keep `index.html`, `app.js`, `sw.js`, `Code.gs`, `manifest.webmanifest` and the icons together in the same folder. Reload the PWA while online; the service worker cache version is updated to v2.
