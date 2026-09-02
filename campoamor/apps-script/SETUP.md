# Campoamor · sincronizzazione Google Sheet → dashboard

1. Nel Google Sheet **Campoamor - Dashboard Acquisizione**, aprire **Estensioni → Apps Script**.
2. Copiare il contenuto di `Code.gs` nel progetto Apps Script.
3. In **Impostazioni progetto → Proprietà script**, aggiungere `GITHUB_TOKEN` con un token limitato al repository `firedango/campoamor-artemia` e al solo contenuto.
4. Eseguire una volta `syncToGitHub` e autorizzare lo script.
5. Eseguire una volta `installTriggers`.

Lo script aggiorna `campoamor/data/dashboard.json` quando cambia il tab `Dati Unità` e svolge anche un controllo orario. La dashboard continua a usare i dati incorporati se lo snapshot non è raggiungibile, così un errore temporaneo di sincronizzazione non blocca il sito.
