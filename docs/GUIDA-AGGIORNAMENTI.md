# ARTEMIA · Guida aggiornamenti

## Struttura

- `/index.html`: portale ARTEMIA e ingresso ai progetti.
- `/data/projects.json`: catalogo dei progetti mostrati nel portale.
- `/assets/`: componenti e stile condivisi del portale.
- `/campoamor/`: dashboard Campoamor esistente, preservata.
- `/villaggio-aurora/`: dashboard acquisti e controllo costi.
- `/villaggio-aurora/data/`: snapshot JSON pubblici.
- `/villaggio-aurora/apps-script/`: sincronizzazione Google Sheet → GitHub.

## Aggiornare i dati di Villaggio Aurora

1. Aprire il Google Sheet **VILLAGGIO AURORA - VILLINO 1 - DATABASE MATERIALI**.
2. Modificare le tabelle `MATERIE_PRIME`, `FORNITORI`, `PREVENTIVI`, `ORDINI`, `CONTATTI`, `PAGAMENTI`, `BANCHE` o `BUDGET`.
3. Apps Script genera `database.json` e mantiene anche `materiali.json` per compatibilità con la dashboard attuale.
4. Il trigger installabile aggiorna GitHub dopo una modifica e con un controllo orario.
5. Controllare nella dashboard la data “Ultimo aggiornamento”.

Le credenziali GitHub non vanno mai inserite nel codice: usare la proprietà Apps Script `GITHUB_TOKEN`. Limitare `ALLOWED_EMAILS` agli utenti autorizzati all'interfaccia amministrativa.

## Aggiornare Campoamor

Il Google Sheet **Campoamor - Dashboard Acquisizione** resta la sorgente per unità, prezzi e stati operativi. La dashboard esistente è stata mantenuta in `/campoamor/` per non alterarne design e funzioni. Il connettore in `/campoamor/apps-script/` esporta il tab `Dati Unità` in `/campoamor/data/dashboard.json`; se lo snapshot non è disponibile, la vista usa automaticamente i dati incorporati di sicurezza.

## Aggiungere un nuovo progetto

1. Creare una cartella dedicata, per esempio `/nuovo-progetto/`.
2. Tenere i dati in `/nuovo-progetto/data/`, separati dall'interfaccia.
3. Riutilizzare componenti e token visivi in `/assets/`.
4. Aggiungere una voce a `/data/projects.json` con `id`, `title`, `description`, `href`, `source`, `updated`, `status` e `accent`.
5. Collegare il relativo Google Sheet con Apps Script, producendo JSON versionato.

## Pubblicazione e recupero

Ogni snapshot e modifica al sito passa dal repository GitHub, quindi è verificabile e recuperabile. Prima della pubblicazione controllare che i file JSON siano validi e che i link ai Google Sheet puntino ai documenti corretti.
