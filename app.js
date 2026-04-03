// app.js — logica principale dell'applicazione

let tuttiLocali = []

// Chiamata da maps.js dopo che la mappa è pronta
async function initApp() {
  await caricaERenderLocali()
  collegaEventiUI()
}

// Carica i locali da Supabase, aggiunge i marker e renderizza la lista
async function caricaERenderLocali() {
  tuttiLocali = await caricaLocali()
  tuttiLocali.forEach(aggiungiMarker)
  renderLista()
}

// Renderizza la lista ordinata per distanza (se disponibile)
function renderLista() {
  const sorted = [...tuttiLocali]

  if (posizioneUtente) {
    sorted.sort((a, b) => {
      const da = calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, a.lat, a.lng)
      const db = calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, b.lat, b.lng)
      return da - db
    })
  }

  const lista = document.getElementById('lista-locali')
  lista.innerHTML = `
    <div class="lista-header">
      <span>${sorted.length} posti</span>
      ${posizioneUtente ? '<span class="lista-sort">📍 dal più vicino</span>' : ''}
    </div>
  `
  sorted.forEach(locale => lista.appendChild(creaCardLocale(locale)))
}

// Richiamata da maps.js quando la geolocalizzazione è disponibile
function riordinaLista() {
  renderLista()
}

// Colore associato al livello
function colorePerLivello(livello) {
  return { Eccellente: '#43A047', Buono: '#FFB300', Sufficiente: '#FB8C00', Scarso: '#E53935' }[livello] || '#00897B'
}

// Tempo di cammino stimato (5 km/h)
function tempoAPiedi(km) {
  const min = Math.round(km / 5 * 60)
  if (min < 1) return '< 1 min'
  if (min < 60) return `${min} min`
  return null
}

// Crea una card HTML per un locale nella sidebar
function creaCardLocale(locale) {
  const colore = colorePerLivello(locale.livello)

  let distanzaHtml = ''
  if (posizioneUtente) {
    const km = calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, locale.lat, locale.lng)
    const kmStr = km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`
    const piedi = tempoAPiedi(km)
    distanzaHtml = `
      <div class="card-distanza">
        <span class="dist-km">${kmStr}</span>
        ${piedi ? `<span class="dist-piedi">🚶 ${piedi}</span>` : ''}
      </div>`
  }

  const dotazioniHtml = locale.dotazioni?.length
    ? `<div class="dotazioni">${locale.dotazioni.map(d => `<span class="dot-chip">${d}</span>`).join('')}</div>`
    : ''

  const card = document.createElement('div')
  card.className = 'locale-card'
  card.style.borderLeftColor = colore

  card.innerHTML = `
    <div class="card-top">
      <div class="card-info">
        <h3>${locale.nome}</h3>
        <p class="indirizzo">${locale.indirizzo || 'Indirizzo non specificato'}</p>
      </div>
      ${distanzaHtml}
    </div>
    <div class="card-badges">
      ${locale.tipo ? `<span class="badge-tipo">${locale.tipo}</span>` : ''}
      ${locale.livello ? `<span class="badge-livello" style="background:${colore}20;color:${colore}">${locale.livello}</span>` : ''}
    </div>
    ${dotazioniHtml}
    ${locale.note ? `<p class="card-note">${locale.note}</p>` : ''}
  `
  card.addEventListener('click', () => {
    document.querySelectorAll('.locale-card.attiva').forEach(c => c.classList.remove('attiva'))
    card.classList.add('attiva')
    centraSuLocale(locale)
  })
  return card
}

// Collega tutti gli eventi ai bottoni del form
function collegaEventiUI() {
  const btnToggle = document.getElementById('btn-toggle-sidebar')
  const sidebar = document.getElementById('sidebar')
  btnToggle.addEventListener('click', () => sidebar.classList.toggle('aperto'))

  document.getElementById('btn-aggiungi').addEventListener('click', () => {
    document.getElementById('form-aggiungi').classList.remove('nascosto')
    document.getElementById('btn-aggiungi').classList.add('nascosto')
  })

  document.getElementById('btn-annulla').addEventListener('click', resetForm)
  document.getElementById('btn-salva').addEventListener('click', salvaLocale)
}

// Salva un nuovo locale
async function salvaLocale() {
  const nome = document.getElementById('input-nome').value.trim()
  const tipo = document.getElementById('input-tipo').value
  const livello = document.querySelector('input[name="livello"]:checked')?.value || ''
  const dotazioni = [...document.querySelectorAll('input[name="dotazione"]:checked')].map(el => el.value)
  const note = document.getElementById('input-note').value.trim()
  const aggiunto_da = document.getElementById('input-nickname').value.trim() || 'Anonimo'

  if (!nome) { mostraErrore('Il nome del locale è obbligatorio'); return }
  if (!tipo) { mostraErrore('Seleziona la tipologia'); return }
  if (!livello) { mostraErrore('Seleziona il livello di pulizia'); return }
  if (!dotazioni.length) { mostraErrore('Seleziona almeno una dotazione'); return }

  document.getElementById('form-errore').classList.add('nascosto')
  const btnSalva = document.getElementById('btn-salva')
  btnSalva.disabled = true
  btnSalva.textContent = 'Ricerca indirizzo...'

  const coordinate = await getCoordinateDaAutocomplete()
  if (!coordinate) {
    mostraErrore('Inserisci un indirizzo valido')
    btnSalva.disabled = false
    btnSalva.textContent = 'Salva'
    return
  }

  btnSalva.textContent = 'Salvataggio...'

  try {
    const nuovoLocale = await aggiungiLocale({ nome, indirizzo: coordinate.indirizzo, lat: coordinate.lat, lng: coordinate.lng, tipo, dotazioni, livello, note, aggiunto_da })
    tuttiLocali.unshift(nuovoLocale)
    aggiungiMarker(nuovoLocale)
    renderLista()
    centraSuLocale(nuovoLocale)
    resetForm()
  } catch {
    mostraErrore('Errore nel salvataggio. Riprova.')
  } finally {
    btnSalva.disabled = false
    btnSalva.textContent = 'Salva'
  }
}

function mostraErrore(messaggio) {
  const errore = document.getElementById('form-errore')
  errore.textContent = messaggio
  errore.classList.remove('nascosto')
}

function resetForm() {
  document.getElementById('input-nome').value = ''
  const placeInput = document.getElementById('place-autocomplete')
  if (placeInput) placeInput.value = ''
  document.getElementById('input-tipo').value = ''
  document.querySelectorAll('input[name="livello"]').forEach(r => r.checked = false)
  document.querySelectorAll('input[name="dotazione"]').forEach(c => c.checked = false)
  document.getElementById('input-note').value = ''
  document.getElementById('input-nickname').value = ''
  document.getElementById('form-errore').classList.add('nascosto')
  document.getElementById('form-aggiungi').classList.add('nascosto')
  document.getElementById('btn-aggiungi').classList.remove('nascosto')
}
