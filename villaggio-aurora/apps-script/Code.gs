const CONFIG = {
  spreadsheetId: '11_lzkUhFAhWblwPE7_uv9EvSfXTM6MF6FzuwCyniawY',
  repo: 'firedango/campoamor-artemia',
  branch: 'main',
  githubDataPath: 'villaggio-aurora/data/database.json',
  githubLegacyPath: 'villaggio-aurora/data/materiali.json',
  materialSheet: 'MATERIE_PRIME',
  materialHeaderRow: 10,
  tables: {
    FORNITORI: { headerRow: 1, prefix: 'FOR' },
    PREVENTIVI: { headerRow: 1, prefix: 'PRE' },
    ORDINI: { headerRow: 1, prefix: 'ORD' },
    CONTATTI: { headerRow: 1, prefix: 'CON' }
  }
};

function doGet() {
  return HtmlService.createTemplateFromFile('Admin')
    .evaluate()
    .setTitle('Villaggio Aurora · Gestione Procurement')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getBootstrapData() {
  assertAuthorized_();
  return buildDatabase_();
}

function saveRecord(tableName, record) {
  assertAuthorized_();
  if (!CONFIG.tables[tableName]) throw new Error('Tabella non consentita: ' + tableName);
  const sheet = getSpreadsheet_().getSheetByName(tableName);
  if (!sheet) throw new Error('Foglio non trovato: ' + tableName);

  const headerRow = CONFIG.tables[tableName].headerRow;
  const headers = getHeaders_(sheet, headerRow);
  const idHeader = headers[0];
  const now = new Date();
  const normalized = Object.assign({}, record || {});
  if (!normalized[idHeader]) normalized[idHeader] = makeId_(CONFIG.tables[tableName].prefix);

  if (tableName === 'FORNITORI' && headers.includes('Creato il') && !normalized['Creato il']) normalized['Creato il'] = now;
  if (tableName === 'ORDINI' && headers.includes('Aggiornato il')) normalized['Aggiornato il'] = now;

  const existingRow = findRowById_(sheet, headerRow, normalized[idHeader]);
  const values = headers.map(h => serializeCellValue_(normalized[h]));
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, headers.length).setValues([values]);
  } else {
    const nextRow = Math.max(sheet.getLastRow() + 1, headerRow + 1);
    sheet.getRange(nextRow, 1, 1, headers.length).setValues([values]);
  }

  if (tableName === 'PREVENTIVI') recalcQuote_(normalized);
  SpreadsheetApp.flush();
  syncToGitHub();
  return { ok: true, id: normalized[idHeader], table: tableName };
}

function deleteRecord(tableName, id) {
  assertAuthorized_();
  if (!CONFIG.tables[tableName]) throw new Error('Tabella non consentita: ' + tableName);
  const sheet = getSpreadsheet_().getSheetByName(tableName);
  const headerRow = CONFIG.tables[tableName].headerRow;
  const row = findRowById_(sheet, headerRow, id);
  if (!row) throw new Error('Record non trovato: ' + id);
  sheet.deleteRow(row);
  SpreadsheetApp.flush();
  syncToGitHub();
  return { ok: true };
}

function syncToGitHub() {
  assertAuthorized_();
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Manca GITHUB_TOKEN nelle Script Properties.');

  const db = buildDatabase_();
  const databaseText = JSON.stringify(db, null, 2);
  upsertGitHubFile_(CONFIG.githubDataPath, databaseText, 'Sync Villaggio Aurora database');

  // Compatibilità con la dashboard attuale: manteniamo anche materiali.json.
  const legacy = buildLegacyMateriali_(db);
  upsertGitHubFile_(CONFIG.githubLegacyPath, JSON.stringify(legacy, null, 2), 'Sync Villaggio Aurora materiali');

  props.setProperty('LAST_SYNC_ISO', new Date().toISOString());
  return { ok: true, updated: db.updated };
}

function installTriggers() {
  assertAuthorized_();
  const ss = getSpreadsheet_();
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['installedOnEdit_', 'scheduledSync_'].includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('installedOnEdit_').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('scheduledSync_').timeBased().everyHours(1).create();
  return { ok: true };
}

function installedOnEdit_(e) {
  try {
    const sheetName = e && e.range && e.range.getSheet().getName();
    if (!sheetName) return;
    const watched = [CONFIG.materialSheet].concat(Object.keys(CONFIG.tables));
    if (!watched.includes(sheetName)) return;
    syncToGitHub();
  } catch (err) {
    console.error(err);
  }
}

function scheduledSync_() {
  try { syncToGitHub(); } catch (err) { console.error(err); }
}

function buildDatabase_() {
  const ss = getSpreadsheet_();
  const materiali = readTable_(ss.getSheetByName(CONFIG.materialSheet), CONFIG.materialHeaderRow);
  const fornitori = readTable_(ss.getSheetByName('FORNITORI'), 1);
  const preventivi = readTable_(ss.getSheetByName('PREVENTIVI'), 1);
  const ordini = readTable_(ss.getSheetByName('ORDINI'), 1);
  const contatti = readTable_(ss.getSheetByName('CONTATTI'), 1);

  return {
    project: 'Villaggio Aurora',
    unit: 'Villino 1',
    spreadsheetId: CONFIG.spreadsheetId,
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + CONFIG.spreadsheetId + '/edit',
    updated: new Date().toISOString(),
    materiali,
    fornitori,
    preventivi,
    ordini,
    contatti,
    stats: computeStats_(materiali, fornitori, preventivi, ordini)
  };
}

function readTable_(sheet, headerRow) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= headerRow || lastCol === 0) return [];
  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0].map(v => String(v).trim());
  const values = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, lastCol).getValues();
  return values
    .filter(row => row.some(v => v !== '' && v !== null))
    .map(row => {
      const out = {};
      headers.forEach((h, i) => { if (h) out[h] = normalizeOutput_(row[i]); });
      return out;
    });
}

function computeStats_(materiali, fornitori, preventivi, ordini) {
  const money = key => materiali.reduce((s, r) => s + toNumber_(r[key]), 0);
  return {
    materiali: materiali.length,
    fornitori: fornitori.length,
    preventivi: preventivi.length,
    ordini: ordini.length,
    totaleMaterialiNetto: money('Totale netto IVA'),
    preventiviAperti: preventivi.filter(r => !['Scartato', 'Accettato'].includes(String(r['Stato'] || ''))).length,
    ordiniAperti: ordini.filter(r => !['Consegnato', 'Annullato'].includes(String(r['Stato'] || ''))).length
  };
}

function buildLegacyMateriali_(db) {
  const items = db.materiali.map(r => ({
    scenario: r['Scenario'] || '',
    categoria: r['Categoria'] || '',
    prodotto: r['Voce materiale / prodotto riferimento'] || '',
    codice: r['Codice Tecnomat'] || '',
    quantita: toNumber_(r['Q.tà da acquistare'] || r['Quantità CME']),
    formato: r['Formato acquisto'] || r['UM CME'] || '',
    prezzoNetto: toNumber_(r['Prezzo unit. netto IVA']),
    totaleNetto: toNumber_(r['Totale netto IVA']),
    fornitore: r['Fornitore'] || '',
    stato: r['Stato sourcing'] || 'Da cercare',
    fonte: r['Fonte prezzo'] || '#'
  }));
  const sums = scenario => items.filter(x => scenario === 'COMUNE' ? x.scenario === 'COMUNE' : ['COMUNE', scenario].includes(x.scenario)).reduce((s,x)=>s+x.totaleNetto,0);
  const comuni = sums('COMUNE'), malta = sums('MALTA'), gesso = sums('GESSO');
  const cat = {};
  items.forEach(x => cat[x.categoria] = (cat[x.categoria] || 0) + x.totaleNetto);
  return {
    updated: db.updated,
    googleSheet: db.spreadsheetUrl,
    kpi: { comuni, malta, gesso, delta: gesso - malta },
    categorie: Object.entries(cat).map(([categoria, totale]) => ({categoria, totale})).sort((a,b)=>b.totale-a.totale),
    materiali: items
  };
}

function upsertGitHubFile_(path, content, message) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  const api = 'https://api.github.com/repos/' + CONFIG.repo + '/contents/' + path;
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  let sha = null;
  const getResp = UrlFetchApp.fetch(api + '?ref=' + encodeURIComponent(CONFIG.branch), {
    method: 'get', headers, muteHttpExceptions: true
  });
  if (getResp.getResponseCode() === 200) sha = JSON.parse(getResp.getContentText()).sha;
  else if (getResp.getResponseCode() !== 404) throw new Error('GitHub GET ' + getResp.getResponseCode() + ': ' + getResp.getContentText());

  const body = {
    message,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: CONFIG.branch
  };
  if (sha) body.sha = sha;
  const putResp = UrlFetchApp.fetch(api, {
    method: 'put', headers: Object.assign({}, headers, {'Content-Type':'application/json'}),
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (![200, 201].includes(putResp.getResponseCode())) throw new Error('GitHub PUT ' + putResp.getResponseCode() + ': ' + putResp.getContentText());
}

function recalcQuote_(record) {
  // Il valore landed viene comunque ricalcolato in output; qui normalizziamo il record ricevuto.
  const p = toNumber_(record['Totale netto']);
  const t = toNumber_(record['Trasporto']);
  const d = toNumber_(record['Dazi']);
  const a = toNumber_(record['Altri costi']);
  record['Costo landed'] = p + t + d + a;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(CONFIG.spreadsheetId);
}

function getHeaders_(sheet, headerRow) {
  return sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(v => String(v).trim());
}

function findRowById_(sheet, headerRow, id) {
  if (!id || sheet.getLastRow() <= headerRow) return null;
  const vals = sheet.getRange(headerRow + 1, 1, sheet.getLastRow() - headerRow, 1).getDisplayValues().flat();
  const idx = vals.findIndex(v => String(v) === String(id));
  return idx < 0 ? null : headerRow + 1 + idx;
}

function makeId_(prefix) {
  return prefix + '-' + Utilities.getUuid().split('-')[0].toUpperCase();
}

function toNumber_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (!v) return 0;
  const s = String(v).replace(/\s/g,'').replace(/€/g,'').replace(/\./g,'').replace(',','.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

function serializeCellValue_(v) {
  if (v === undefined || v === null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return v;
  return v;
}

function normalizeOutput_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  return v;
}

function assertAuthorized_() {
  const props = PropertiesService.getScriptProperties();
  const allowed = (props.getProperty('ALLOWED_EMAILS') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) throw new Error('Accesso Google richiesto.');
  if (allowed.length && !allowed.includes(email)) throw new Error('Utente non autorizzato: ' + email);
}
