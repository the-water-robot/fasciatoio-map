// app.js — logica principale dell'applicazione

// Chiamata da maps.js dopo che la mappa è pronta
async function initApp() {
  await caricaERenderLocali()
  collegaEventiUI()
}

// Carica i locali da Supabase e li mostra su mappa e lista
async function caricaERenderLocali() {
  const locali = await caricaLocali()
  const lista = document.getElementById('lista-locali')
  lista.innerHTML = ''

  locali.forEach((locale) => {
    aggiungiMarker(locale)
    lista.appendChild(creaCardLocale(locale))
  })
}

// Crea una card HTML per un locale nella sidebar
function creaCardLocale(locale) {
  let distanzaHtml = ''
  if (posizioneUtente) {
    const km = calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, locale.lat, locale.lng)
    distanzaHtml = `<span class="badge-distanza">${km < 1 ? (km * 1000).toFixed(0) + ' m' : km.toFixed(1) + ' km'}</span>`
  }

  const card = document.createElement('div')
  card.className = 'locale-card'
  card.innerHTML = `
    <div class="card-header">
      <h3>${locale.nome}</h3>
      ${distanzaHtml}
    </div>
    <p>${locale.indirizzo || 'Indirizzo non specificato'}</p>
    ${locale.note ? `<p>${locale.note}</p>` : ''}
    ${locale.accessibile ? `<span class="badge-accessibile">♿ Accessibile</span>` : ''}
  `
  card.addEventListener('click', () => centraSuLocale(locale))
  return card
}

// Collega tutti gli eventi ai bottoni del form
function collegaEventiUI() {
  const btnAggiungi = document.getElementById('btn-aggiungi')
  const btnAnnulla = document.getElementById('btn-annulla')
  const btnSalva = document.getElementById('btn-salva')
  const formAggiungi = document.getElementById('form-aggiungi')

  // Toggle sidebar (mobile)
  const btnToggle = document.getElementById('btn-toggle-sidebar')
  const sidebar = document.getElementById('sidebar')
  btnToggle.addEventListener('click', () => {
    sidebar.classList.toggle('aperto')
  })

  // Mostra il form
  btnAggiungi.addEventListener('click', () => {
    formAggiungi.classList.remove('nascosto')
    btnAggiungi.classList.add('nascosto')
  })

  // Nasconde il form e lo resetta
  btnAnnulla.addEventListener('click', () => {
    resetForm()
  })

  // Salva il locale
  btnSalva.addEventListener('click', async () => {
    await salvaLocale()
  })
}

// Salva un nuovo locale
async function salvaLocale() {
  const nome = document.getElementById('input-nome').value.trim()
  const note = document.getElementById('input-note').value.trim()
  const accessibile = document.getElementById('input-accessibile').checked
  const aggiunto_da = document.getElementById('input-nickname').value.trim() || 'Anonimo'
  const errore = document.getElementById('form-errore')

  // Validazione
  if (!nome) {
    mostraErrore('Il nome del locale è obbligatorio')
    return
  }

  errore.classList.add('nascosto')
  document.getElementById('btn-salva').disabled = true
  document.getElementById('btn-salva').textContent = 'Ricerca indirizzo...'

  const coordinate = await getCoordinateDaAutocomplete()
  if (!coordinate) {
    mostraErrore('Inserisci un indirizzo valido')
    document.getElementById('btn-salva').disabled = false
    document.getElementById('btn-salva').textContent = 'Salva'
    return
  }

  document.getElementById('btn-salva').textContent = 'Salvataggio...'

  try {
    const nuovoLocale = await aggiungiLocale({
      nome,
      indirizzo: coordinate.indirizzo,
      lat: coordinate.lat,
      lng: coordinate.lng,
      note,
      accessibile,
      aggiunto_da,
    })

    // Aggiunge subito il marker e la card senza ricaricare tutto
    aggiungiMarker(nuovoLocale)
    const lista = document.getElementById('lista-locali')
    lista.insertBefore(creaCardLocale(nuovoLocale), lista.firstChild)
    centraSuLocale(nuovoLocale)

    resetForm()
  } catch (err) {
    mostraErrore('Errore nel salvataggio. Riprova.')
  } finally {
    document.getElementById('btn-salva').disabled = false
    document.getElementById('btn-salva').textContent = 'Salva'
  }
}

// Mostra un messaggio di errore nel form
function mostraErrore(messaggio) {
  const errore = document.getElementById('form-errore')
  errore.textContent = messaggio
  errore.classList.remove('nascosto')
}

// Resetta e nasconde il form
function resetForm() {
  document.getElementById('input-nome').value = ''
  const placeInput = document.getElementById('place-autocomplete')
  if (placeInput) placeInput.value = ''
  document.getElementById('input-note').value = ''
  document.getElementById('input-accessibile').checked = false
  document.getElementById('input-nickname').value = ''
  document.getElementById('form-errore').classList.add('nascosto')
  document.getElementById('form-aggiungi').classList.add('nascosto')
  document.getElementById('btn-aggiungi').classList.remove('nascosto')
}
