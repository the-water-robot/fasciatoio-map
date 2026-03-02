// maps.js — logica Google Maps

let mappa
let selectedPlace = null
let markerSelezionato = null
const markers = {}

// Inizializza la mappa usando importLibrary (async)
async function initMappa() {
  const { Map } = await google.maps.importLibrary('maps')
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker')
  const { Place, PlaceAutocompleteElement } = await google.maps.importLibrary('places')

  // Centro di default: Milano
  const centroDef = { lat: 45.4641, lng: 9.1919 }

  mappa = new Map(document.getElementById('map'), {
    center: centroDef,
    zoom: 13,
    mapId: 'fasciatoio-map',
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
  })

  // Prova a centrare sulla posizione dell'utente e mostra marker
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        mappa.setCenter(userPos)

        const dot = document.createElement('div')
        dot.style.cssText = 'width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(66,133,244,0.5);'

        new AdvancedMarkerElement({
          position: userPos,
          map: mappa,
          title: 'La tua posizione',
          content: dot,
          zIndex: 999,
        })
      },
      () => console.log('Geolocalizzazione non disponibile, uso Milano come default')
    )
  }

  // Inizializza PlaceAutocompleteElement
  const placeAutocomplete = new PlaceAutocompleteElement({
    componentRestrictions: { country: 'it' },
  })
  placeAutocomplete.id = 'place-autocomplete'

  const inputIndirizzo = document.getElementById('input-indirizzo')
  inputIndirizzo.parentNode.replaceChild(placeAutocomplete, inputIndirizzo)

  placeAutocomplete.addEventListener('gmp-placeselect', async (e) => {
    try {
      const place = e.place
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] })
      selectedPlace = {
        lat: place.location.lat(),
        lng: place.location.lng(),
        indirizzo: place.formattedAddress || place.displayName,
      }
    } catch (err) {
      console.error('Errore fetchFields:', err)
    }
  })

  // Fallback: cattura anche via evento change sul Place legacy
  placeAutocomplete.addEventListener('gmp-select', async (e) => {
    try {
      const place = e.place
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] })
      selectedPlace = {
        lat: place.location.lat(),
        lng: place.location.lng(),
        indirizzo: place.formattedAddress || place.displayName,
      }
    } catch (err) {
      console.error('Errore gmp-select:', err)
    }
  })

  // Salva i costruttori per uso globale
  window._AdvancedMarkerElement = AdvancedMarkerElement

  // Inizializza l'app dopo che la mappa è pronta
  initApp()
}

// Avvia
initMappa()

// Aggiunge un marker sulla mappa per un locale
function aggiungiMarker(locale) {
  const pin = document.createElement('img')
  pin.src = 'assets/pin-marker.png'
  pin.style.width = '36px'
  pin.style.height = '36px'

  const marker = new window._AdvancedMarkerElement({
    position: { lat: locale.lat, lng: locale.lng },
    map: mappa,
    title: locale.nome,
    content: pin,
  })

  const contenutoPopup = `
    <div style="max-width: 200px">
      <strong>${locale.nome}</strong><br/>
      <span style="color:#888; font-size:0.85rem">${locale.indirizzo || ''}</span>
      ${locale.note ? `<p style="margin-top:6px; font-size:0.85rem">${locale.note}</p>` : ''}
      ${locale.accessibile ? `<span style="color:#00897B; font-size:0.8rem">♿ Accessibile</span>` : ''}
    </div>
  `

  const infoWindow = new google.maps.InfoWindow({ content: contenutoPopup })

  marker.addEventListener('gmp-click', () => {
    if (markerSelezionato) markerSelezionato.close()
    infoWindow.open(mappa, marker)
    markerSelezionato = infoWindow
  })

  markers[locale.id] = marker
}

// Centra la mappa su un locale specifico
function centraSuLocale(locale) {
  mappa.setCenter({ lat: locale.lat, lng: locale.lng })
  mappa.setZoom(16)
  if (markers[locale.id]) {
    google.maps.event.trigger(markers[locale.id], 'click')
  }
}

// Legge le coordinate dal risultato dell'autocomplete o geocoding
async function getCoordinateDaAutocomplete() {
  if (selectedPlace) {
    const result = selectedPlace
    selectedPlace = null
    return result
  }

  // Fallback: geocodifica il testo scritto dall'utente
  const placeInput = document.getElementById('place-autocomplete')
  const testo = placeInput?.value || placeInput?.innerText || ''
  if (!testo.trim()) return null

  const { Geocoder } = await google.maps.importLibrary('geocoding')
  const geocoder = new Geocoder()

  try {
    const { results } = await geocoder.geocode({ address: testo, region: 'it' })
    if (results && results.length > 0) {
      return {
        lat: results[0].geometry.location.lat(),
        lng: results[0].geometry.location.lng(),
        indirizzo: results[0].formatted_address,
      }
    }
  } catch (err) {
    console.error('Errore geocoding:', err)
  }

  return null
}
