# Villaggio Aurora · Dashboard ArtemiA

Dashboard pubblica per il procurement del Villino 1 e per i dati metrici delle prime quattro villette.

## Architettura
- Google Sheet: database operativo e aggiornabile.
- Apps Script: sincronizzazione autenticata verso GitHub.
- `data/database.json`: modello esteso per materiali, fornitori, preventivi, ordini e contatti.
- `data/materiali.json`: snapshot compatibile con la dashboard pubblica esistente.
- `index.html`: vista di progetto in stile Campoamor (navy / white / orange).
- `metriche/index.html`: dashboard a schede per pavimenti, serramenti, RFQ e avanzamento ordine.
- `data/metriche.json`: trascrizione strutturata del file `DATI METRICI GRONTARDO 1.ods`.
- `benchmark-serramenti/index.html`: confronto fornitori e scenario di costo Villino 1–4.
- `data/benchmark-serramenti.json`: fonti, contatti e benchmark pubblici verificati.

## Flusso operativo
1. Aggiornare quantità, benchmark e offerte nel Google Sheet.
2. Validare fornitore, trasporti, dazi/lead time dove rilevanti.
3. Sincronizzare lo snapshot `materiali.json`.
4. La dashboard GitHub riflette il nuovo snapshot senza modifiche strutturali.

## Metriche e RFQ
- Le superfici restano distinte tra interne e non residenziali.
- I serramenti restano distinti per categoria, misura, quantità e villetta.
- Le caratteristiche tecniche e le pratiche RFQ vengono salvate nel browser del dispositivo.
- La valutazione abilita la preparazione dell'ordine solo quando soglia economica e criteri configurati risultano soddisfatti.
- La dashboard non invia automaticamente richieste o ordini ai fornitori.

## Benchmark serramenti, porte e ringhiere
- Il target serramenti è modificabile e si applica soltanto ai serramenti esterni.
- Porte esterne a battente e basculanti sono calcolate come categorie separate.
- Prezzi pubblici, cataloghi, contatti e fotografie restano collegati alla fonte ufficiale.
- La graduatoria fornitori è preliminare fino al confronto di offerte omogenee rese a Grontardo.

La configurazione completa dei trigger e delle proprietà protette è descritta in `apps-script/SETUP.md`.

Per l'architettura complessiva e l'aggiunta di nuovi progetti, vedere `../docs/GUIDA-AGGIORNAMENTI.md`.
