// Wholesale Sourcing Log: Google Sheets + private Google Drive photo storage.
// 1) Create a Google Sheet and a Drive folder for supplier/product photos.
// 2) Paste this file into Extensions > Apps Script.
// 3) Fill in the three constants below, then deploy as a Web app.
const SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const DRIVE_FOLDER_ID = "PASTE_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";
const SYNC_KEY = "REPLACE_WITH_A_LONG_RANDOM_SECRET";

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (body.token !== SYNC_KEY) return json_({ok:false,error:"Unauthorized"});
    if (!body.record || !body.record.id) return json_({ok:false,error:"Missing record"});
    const record = body.record;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const tabName = record.recordType === "product" ? "Products" : "Suppliers";
    let sh = ss.getSheetByName(tabName);
    if (!sh) sh = ss.insertSheet(tabName);
    const headers = ["id","recordType","category","market","floor","name","wechat","phone","price","moq","businessType","rating","shipping","notes","createdAt","syncedAt","photoCount","photoLinks"];
    if (sh.getLastRow() === 0) sh.appendRow(headers);
    else {
      if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
      sh.getRange(1,1,1,headers.length).setValues([headers]); // Upgrade the v1 header row if needed.
    }
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2,1,last-1,1).getValues().flat() : [];
    if (ids.includes(record.id)) {
      // Repair the sync log if an earlier request wrote the row but its confirmation was interrupted.
      let existingLog = ss.getSheetByName("_SyncLog");
      if (!existingLog) { existingLog = ss.insertSheet("_SyncLog"); existingLog.appendRow(["id","syncedAt","photoUrls"]); existingLog.hideSheet(); }
      const loggedIds = existingLog.getLastRow() > 1 ? existingLog.getRange(2,1,existingLog.getLastRow()-1,1).getValues().flat() : [];
      if (!loggedIds.includes(record.id)) existingLog.appendRow([record.id, new Date(), "[]"]);
      return json_({ok:true,alreadySynced:true,id:record.id});
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const photoUrls = [];
    (record.photos || []).forEach((photo, index) => {
      if (!photo.data) return;
      const encoded = String(photo.data).split(",").pop();
      const bytes = Utilities.base64Decode(encoded);
      const mime = photo.type || "image/jpeg";
      const safeName = String(photo.name || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g,"_");
      const blob = Utilities.newBlob(bytes, mime, record.id + "_" + (index+1) + "_" + safeName);
      const file = folder.createFile(blob); // Private by default: only people with Drive access can view it.
      photoUrls.push(file.getUrl());
    });
    const row = headers.map(k => {
      if (k === "syncedAt") return new Date();
      if (k === "photoCount") return photoUrls.length;
      if (k === "photoLinks") return photoUrls.join("\n");
      if (k === "photos") return "";
      return record[k] == null ? "" : record[k];
    });
    sh.appendRow(row);
    // Sync log lets the PWA verify completion using a lightweight JSONP status check.
    let log = ss.getSheetByName("_SyncLog");
    if (!log) { log = ss.insertSheet("_SyncLog"); log.appendRow(["id","syncedAt","photoUrls"]); log.hideSheet(); }
    log.appendRow([record.id, new Date(), JSON.stringify(photoUrls)]);
    return json_({ok:true,id:record.id,photoUrls:photoUrls});
  } catch (err) {
    return json_({ok:false,error:String(err)});
  }
}

// JSONP status endpoint: IDs are random UUIDs; no supplier data is returned here.
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== "status" || !p.id) return json_({ok:true,service:"Wholesale Sourcing Log"});
  const callback = String(p.callback || "");
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) return json_({ok:false,error:"Invalid callback"});
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const log = ss.getSheetByName("_SyncLog");
  let result = {synced:false,id:p.id};
  if (log && log.getLastRow() > 1) {
    const rows = log.getRange(2,1,log.getLastRow()-1,3).getValues();
    for (let i=rows.length-1;i>=0;i--) {
      if (String(rows[i][0]) === String(p.id)) {
        result = {synced:true,id:p.id,syncedAt:rows[i][1] ? new Date(rows[i][1]).getTime() : Date.now(),photoUrls:JSON.parse(rows[i][2] || "[]")};
        break;
      }
    }
  }
  return ContentService.createTextOutput(callback + "(" + JSON.stringify(result) + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
