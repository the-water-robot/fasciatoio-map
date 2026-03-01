// maps.js — logica Google Maps

let mappa
let autocomplete
let markerSelezionato = null
const markers = {}

// Inizializza la mappa — chiamata automaticamente da Google Maps come callback
function initMap() {
  // Centro di default: Milano
  const centroDef = { lat: 45.4641, lng: 9.1919 }

  mappa = new google.maps.Map(document.getElementById('map'), {
    center: centroDef,
    zoom: 13,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
  })

  // Prova a centrare sulla posizione dell'utente
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mappa.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => console.log('Geolocalizzazione non disponibile, uso Milano come default')
    )
  }

  // Inizializza autocomplete sull'input indirizzo
  const inputIndirizzo = document.getElementById('input-indirizzo')
  autocomplete = new google.maps.places.Autocomplete(inputIndirizzo, {
    types: ['establishment', 'geocode'],
    componentRestrictions: { country: 'it' },
  })

  // Inizializza l'app dopo che la mappa è pronta
  initApp()
}

// Aggiunge un marker sulla mappa per un locale
function aggiungiMarker(locale) {
  const marker = new google.maps.Marker({
    position: { lat: locale.lat, lng: locale.lng },
    map: mappa,
    title: locale.nome,
    icon: {
      url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    },
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

  marker.addListener('click', () => {
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
  const place = autocomplete.getPlace()
  if (!place || !place.geometry) return null
  return {
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
    indirizzo: place.formatted_address || document.getElementById('input-indirizzo').value,
  }
}
