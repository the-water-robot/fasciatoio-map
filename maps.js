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
    const place = e.place
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] })
    selectedPlace = {
      lat: place.location.lat(),
      lng: place.location.lng(),
      indirizzo: place.formattedAddress || place.displayName,
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
  const pin = document.createElement('div')
  pin.textContent = '🍼'
  pin.style.fontSize = '28px'

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
      ${locale.accessibile ? `<span style="color:#2d6a4f; font-size:0.8rem">♿ Accessibile</span>` : ''}
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

// Legge le coordinate dal risultato dell'autocomplete
function getCoordinateDaAutocomplete() {
  if (!selectedPlace) return null
  const result = selectedPlace
  selectedPlace = null
  return result
}
