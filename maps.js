// maps.js — logica mappa OpenStreetMap + Leaflet

let mappa
let selectedPlace = null
let markerSelezionato = null
let posizioneUtente = null
const markers = {}

// Colori pin per livello
function colorePin(livello) {
  return { Eccellente: '#43A047', Buono: '#FFB300', Sufficiente: '#FB8C00', Scarso: '#E53935' }[livello] || '#00897B'
}

// Pin SVG come DivIcon Leaflet
function creaPinIcon(livello) {
  const c = colorePin(livello)
  return L.divIcon({
    className: '',
    iconSize: [36, 46],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38],
    html: `<div style="cursor:pointer;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.28));">
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="44" rx="7" ry="2.5" fill="rgba(0,0,0,0.12)"/>
        <path d="M18 2C10.268 2 4 8.268 4 16C4 25.5 18 42 18 42C18 42 32 25.5 32 16C32 8.268 25.732 2 18 2Z"
              fill="${c}" stroke="white" stroke-width="2"/>
        <circle cx="18" cy="15" r="10" fill="rgba(255,255,255,0.18)"/>
        <circle cx="18" cy="10.5" r="3.8" fill="white"/>
        <rect x="9.5" y="16" width="17" height="3.5" rx="1.75" fill="white"/>
        <rect x="7.5" y="19.5" width="21" height="1.5" rx="0.75" fill="rgba(255,255,255,0.55)"/>
      </svg>
    </div>`
  })
}

// Init mappa Leaflet
function initMappa() {
  const centroDef = [45.4641, 9.1919]

  mappa = L.map('map', {
    center: centroDef,
    zoom: 13,
    zoomControl: false,
  })

  L.control.zoom({ position: 'bottomright' }).addTo(mappa)

  // CartoDB Voyager — clean, moderno, ottimo per pin colorati
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  }).addTo(mappa)

  // Geolocalizzazione
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        posizioneUtente = userPos
        mappa.setView([userPos.lat, userPos.lng], 13)

        L.circleMarker([userPos.lat, userPos.lng], {
          radius: 8,
          fillColor: '#4285F4',
          color: 'white',
          weight: 3,
          fillOpacity: 1,
        }).addTo(mappa)

        riordinaLista()
      },
      () => console.log('Geolocalizzazione non disponibile')
    )
  }

  setupAutocompleteIndirizzo()
  initApp()
}

// ── Autocomplete indirizzo con Nominatim ────────────────────────────────────

function setupAutocompleteIndirizzo() {
  const input = document.getElementById('input-indirizzo')
  if (!input) return

  const dropdown = document.createElement('div')
  dropdown.className = 'autocomplete-dropdown nascosto'
  input.parentNode.style.position = 'relative'
  input.parentNode.appendChild(dropdown)

  let debounceTimer

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    selectedPlace = null
    const q = input.value.trim()
    if (q.length < 3) { dropdown.classList.add('nascosto'); return }
    debounceTimer = setTimeout(() => cercaIndirizzo(q, dropdown, input), 350)
  })

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('nascosto')
    }
  })
}

async function cercaIndirizzo(query, dropdown, input) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=it&limit=5&addressdetails=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'FasciatoioMap/1.0' } })
    const results = await res.json()

    if (!results.length) { dropdown.classList.add('nascosto'); return }

    dropdown.innerHTML = ''
    results.forEach(r => {
      const item = document.createElement('div')
      item.className = 'autocomplete-item'
      item.textContent = r.display_name
      item.addEventListener('click', () => {
        input.value = r.display_name
        selectedPlace = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), indirizzo: r.display_name }
        dropdown.classList.add('nascosto')
      })
      dropdown.appendChild(item)
    })
    dropdown.classList.remove('nascosto')
  } catch (err) {
    console.error('Errore ricerca indirizzo:', err)
  }
}

// ── Marker e popup ──────────────────────────────────────────────────────────

function aggiungiMarker(locale) {
  const marker = L.marker([locale.lat, locale.lng], { icon: creaPinIcon(locale.livello) })
    .addTo(mappa)
    .bindPopup(buildPopup(locale), { maxWidth: 250, className: 'popup-fasciatoio' })

  marker.on('click', () => { markerSelezionato = marker })

  markers[locale.id] = marker
}

function buildPopup(locale) {
  const c = colorePin(locale.livello)

  let distanzaHtml = ''
  if (posizioneUtente) {
    const km = calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, locale.lat, locale.lng)
    const kmStr = km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`
    const min = Math.round(km / 5 * 60)
    let piediStr
    if (min < 1) piediStr = ' · 🚶 < 1 min'
    else if (min < 60) piediStr = ` · 🚶 ${min} min`
    else { const h = Math.floor(min/60), m = min%60; piediStr = ` · 🚶 ${h}h${m>0?' '+m+'min':''}` }
    distanzaHtml = `<p style="margin-top:6px;font-size:0.8rem;color:#555"><strong style="color:${c}">${kmStr}</strong>${piediStr} da te</p>`
  }

  const dotazioniHtml = locale.dotazioni?.length
    ? `<p style="margin-top:5px;font-size:0.78rem;color:#777">${locale.dotazioni.join(' · ')}</p>`
    : ''

  const badgeLivello = locale.livello
    ? `<span style="font-size:0.72rem;background:${c}20;color:${c};padding:2px 8px;border-radius:10px;font-weight:600;display:inline-block;margin-top:4px">${locale.livello}</span>`
    : ''

  const badgeTipo = locale.tipo
    ? `<span style="font-size:0.72rem;background:#f0f0f0;color:#666;padding:2px 8px;border-radius:10px;display:inline-block;margin-top:4px;margin-right:4px">${locale.tipo}</span>`
    : ''

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${locale.lat},${locale.lng}&travelmode=walking`

  return `
    <div style="font-family:'Segoe UI',sans-serif;padding:2px 0">
      <strong style="font-size:0.95rem;color:#222">${locale.nome}</strong><br/>
      <span style="color:#999;font-size:0.8rem">${locale.indirizzo || ''}</span>
      <div style="margin-top:5px">${badgeTipo}${badgeLivello}</div>
      ${dotazioniHtml}
      ${locale.note ? `<p style="margin-top:6px;font-size:0.82rem;color:#555">${locale.note}</p>` : ''}
      ${distanzaHtml}
      <a href="${mapsUrl}" target="_blank" rel="noopener"
         style="display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:6px 12px;background:#00897B;color:white;border-radius:20px;font-size:0.78rem;font-weight:600;text-decoration:none;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        Indicazioni
      </a>
    </div>
  `
}

// ── Navigazione mappa ───────────────────────────────────────────────────────

function centraSuLocale(locale) {
  const sidebar = document.getElementById('sidebar')
  if (window.innerWidth <= 768) sidebar.classList.remove('aperto')

  setTimeout(() => {
    mappa.setView([locale.lat, locale.lng], 16)
    if (markers[locale.id]) {
      markers[locale.id].openPopup()
      markerSelezionato = markers[locale.id]
    }
  }, window.innerWidth <= 768 ? 350 : 0)
}

// ── Haversine ───────────────────────────────────────────────────────────────

function calcolaDistanzaKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Geocodifica Nominatim ───────────────────────────────────────────────────

async function getCoordinateDaAutocomplete() {
  if (selectedPlace) {
    const result = selectedPlace
    selectedPlace = null
    return result
  }

  const input = document.getElementById('input-indirizzo')
  const testo = input?.value?.trim() || ''
  if (!testo) return null

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(testo)}&countrycodes=it&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'FasciatoioMap/1.0' } })
    const results = await res.json()
    if (results.length) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), indirizzo: results[0].display_name }
    }
  } catch (err) {
    console.error('Errore geocoding:', err)
  }
  return null
}

// ── Boot ────────────────────────────────────────────────────────────────────

initMappa()
