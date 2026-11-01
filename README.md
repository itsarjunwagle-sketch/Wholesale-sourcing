# Wholesale Sourcing Log — iPhone PWA

An offline-first Progressive Web App for recording clothing and electronics suppliers, product samples, prices, MOQ, WeChat contacts, notes and photos.

## What's included
- Local IndexedDB storage: records and photos stay on the device.
- Supplier and product records, clothing/electronics categories, market/floor/shop fields.
- Search and filter records.
- CSV export and full JSON backup/restore (including photos).
- Optional Google Sheets sync endpoint using Google Apps Script.
- PWA manifest and service worker for Home Screen installation/offline app shell.

## Important limitations in this first version
- Host the app over HTTPS before installing it as a PWA. Opening `index.html` as a file does not enable service workers.
- Open the hosted app once while online so the app shell is cached. Then test airplane mode before travelling.
- The sync request uses a browser cross-origin `no-cors` POST. The app cannot read Google's response, so it intentionally does not mark local records as synced automatically. Check the Google Sheet after sending. This avoids falsely claiming that a record was saved.
- Photos are stored locally and included in JSON backup. The initial Sheets connector stores the photo count, not image files. A later version can upload photos to Google Drive.
- Browser storage can be cleared by iOS under storage management. Export a full JSON backup regularly.

## Install on iPhone
1. Upload this folder to an HTTPS static host (for example, a private GitHub Pages repository or another HTTPS host).
2. Open the HTTPS address in Safari on iPhone.
3. Wait for the page to load completely once.
4. Tap Share → Add to Home Screen → Add.
5. Launch from the Home Screen.
6. Test adding a supplier, taking a photo, closing the app, reopening it, and switching on Airplane Mode.

## Set up Google Sheets sync
1. Create a Google spreadsheet.
2. Copy its spreadsheet ID from its URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.
3. Open Extensions → Apps Script.
4. Replace the starter code with `Code.gs` from this package.
5. Set `SHEET_ID` and replace `SYNC_KEY` with a long random secret.
6. Deploy → New deployment → Web app.
7. Execute as: Me. Set access to the narrowest setting that permits your use. If using "Anyone", protect the endpoint with the secret key and do not share the URL/key.
8. Copy the deployed `/exec` URL.
9. In the app, open Sync & backup, paste the URL and the same sync key, then save.
10. Tap Send pending records when you have a working connection. Check the Suppliers and Products tabs in the spreadsheet.

## Data fields
Record ID, type, category, market, floor/shop, name, WeChat, phone, price (RMB), MOQ, business type, rating, shipping, notes, created time, sync status and photo count.

## Backups
- CSV: spreadsheet-friendly text records, no photos.
- Full JSON: records plus photos. Store securely because it contains supplier contact information and product images.
