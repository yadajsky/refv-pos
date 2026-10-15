// Google Sheets receiver for REFV POS (v2)
// 1) Open your Google Sheet > Extensions > Apps Script. Delete old code, paste this, Save.
// 2) Deploy > New deployment > gear icon > "Web app"
//    Execute as: Me | Who has access: Anyone > Deploy (allow permissions when asked)
// 3) Copy the "Web app URL" (ends with /exec) into POS > Settings. NOT the Google Sheet link.
// If you change this code later: Deploy > Manage deployments > Edit > Version: New version > Deploy.

function doGet() {
  return ContentService.createTextOutput('REFV POS ready');
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName('Sales') || ss.insertSheet('Sales');
    if (sh.getLastRow() === 0) sh.appendRow(d.head);
    // skip orders that were already received (safe to re-send)
    const have = new Set(sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat().map(String) : []);
    const rows = d.rows.filter(r => !have.has(String(r[0])));
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}
