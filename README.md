# FasciatoioMap 🗺️

Web app per trovare locali dotati di fasciatoio nelle vicinanze.

## Stack

- **Frontend**: HTML + Vanilla JS (niente framework per semplicità)
- **Mappa**: Google Maps JavaScript API
- **Geocoding**: Google Places API (autocomplete indirizzo)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## Funzionalità MVP

- [ ] Mappa interattiva con pin dei locali
- [ ] Aggiunta di un locale con fasciatoio (nome, indirizzo, note)
- [ ] Autocomplete indirizzo con Google Places
- [ ] Geolocalizzazione dell'utente per vedere i locali vicini
- [ ] Scheda locale con dettagli (note, accessibilità disabili)
- [ ] Filtro per distanza

## Struttura cartelle

```
fasciatoio-map/
├── index.html
├── app.js
├── style.css
├── supabase.js       # client e query Supabase
├── maps.js           # logica Google Maps
└── .env.example
```

## Setup locale

```bash
cp .env.example .env
# Inserisci le tue credenziali in .env
# Apri index.html con Live Server (VS Code) o equivalente
```

## Variabili d'ambiente

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=xxxx
GOOGLE_MAPS_API_KEY=xxxx
```

## Google Maps — API da abilitare

Nella Google Cloud Console, abilita queste tre API:
- Maps JavaScript API
- Places API
- Geocoding API

> ⚠️ Ricorda di restringere la API Key al dominio del tuo sito (es. `fasciatoiomap.vercel.app`)
