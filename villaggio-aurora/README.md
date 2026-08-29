# Villaggio Aurora · Dashboard ArtemiA

Dashboard pubblica per il procurement del Villino 1.

## Architettura
- Google Sheet: database operativo e aggiornabile.
- `data/materiali.json`: snapshot dati usato dalla dashboard pubblica.
- `index.html`: interfaccia in stile Campoamor (navy / white / orange).

## Flusso operativo
1. Aggiornare quantità, benchmark e offerte nel Google Sheet.
2. Validare fornitore, trasporti, dazi/lead time dove rilevanti.
3. Sincronizzare lo snapshot `materiali.json`.
4. La dashboard GitHub riflette il nuovo snapshot senza modifiche strutturali.

> Nota: per una sincronizzazione completamente automatica Google Sheet → GitHub serve un'integrazione autenticata (es. Apps Script/GitHub Action con credenziali). La struttura attuale è già predisposta per aggiungerla.
