// app.js — logica principale dell'applicazione

let tuttiLocali = []
let filtriAttivi = { livello: [], tipo: [], dotazione: [] }

// ── Init ────────────────────────────────────────────────────────────────────

async function initApp() {
  await caricaERenderLocali()
  collegaEventiUI()
  collegaFiltri()
}

async function caricaERenderLocali() {
  tuttiLocali = await caricaLocali()
  tuttiLocali.forEach(aggiungiMarker)
  renderLista()
}

// Richiamata da maps.js quando la geolocalizzazione è disponibile
function riordinaLista() {
  renderLista()
}

// ── Render lista ─────────────────────────────────────────────────────────────

function renderLista() {
  let lista = [...tuttiLocali]

  // Applica filtri (OR dentro ogni categoria)
  if (filtriAttivi.livello.length)   lista = lista.filter(l => filtriAttivi.livello.includes(l.livello))
  if (filtriAttivi.tipo.length)      lista = lista.filter(l => filtriAttivi.tipo.includes(l.tipo))
  if (filtriAttivi.dotazione.length) lista = lista.filter(l => filtriAttivi.dotazione.every(d => l.dotazioni?.includes(d)))

  // Ordina per distanza
  if (posizioneUtente) {
    lista.sort((a, b) =>
      calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, a.lat, a.lng) -
      calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, b.lat, b.lng)
    )
  }

  const el = document.getElementById('lista-locali')
  const filtroAttivo = Object.values(filtriAttivi).some(a => a.length)
  el.innerHTML = `
    <div class="lista-header">
      <span>${lista.length} posti${filtroAttivo ? ` <span class="filtro-attivo-label">· filtrati</span>` : ''}</span>
      ${posizioneUtente ? '<span class="lista-sort">📍 dal più vicino</span>' : ''}
    </div>
  `
  lista.forEach(locale => el.appendChild(creaCardLocale(locale)))
}

// ── Card ─────────────────────────────────────────────────────────────────────

function colorePerLivello(livello) {
  return { Eccellente: '#43A047', Buono: '#FFB300', Sufficiente: '#FB8C00', Scarso: '#E53935' }[livello] || '#00897B'
}

function tempoAPiedi(km) {
  const min = Math.round(km / 5 * 60)
  if (min < 1) return '< 1 min'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function urlMaps(locale) {
  return `https://www.google.com/maps/dir/?api=1&destination=${locale.lat},${locale.lng}&travelmode=walking`
}

function creaCardLocale(locale) {
  const colore = colorePerLivello(locale.livello)

  let distanzaHtml = ''
  if (posizioneUtente) {
    const km = calcolaDistanzaKm(posizioneUtente.lat, posizioneUtente.lng, locale.lat, locale.lng)
    const kmStr = km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`
    distanzaHtml = `
      <div class="card-distanza">
        <span class="dist-km">${kmStr}</span>
        <span class="dist-piedi">🚶 ${tempoAPiedi(km)}</span>
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
      ${locale.tipo ? `<span class="badge-tipo">${tipoIcon(locale.tipo)} ${locale.tipo}</span>` : ''}
      ${locale.livello ? `<span class="badge-livello" style="background:${colore}20;color:${colore}">${locale.livello}</span>` : ''}
    </div>
    ${dotazioniHtml}
    ${locale.note ? `<p class="card-note">${locale.note}</p>` : ''}
    <div class="card-footer">
      <a class="btn-open-maps" href="${urlMaps(locale)}" target="_blank" rel="noopener" title="Apri Google Maps con indicazioni a piedi">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        Indicazioni
      </a>
    </div>
  `

  card.addEventListener('click', e => {
    if (e.target.closest('.btn-open-maps')) return
    document.querySelectorAll('.locale-card.attiva').forEach(c => c.classList.remove('attiva'))
    card.classList.add('attiva')
    centraSuLocale(locale)
  })
  return card
}

function tipoIcon(tipo) {
  return { Bar: '☕', Ristorante: '🍽', Negozio: '🛍', 'Centro commerciale': '🏬', Altro: '📍' }[tipo] || '📍'
}

// ── Filtri ───────────────────────────────────────────────────────────────────

function collegaFiltri() {
  // Toggle collassa/espandi
  document.getElementById('filtri-toggle')?.addEventListener('click', (e) => {
    if (e.target.closest('#btn-reset-filtri')) return
    const body = document.getElementById('filtri-body')
    const toggle = document.getElementById('filtri-toggle')
    const aperto = body.classList.toggle('aperto')
    toggle.setAttribute('aria-expanded', aperto)
  })

  document.querySelectorAll('.chip-filtro').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.key
      const val = chip.dataset.valore
      if (val === '') {
        filtriAttivi[key] = []
      } else {
        const idx = filtriAttivi[key].indexOf(val)
        if (idx === -1) filtriAttivi[key].push(val)
        else filtriAttivi[key].splice(idx, 1)
      }
      aggiornaCSSFiltri(key)
      aggiornaBadge()
      renderLista()
    })
  })

  document.getElementById('btn-reset-filtri')?.addEventListener('click', (e) => {
    e.stopPropagation()
    filtriAttivi = { livello: [], tipo: [], dotazione: [] }
    ;['livello', 'tipo', 'dotazione'].forEach(aggiornaCSSFiltri)
    aggiornaBadge()
    renderLista()
  })
}

function aggiornaCSSFiltri(key) {
  const attivi = filtriAttivi[key]
  document.querySelectorAll(`.chip-filtro[data-key="${key}"]`).forEach(c => {
    const val = c.dataset.valore
    const isAttivo = val === '' ? attivi.length === 0 : attivi.includes(val)
    c.classList.toggle('attivo', isAttivo)
    if (c.dataset.colore && isAttivo) {
      c.style.background = c.dataset.colore
      c.style.borderColor = c.dataset.colore
      c.style.color = 'white'
    } else if (c.dataset.colore) {
      c.style.background = ''
      c.style.borderColor = ''
      c.style.color = ''
    }
  })
}

function aggiornaBadge() {
  const count = Object.values(filtriAttivi).reduce((s, a) => s + a.length, 0)
  const badge = document.getElementById('filtri-badge')
  const resetBtn = document.getElementById('btn-reset-filtri')
  if (badge) {
    badge.textContent = count
    badge.classList.toggle('nascosto', count === 0)
  }
  resetBtn?.classList.toggle('nascosto', count === 0)
}

// ── Form / UI ────────────────────────────────────────────────────────────────

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

  // Modal info
  document.getElementById('btn-info').addEventListener('click', apriModal)
  document.getElementById('btn-chiudi-modal').addEventListener('click', chiudiModal)
  document.getElementById('modal-info').addEventListener('click', e => {
    if (e.target === e.currentTarget) chiudiModal()
  })

  // Share links
  const APP_URL = 'https://fasciatoio-map.vercel.app'
  const APP_TEXT = 'Trova un fasciatoio vicino a te 👶'
  document.getElementById('btn-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(APP_TEXT + '\n' + APP_URL)}`
  document.getElementById('btn-telegram').href = `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(APP_TEXT)}`

  if (navigator.share) {
    document.getElementById('btn-share-nativo').classList.remove('nascosto')
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

let qrGenerato = false

function apriModal() {
  document.getElementById('modal-info').classList.remove('nascosto')
  document.body.style.overflow = 'hidden'
  if (!qrGenerato) {
    QRCode.toCanvas(
      document.getElementById('qr-canvas'),
      'https://fasciatoio-map.vercel.app',
      { width: 148, margin: 1, color: { dark: '#00897B', light: '#ffffff' } }
    )
    qrGenerato = true
  }
}

function chiudiModal() {
  document.getElementById('modal-info').classList.add('nascosto')
  document.body.style.overflow = ''
}

async function copiLink() {
  await navigator.clipboard.writeText('https://fasciatoio-map.vercel.app')
  const btn = document.getElementById('btn-copia')
  const orig = btn.textContent
  btn.textContent = '✓ Copiato!'
  setTimeout(() => btn.textContent = orig, 2000)
}

async function condividiNativo() {
  try {
    await navigator.share({
      title: 'FasciatoioMap',
      text: 'Trova un fasciatoio vicino a te 👶',
      url: 'https://fasciatoio-map.vercel.app',
    })
  } catch {}
}

async function salvaLocale() {
  const nome = document.getElementById('input-nome').value.trim()
  const tipo = document.getElementById('input-tipo').value
  const livello = document.querySelector('input[name="livello"]:checked')?.value || ''
  const dotazioni = [...document.querySelectorAll('input[name="dotazione"]:checked')].map(el => el.value)
  const note = document.getElementById('input-note').value.trim()
  const aggiunto_da = document.getElementById('input-nickname').value.trim() || 'Anonimo'

  if (!nome)          { mostraErrore('Il nome del locale è obbligatorio'); return }
  if (!tipo)          { mostraErrore('Seleziona la tipologia'); return }
  if (!livello)       { mostraErrore('Seleziona il livello di pulizia'); return }
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

function mostraErrore(msg) {
  const el = document.getElementById('form-errore')
  el.textContent = msg
  el.classList.remove('nascosto')
}

function resetForm() {
  document.getElementById('input-nome').value = ''
  const p = document.getElementById('place-autocomplete')
  if (p) p.value = ''
  document.getElementById('input-tipo').value = ''
  document.querySelectorAll('input[name="livello"]').forEach(r => r.checked = false)
  document.querySelectorAll('input[name="dotazione"]').forEach(c => c.checked = false)
  document.getElementById('input-note').value = ''
  document.getElementById('input-nickname').value = ''
  document.getElementById('form-errore').classList.add('nascosto')
  document.getElementById('form-aggiungi').classList.add('nascosto')
  document.getElementById('btn-aggiungi').classList.remove('nascosto')
}
