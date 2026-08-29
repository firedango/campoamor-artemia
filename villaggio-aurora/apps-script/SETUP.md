# Villaggio Aurora · Attivazione integrazione Google Sheet ↔ Dashboard

## Architettura
- **Google Sheet** = database unico e modificabile.
- **Apps Script Web App** = interfaccia Admin protetta per inserire/modificare fornitori, preventivi, contatti e ordini.
- **GitHub** = dashboard pubblica in sola lettura.
- **Apps Script → GitHub API** = sincronizzazione automatica del database in JSON dopo ogni modifica.

## 1. Apri il Google Sheet
Apri `VILLAGGIO AURORA - VILLINO 1 - DATABASE MATERIALI`.

## 2. Crea il progetto Apps Script collegato al foglio
Nel Google Sheet: **Estensioni → Apps Script**.

Nel progetto:
1. sostituisci il contenuto di `Code.gs` con il file `apps-script/Code.gs` di questo repository;
2. crea un file HTML chiamato `Admin`;
3. incolla dentro `apps-script/Admin.html`.

## 3. Crea un GitHub fine-grained Personal Access Token
Su GitHub crea un token fine-grained limitato al repository `firedango/campoamor-artemia`.
Permesso richiesto sul repository:
- **Contents: Read and write**

Non inserire mai il token nel codice HTML o in GitHub Pages.

## 4. Salva le Script Properties
In Apps Script: **Project Settings → Script Properties**.
Aggiungi:
- `GITHUB_TOKEN` = il token GitHub creato sopra
- `ALLOWED_EMAILS` = elenco email autorizzate separate da virgola

Esempio:
`nome@azienda.it,altro@azienda.it`

## 5. Imposta il fuso orario
In **Project Settings**, imposta il fuso orario su **Europe/Rome**.

## 6. Prima autorizzazione
Dall'editor Apps Script esegui manualmente la funzione:
`syncToGitHub`

Google chiederà autorizzazioni per:
- leggere/scrivere il foglio;
- effettuare richieste esterne verso GitHub.

Dopo l'autorizzazione, verifica che GitHub contenga:
- `villaggio-aurora/data/database.json`
- `villaggio-aurora/data/materiali.json`

## 7. Installa i trigger
Esegui manualmente una volta:
`installTriggers`

Questo crea:
- trigger **onEdit installabile**: sincronizza quando cambiano i fogli gestiti;
- trigger **ogni ora**: sincronizzazione di sicurezza.

## 8. Pubblica la Web App Admin
Apps Script: **Deploy → New deployment → Web app**.
Impostazioni consigliate:
- **Execute as:** User accessing the web app
- **Who has access:** utenti autorizzati del dominio/account Google appropriato

Con questa modalità la pagina Admin richiede login Google e il backend controlla anche `ALLOWED_EMAILS`.

Conserva l'URL `/exec`: sarà la dashboard gestionale privata.

## 9. Uso quotidiano
### Da Google Sheet
Modifica direttamente i dati. Il trigger aggiorna GitHub.

### Da Dashboard Admin
Puoi creare/modificare:
- FORNITORI
- PREVENTIVI
- ORDINI
- CONTATTI

Ogni salvataggio scrive sul Google Sheet e subito dopo aggiorna i JSON su GitHub.

## Relazioni dati
- `MATERIE_PRIME.ID` ↔ `PREVENTIVI.Materiale_ID`
- `FORNITORI.Fornitore_ID` ↔ `PREVENTIVI.Fornitore_ID`
- `FORNITORI.Fornitore_ID` ↔ `CONTATTI.Fornitore_ID`
- `PREVENTIVI.Preventivo_ID` ↔ `ORDINI.Preventivo_ID`
- `FORNITORI.Fornitore_ID` ↔ `ORDINI.Fornitore_ID`
- `MATERIE_PRIME.ID` ↔ `ORDINI.Materiale_ID`

## Sicurezza
La dashboard GitHub pubblica non contiene token né credenziali di scrittura. La scrittura passa esclusivamente dalla Web App Apps Script autenticata.
