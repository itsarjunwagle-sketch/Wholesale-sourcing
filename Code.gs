// Google Apps Script endpoint for Wholesale Sourcing Log.
// Create a Google Sheet, open Extensions > Apps Script, paste this code.
// Set SHEET_ID and SYNC_KEY below, then Deploy > New deployment > Web app.
// Execute as: Me. Who has access: Anyone (or the narrowest option that works for you).
// Keep the deployment URL and SYNC_KEY private.
const SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const SYNC_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (body.token !== SYNC_KEY) return json_({ok:false,error:"Unauthorized"});
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const records = body.records || [];
    const names = ["Suppliers","Products"];
    names.forEach(n => { if (!ss.getSheetByName(n)) ss.insertSheet(n); });
    const headers = ["id","recordType","category","market","floor","name","wechat","phone","price","moq","businessType","rating","shipping","notes","createdAt","syncedAt","photoCount"];
    records.forEach(r => {
      const tab = r.recordType === "product" ? "Products" : "Suppliers";
      const sh = ss.getSheetByName(tab);
      if (sh.getLastRow() === 0) sh.appendRow(headers);
      const ids = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat() : [];
      if (ids.includes(r.id)) return; // avoid duplicate rows on retries
      sh.appendRow(headers.map(k => k === "syncedAt" ? new Date() : k === "photoCount" ? ((r.photos || []).length) : (r[k] == null ? "" : r[k])));
    });
    return json_({ok:true,received:records.length});
  } catch (err) {
    return json_({ok:false,error:String(err)});
  }
}
function doGet() { return json_({ok:true,service:"Wholesale Sourcing Log sync endpoint"}); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }