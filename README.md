# FrigoHub PWA Demo

Prototype pubblico mobile-first per la consultazione di casi tecnici HVAC.

## Demo

Questa versione usa esclusivamente dati dimostrativi salvati nel browser del
singolo dispositivo. Non contiene credenziali, database, API private o dati di
clienti.

## Avvio locale

Avviare un server statico nella cartella del progetto:

```powershell
python -m http.server 4173
```

Poi aprire:

```text
http://127.0.0.1:4173
```

## Deploy Vercel

Importare il repository in Vercel con:

```text
Framework Preset: Other
Root Directory: ./
Build Command: vuoto
Output Directory: .
Install Command: vuoto
```

## Nota

Il backend condiviso verrà collegato in una fase successiva. La demo attuale è
pensata per validare interfaccia e flussi.
