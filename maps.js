// maps.js — logica Google Maps

let mappa
let selectedPlace = null
let markerSelezionato = null
let posizioneUtente = null
const markers = {}

// Colori pin per livello
function colorePin(livello) {
  return { Eccellente: '#43A047', Buono: '#FFB300', Sufficiente: '#FB8C00', Scarso: '#E53935' }[livello] || '#00897B'
}

// Pin a forma di "bimbo sul fasciatoio" — sagoma arrotondata con iconina
function creaPinSvg(livello) {
  const c = colorePin(livello)
  const el = document.createElement('div')
  el.style.cssText = 'cursor:pointer;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.28));transform-origin:bottom center;'
  el.innerHTML = `<svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- ombra sotto -->
    <ellipse cx="18" cy="44" rx="7" ry="2.5" fill="rgba(0,0,0,0.12)"/>
    <!-- corpo principale: goccia arrotondata -->
    <path d="M18 2C10.268 2 4 8.268 4 16C4 25.5 18 42 18 42C18 42 32 25.5 32 16C32 8.268 25.732 2 18 2Z"
          fill="${c}" stroke="white" stroke-width="2"/>
    <!-- cerchio interno chiaro -->
    <circle cx="18" cy="15" r="10" fill="rgba(255,255,255,0.18)"/>
    <!-- testa del bimbo -->
    <circle cx="18" cy="10.5" r="3.8" fill="white"/>
    <!-- corpo/fasciatoio (bimbo disteso) -->
    <rect x="9.5" y="16" width="17" height="3.5" rx="1.75" fill="white"/>
    <!-- piano fasciatoio -->
    <rect x="7.5" y="19.5" width="21" height="1.5" rx="0.75" fill="rgba(255,255,255,0.55)"/>
  </svg>`
  return el
}

// Inizializza la mappa usando importLibrary (async)
async function initMappa() {
  const { Map } = await google.maps.importLibrary('maps')
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
  const { PlaceAutocompleteElement } = await google.maps.importLibrary('places')

  const centroDef = { lat: 45.4641, lng: 9.1919 }

  mappa = new Map(document.getElementById('map'), {
    center: centroDef,
    zoom: 13,
    mapId: 'fasciatoio-map',
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
  })

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        posizioneUtente = userPos
        mappa.setCenter(userPos)

        const dot = document.createElement('div')
        dot.style.cssText = 'width:18px;height:18px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(66,133,244,0.2);'

        new AdvancedMarkerElement({
          position: userPos,
          map: mappa,
          title: 'La tua posizione',
          content: dot,
          zIndex: 999,
        })

        // Riordina la lista una volta nota la posizione
        riordinaLista()
      },
      () => console.log('Geolocalizzazione non disponibile')
    )
  }

  // PlaceAutocompleteElement per il form
  const placeAutocomplete = new PlaceAutocompleteElement({ componentRestrictions: { country: 'it' } })
  placeAutocomplete.id = 'place-autocomplete'
  const inputIndirizzo = document.getElementById('input-indirizzo')
  inputIndirizzo.parentNode.replaceChild(placeAutocomplete, inputIndirizzo)

  const onPlaceSelect = async (e) => {
    try {
      const place = e.place
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] })
      selectedPlace = { lat: place.location.lat(), lng: place.location.lng(), indirizzo: place.formattedAddress || place.displayName }
    } catch (err) {
      console.error('Errore fetchFields:', err)
    }
  }
  placeAutocomplete.addEventListener('gmp-placeselect', onPlaceSelect)
  placeAutocomplete.addEventListener('gmp-select', onPlaceSelect)

  window._AdvancedMarkerElement = AdvancedMarkerElement
  initApp()
}

initMappa()

// Aggiunge un marker colorato sulla mappa per un locale
function aggiungiMarker(locale) {
  const pinEl = creaPinSvg(locale.livello)

  const marker = new window._AdvancedMarkerElement({
    position: { lat: locale.lat, lng: locale.lng },
    map: mappa,
    title: locale.nome,
    content: pinEl,
    gmpClickable: true,
  })

  const infoWindow = new google.maps.InfoWindow({ content: buildPopup(locale) })

  marker.addEventListener('gmp-click', () => {
    if (markerSelezionato) markerSelezionato.close()
    infoWindow.open({ anchor: marker, map: mappa })
    markerSelezionato = infoWindow
  })

  markers[locale.id] = marker
}

// Costruisce il contenuto dell'InfoWindow
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
    <div style="max-width:230px;font-family:'Segoe UI',sans-serif;padding:2px 0">
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

// Centra la mappa su un locale specifico
function centraSuLocale(locale) {
  const sidebar = document.getElementById('sidebar')
  if (window.innerWidth <= 768) sidebar.classList.remove('aperto')

  setTimeout(() => {
    mappa.setCenter({ lat: locale.lat, lng: locale.lng })
    mappa.setZoom(16)
    if (markers[locale.id]) {
      google.maps.event.trigger(markers[locale.id], 'gmp-click')
      markers[locale.id].dispatchEvent(new Event('gmp-click'))
      // Apri direttamente
      if (markerSelezionato) markerSelezionato.close()
      const iw = new google.maps.InfoWindow({ content: buildPopup(locale) })
      iw.open({ anchor: markers[locale.id], map: mappa })
      markerSelezionato = iw
    }
  }, window.innerWidth <= 768 ? 350 : 0)
}

// Formula Haversine
function calcolaDistanzaKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Legge le coordinate dall'autocomplete o geocodifica il testo
async function getCoordinateDaAutocomplete() {
  if (selectedPlace) {
    const result = selectedPlace
    selectedPlace = null
    return result
  }

  const placeInput = document.getElementById('place-autocomplete')
  const testo = placeInput?.value || placeInput?.innerText || ''
  if (!testo.trim()) return null

  const { Geocoder } = await google.maps.importLibrary('geocoding')
  const geocoder = new Geocoder()
  try {
    const { results } = await geocoder.geocode({ address: testo, region: 'it' })
    if (results?.length) {
      return { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng(), indirizzo: results[0].formatted_address }
    }
  } catch (err) {
    console.error('Errore geocoding:', err)
  }
  return null
}
