const CONFIG = {
  spreadsheetId: '1Ww-tO842qgSpyi9XPxJbB_0Yf15nOAlD9pQZ3c59BXA',
  sheetName: 'Dati Unità',
  repo: 'firedango/campoamor-artemia',
  branch: 'main',
  githubPath: 'campoamor/data/dashboard.json'
};

function syncToGitHub() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Impostare GITHUB_TOKEN nelle proprietà dello script.');
  const payload = buildDashboard_();
  upsertGitHubFile_(CONFIG.githubPath, JSON.stringify(payload, null, 2), 'Sync Campoamor dashboard data');
  PropertiesService.getScriptProperties().setProperty('LAST_SYNC', payload.updated);
  return payload;
}

function installTriggers() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (['installedOnEdit_', 'scheduledSync_'].includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('installedOnEdit_').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('scheduledSync_').timeBased().everyHours(1).create();
}

function installedOnEdit_(event) {
  if (event && event.range && event.range.getSheet().getName() === CONFIG.sheetName) syncToGitHub();
}

function scheduledSync_() {
  syncToGitHub();
}

function buildDashboard_() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  if (!sheet) throw new Error('Foglio non trovato: ' + CONFIG.sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift().map(value => String(value).trim());
  const records = rows.filter(row => row[0] && row[1]).map((row, index) => {
    const item = {};
    headers.forEach((header, column) => item[header] = row[column]);
    return {
      id: index + 1,
      building: item['Edificio'] || '',
      unit: item['Unità'] || '',
      category: item['Categoria'] || '',
      floor: item['Piano'] || '',
      description: item['Descrizione'] || '',
      status: item['Stato operativo'] || item['Stato fonte'] || '',
      listPrice: toNumber_(item['Prezzo listino (€)']),
      permuta: String(item['Permuta proposta'] || 'NO'),
      permutaValue: toNumber_(item['Valore permuta (€)']),
      salePrice: item['Prezzo vendita effettivo (€)'] === '' ? null : toNumber_(item['Prezzo vendita effettivo (€)']),
      notes: item['Note'] || '',
      source: item['Fonte'] || '',
      key: item['Chiave'] || (item['Edificio'] + '|' + item['Unità'])
    };
  });
  return {
    updated: new Date().toISOString(),
    spreadsheetUrl: ss.getUrl(),
    units: records
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
  const current = UrlFetchApp.fetch(api + '?ref=' + encodeURIComponent(CONFIG.branch), {
    method: 'get', headers, muteHttpExceptions: true
  });
  let sha = null;
  if (current.getResponseCode() === 200) sha = JSON.parse(current.getContentText()).sha;
  else if (current.getResponseCode() !== 404) throw new Error('GitHub GET ' + current.getResponseCode());
  const body = {
    message,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: CONFIG.branch
  };
  if (sha) body.sha = sha;
  const response = UrlFetchApp.fetch(api, {
    method: 'put',
    headers: Object.assign({}, headers, {'Content-Type': 'application/json'}),
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  if (![200, 201].includes(response.getResponseCode())) throw new Error('GitHub PUT ' + response.getResponseCode() + ': ' + response.getContentText());
}

function toNumber_(value) {
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  const normalized = String(value || '').replace(/\s/g, '').replace(/€/g, '').replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  return isFinite(number) ? number : 0;
}
