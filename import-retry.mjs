// import-retry.mjs — secondo tentativo per i locali non geocodificati
// Esegui con: node import-retry.mjs

const SUPABASE_URL = 'https://mpmixejryqrzwgqppsfq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWl4ZWpyeXFyendncXBwc2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDMwNjQsImV4cCI6MjA4NzgxOTA2NH0.bsr6J4H9r5sPHZOs2L3zT7CSPw9hv2hro3Zu37BZgIM'

// Indirizzi espansi per Nominatim
const locali = [
  { nome: 'Salvagente Bimbi', indirizzo: 'Via Giuseppe Balzaretti, 15, Milano', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Lavandino', 'Salviette'], livello: 'Eccellente' },
  { nome: 'Consultorio Familiare integrato', indirizzo: 'Via Giovanni Ricordi, 1, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Upcycle Milano Bike Café', indirizzo: 'Via Ampere, 59, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Long Song Books & Café', indirizzo: 'Via Alessandro Stoppani, 11, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Ristorante Fiumicello', indirizzo: 'Via Fiumicello, Premilcuore, Forlì-Cesena', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Comune di Ivrea', indirizzo: 'Piazza Ferruccio Nazionale, Ivrea', tipo: 'Altro', dotazioni: ['Fasciatoio'], livello: 'Buono' },
  { nome: 'Mica pita', indirizzo: 'Via Giovanni Rovetta, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Cortinovis', indirizzo: 'Via Giovanni Cena, 21, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Spazio Lotus', indirizzo: 'Via Felice Cervi, 7, Opera, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino', 'Scaldabiberon', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'I sapori del sud', indirizzo: 'Sarno, Salerno', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino', 'Salviette'], livello: 'Eccellente' },
  { nome: 'Triennale', indirizzo: 'Viale Alemagna 6, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Mercato del Suffragio', indirizzo: 'Piazza Santa Maria del Suffragio, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Cascina Bianca', indirizzo: 'Vignate, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
]

async function geocodifica(indirizzo) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(indirizzo)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'fasciatoio-map-import/1.0' } })
  const data = await res.json()
  if (!data.length) {
    console.warn(`  ⚠️  Geocodifica fallita per: ${indirizzo}`)
    return null
  }
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

async function inserisci(locale) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/locali`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(locale),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
}

async function main() {
  console.log(`Retry di ${locali.length} locali...\n`)
  let ok = 0, fail = 0

  for (const locale of locali) {
    process.stdout.write(`${locale.nome}... `)
    const coords = await geocodifica(locale.indirizzo)
    if (!coords) { fail++; await new Promise(r => setTimeout(r, 1100)); continue }

    try {
      await inserisci({ ...locale, lat: coords.lat, lng: coords.lng, aggiunto_da: 'import' })
      console.log(`✓ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`)
      ok++
    } catch (e) {
      console.log(`✗ Errore DB: ${e.message}`)
      fail++
    }

    await new Promise(r => setTimeout(r, 1100))
  }

  console.log(`\nFine: ${ok} importati, ${fail} falliti.`)
}

main()
