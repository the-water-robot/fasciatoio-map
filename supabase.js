// supabase.js — client e funzioni per il database

// ⚠️ Sostituisci con le tue credenziali Supabase
const SUPABASE_URL = 'https://xxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJ...'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Carica tutti i locali dal database
async function caricaLocali() {
  const { data, error } = await supabase
    .from('locali')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore nel caricamento locali:', error)
    return []
  }

  return data
}

// Inserisce un nuovo locale nel database
async function aggiungiLocale({ nome, indirizzo, lat, lng, note, accessibile, aggiunto_da }) {
  const { data, error } = await supabase
    .from('locali')
    .insert([{ nome, indirizzo, lat, lng, note, accessibile, aggiunto_da }])
    .select()

  if (error) {
    console.error('Errore nel salvataggio locale:', error)
    throw error
  }

  return data[0]
}
