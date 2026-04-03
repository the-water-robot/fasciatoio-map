// import-data.mjs — geocodifica e importa i locali in Supabase
// Esegui con: node import-data.mjs

const GOOGLE_MAPS_KEY = 'AIzaSyDnGAfKWfV2o7Csm0mDHs3Fgodf5IC6XXA'
const SUPABASE_URL = 'https://mpmixejryqrzwgqppsfq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWl4ZWpyeXFyendncXBwc2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDMwNjQsImV4cCI6MjA4NzgxOTA2NH0.bsr6J4H9r5sPHZOs2L3zT7CSPw9hv2hro3Zu37BZgIM'

const locali = [
  { nome: 'Chicco', indirizzo: 'Corso Buenos Aires, 75, Milano', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Salviette', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'MAG', indirizzo: 'Viale Gran Sasso, 27, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'God Save the Food - Lavater', indirizzo: 'Piazzale Lavater, 1, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Hot meeting', indirizzo: 'Via Sansovino, 33, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: "Orlando&Ottavia Kid's Stock", indirizzo: 'Viale Argonne, 32, Milano', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Salviette'], livello: 'Eccellente' },
  { nome: 'Salvagente Bimbi', indirizzo: 'Via G. Balzaretti, 15, Milano', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Lavandino', 'Salviette'], livello: 'Eccellente' },
  { nome: 'Consultorio Familiare integrato', indirizzo: 'Via G. Ricordi, 1, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Upcycle Milano Bike Café', indirizzo: 'Via A.M. Ampère, 59, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Long Song Books & Café', indirizzo: 'Via A. Stoppani, 11, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Cafezal Brunch & Speciality Coffee', indirizzo: 'Viale Premuda 14, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Mosso bar', indirizzo: 'Via Angelo Mosso, 3, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Esselunga via Adriano', indirizzo: 'Via Adriano 81, Milano', tipo: 'Centro commerciale', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Bicocca Village', indirizzo: 'Via Chiese 4, Milano', tipo: 'Centro commerciale', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Fuorimano OTBP', indirizzo: 'Via Cozzi 3, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Mondadori Duomo', indirizzo: 'Piazza Duomo, Milano', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'BROLO', indirizzo: 'Via Melzo, 19, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Apple Store', indirizzo: 'Piazza del Liberty 1, Milano', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Salina', indirizzo: 'Viale Abruzzi 51, Milano', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Lavandino', 'Salviette', 'Pannolini', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Scalo Milano Outlet & More', indirizzo: 'Via Milano 5, Locate di Triulzi', tipo: 'Centro commerciale', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Municipio 3 Anagrafe', indirizzo: 'Via Sansovino 9, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Panino Giusto', indirizzo: 'Piazza Diaz 6, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Biblioteca Sormani', indirizzo: 'C.so Porta Vittoria, 6, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Consultorio Mangiagalli', indirizzo: 'Via Pace 15, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino', 'Pannolini', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Clinica Mangiagalli', indirizzo: 'Via della Commenda 12, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino', 'Scaldabiberon', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Goodurie Sorresina', indirizzo: 'Via Orobia, 16, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Ristorante Fiumicello', indirizzo: 'Via Fiumicello 1, Premilcuore', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Comune di Ivrea', indirizzo: 'Piazza F. Nazionale 1, Ivrea', tipo: 'Altro', dotazioni: ['Fasciatoio'], livello: 'Buono' },
  { nome: 'Biblioteca Civica C. Nigra', indirizzo: 'Piazza Ottinetti 30, Ivrea', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino', 'Salviette', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Centro Vaccinale via Padova', indirizzo: 'Via Padova 118, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Poltrona allattamento'], livello: 'Buono' },
  { nome: 'Museo di Storia Naturale', indirizzo: 'Corso Venezia 55, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Mica pita', indirizzo: 'Via G. Rovetta, 9N, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Cortinovis', indirizzo: 'Via G. Cena, 21, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'California Bakery', indirizzo: 'Corso Garibaldi, 89, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Sufficiente' },
  { nome: 'Roby bar', indirizzo: 'Via dei Laghi 48', tipo: 'Bar', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Consultorio La Famiglia', indirizzo: 'Via Arese 18, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino', 'Scaldabiberon', 'Pannolini', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Spazio Lotus', indirizzo: 'Via F. Cervi 7, Opera', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino', 'Scaldabiberon', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Prenatal', indirizzo: 'Via Cascina Venina 9, Assago', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Lavandino', 'Poltrona allattamento'], livello: 'Eccellente' },
  { nome: 'Tenuta San Michele', indirizzo: 'Via Petraro, Sarno SA', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino', 'Salviette'], livello: 'Eccellente' },
  { nome: 'I sapori del sud', indirizzo: 'Via Beneveraturo, Sarno SA', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino', 'Salviette'], livello: 'Eccellente' },
  { nome: 'Complesso comm. di Corsico', indirizzo: "Via dell'Industria 4, Corsico", tipo: 'Centro commerciale', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Pizzikotto Milano Bisceglie', indirizzo: 'Via Bianca Ceva, 49, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Triennale', indirizzo: 'Via Alemagna 6, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Mercato del Suffragio', indirizzo: 'P.za S.M. del Suffragio 2, Milano', tipo: 'Altro', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
  { nome: 'Hakim', indirizzo: 'Via Vallazze, 74, Milano', tipo: 'Ristorante', dotazioni: ['Fasciatoio'], livello: 'Sufficiente' },
  { nome: 'Cascina Bianca', indirizzo: 'Via S. Antica di Cassano 1, Vignate', tipo: 'Ristorante', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Eccellente' },
  { nome: 'Cafeteria Sun Strac', indirizzo: 'Via Luigi Ornato 7119, Milano', tipo: 'Bar', dotazioni: ['Fasciatoio'], livello: 'Buono' },
  { nome: 'Libreria Spazio Sette', indirizzo: 'Via dei Barbieri, 7, Roma', tipo: 'Negozio', dotazioni: ['Fasciatoio', 'Lavandino'], livello: 'Buono' },
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
  console.log(`Importazione di ${locali.length} locali...\n`)
  let ok = 0, fail = 0

  for (const locale of locali) {
    process.stdout.write(`${locale.nome}... `)
    const coords = await geocodifica(locale.indirizzo)
    if (!coords) { fail++; continue }

    try {
      await inserisci({ ...locale, lat: coords.lat, lng: coords.lng, aggiunto_da: 'import' })
      console.log(`✓ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`)
      ok++
    } catch (e) {
      console.log(`✗ Errore DB: ${e.message}`)
      fail++
    }

    // pausa per rispettare rate limit Nominatim (1 req/sec)
    await new Promise(r => setTimeout(r, 1100))
  }

  console.log(`\nFine: ${ok} importati, ${fail} falliti.`)
}

main()
