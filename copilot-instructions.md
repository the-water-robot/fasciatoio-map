# Istruzioni per GitHub Copilot

## Progetto
FasciatoioMap — mappa collaborativa di locali con fasciatoio per genitori con bambini piccoli.

## Stack tecnico
- Vanilla JavaScript (ES6+), niente framework
- Google Maps JavaScript API per la mappa (caricata via script tag con API key)
- Google Places API per l'autocomplete degli indirizzi
- Supabase JS Client per il database (import da CDN)
- CSS puro, no Tailwind o Bootstrap
- Nessun bundler (niente Webpack/Vite), file serviti staticamente

## Convenzioni codice
- Usare `async/await` per le chiamate asincrone
- Commenti in italiano
- Nomi variabili in italiano o inglese, mai misti nello stesso file
- Funzioni piccole e con un solo scopo
- Gestire sempre gli errori con try/catch e mostrare un messaggio all'utente

## Struttura file
- `index.html` — layout e import degli script
- `style.css` — stili
- `supabase.js` — inizializzazione client e funzioni CRUD (caricaLocali, aggiungiLocale)
- `maps.js` — inizializzazione mappa, marker, infowindow, autocomplete
- `app.js` — logica principale, collega UI con supabase.js e maps.js

## Google Maps
- La mappa si inizializza in `initMap()` — funzione chiamata dal callback dello script tag
- Usare `google.maps.Map` con center sulla posizione utente (o Milano come fallback)
- Ogni locale è un `google.maps.Marker` con `google.maps.InfoWindow` per i dettagli
- L'autocomplete indirizzo usa `google.maps.places.Autocomplete` sul campo input
- Per aggiungere un locale, usare `geocoder.geocode()` solo se l'autocomplete non restituisce già le coordinate

## Database Supabase — tabella `locali`
```sql
id          uuid primary key default gen_random_uuid()
nome        text not null
indirizzo   text
lat         float8 not null
lng         float8 not null
note        text
accessibile boolean default false   -- fasciatoio accessibile disabili
aggiunto_da text                    -- nickname utente
created_at  timestamptz default now()
```

## Comportamento atteso
- La mappa si centra sulla posizione dell'utente al caricamento (fallback: Milano)
- I marker sulla mappa mostrano un InfoWindow con nome, indirizzo e note del locale
- Il form di aggiunta usa Google Places Autocomplete per l'indirizzo
- Le coordinate (lat/lng) vengono estratte dal risultato dell'Autocomplete
- Nessuna autenticazione per l'MVP — gli utenti aggiungono locali con un nickname

## Cosa NON fare
- Non usare Leaflet o OpenStreetMap
- Non installare npm packages — tutto via CDN o script tag
- Non aggiungere framework o librerie non elencate
- Non usare localStorage per dati persistenti — tutto su Supabase
- Non esporre la API Key di Google Maps in modo non protetto — usare restrizioni per dominio
