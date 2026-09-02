# Architettura ARTEMIA

```text
Google Drive / Google Sheets
            │
            ▼
       Apps Script
            │
            ▼
 JSON nel repository GitHub
            │
            ▼
 Portale ARTEMIA ─┬─ Campoamor
                  └─ Villaggio Aurora
```

Il portale usa un catalogo dati (`data/projects.json`) e un componente di vista (`assets/js/project-card.js`). Ogni progetto possiede cartella, dati e viste propri. In questo modo nuove sezioni o nuovi progetti non richiedono modifiche alle dashboard esistenti.

Le dashboard storiche restano disponibili nei loro percorsi dedicati. La sincronizzazione Villaggio Aurora conserva anche lo snapshot legacy per evitare regressioni.
