# Villaggio Aurora · Dashboard ArtemiA

Dashboard pubblica per il procurement del Villino 1.

## Architettura
- Google Sheet: database operativo e aggiornabile.
- Apps Script: sincronizzazione autenticata verso GitHub.
- `data/database.json`: modello esteso per materiali, fornitori, preventivi, ordini e contatti.
- `data/materiali.json`: snapshot compatibile con la dashboard pubblica esistente.
- `index.html`: vista di progetto in stile Campoamor (navy / white / orange).

## Flusso operativo
1. Aggiornare quantità, benchmark e offerte nel Google Sheet.
2. Validare fornitore, trasporti, dazi/lead time dove rilevanti.
3. Sincronizzare lo snapshot `materiali.json`.
4. La dashboard GitHub riflette il nuovo snapshot senza modifiche strutturali.

La configurazione completa dei trigger e delle proprietà protette è descritta in `apps-script/SETUP.md`.

Per l'architettura complessiva e l'aggiunta di nuovi progetti, vedere `../docs/GUIDA-AGGIORNAMENTI.md`.
