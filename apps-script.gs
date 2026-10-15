// Google Sheets receiver for REFV POS (v2)
// 1) Open your Google Sheet > Extensions > Apps Script. Delete old code, paste this, Save.
// 2) Deploy > New deployment > gear icon > "Web app"
//    Execute as: Me | Who has access: Anyone > Deploy (allow permissions when asked)
// 3) Copy the "Web app URL" (ends with /exec) into POS > Settings. NOT the Google Sheet link.
// If you change this code later: Deploy > Manage deployments > Edit > Version: New version > Deploy.

const HEAD = ["Order ID","Date","Time","Type","Flavors per cup","Flavor 1","Flavor 2","Category 1","Category 2","Payment","Amount (THB)"];

function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function readConfig() {
  const sh = ensureSheet('Config', ['key', 'value']);
  const values = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 2).getValues();
  const config = {};
  for (const [key, value] of values) {
    if (key) config[String(key).trim()] = value;
  }
  return config;
}

function writeConfig(key, value) {
  const sh = ensureSheet('Config', ['key', 'value']);
  const values = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 2).getValues();
  const idx = values.findIndex(row => String(row[0] || '').trim() === String(key).trim());
  if (idx >= 0) {
    sh.getRange(idx + 1, 2).setValue(value);
  } else {
    sh.appendRow([key, value]);
  }
}

function loadSalesAsOrders() {
  const sh = ensureSheet('Sales', HEAD);
  const values = sh.getRange(2, 1, Math.max(0, sh.getLastRow() - 1), HEAD.length).getValues();
  const map = new Map();

  for (const row of values) {
    const [id, date, time, type, cups, flavor1, flavor2, cat1, cat2, payment, amount] = row;
    if (!id) continue;
    const k = String(id).trim();
    if (!map.has(k)) {
      const ts = new Date(`${date} ${time || '00:00:00'}`).getTime();
      map.set(k, {
        id: k,
        ts,
        items: [],
        total: 0,
        pay: payment || 'cash',
        recv: amount || 0,
        synced: 1
      });
    }
    const order = map.get(k);
    order.items.push({
      type: type || 'gelato',
      cups: Number(cups) || 1,
      parts: [
        { name: flavor1 || '', cat: cat1 || 'Original', price: Number(amount) || 0 },
        ...(flavor2 ? [{ name: flavor2, cat: cat2 || 'Original', price: 0 }] : [])
      ]
    });
    order.total += Number(amount) || 0;
    order.recv = order.recv || 0;
  }

  return Array.from(map.values()).map(order => ({
    id: order.id,
    ts: order.ts,
    items: order.items,
    total: order.total,
    pay: order.pay,
    recv: order.recv,
    synced: 1
  }));
}

function doGet(e) {
  const mode = (e && e.parameter && e.parameter.mode) || 'health';

  if (mode === 'config') {
    const config = readConfig();
    return ContentService.createTextOutput(JSON.stringify({
      pp: String(config.pp || ''),
      updatedAt: Date.now()
    }));
  }

  if (mode === 'report') {
    const sales = loadSalesAsOrders();
    return ContentService.createTextOutput(JSON.stringify({ sales }));
  }

  return ContentService.createTextOutput('REFV POS ready');
}

function doPost(e) {
  try {
    const raw = e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    if (payload && payload.type === 'config') {
      if (payload.pp) writeConfig('pp', String(payload.pp).trim());
      return ContentService.createTextOutput('ok');
    }

    const d = payload;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName('Sales') || ss.insertSheet('Sales');
    if (sh.getLastRow() === 0) sh.appendRow(HEAD);

    const have = new Set(sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat().map(String) : []);
    const rows = Array.isArray(d.rows) ? d.rows.filter(r => !have.has(String(r[0]))) : [];
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}
