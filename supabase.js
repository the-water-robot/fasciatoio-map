// supabase.js — client e funzioni per il database

// ⚠️ Sostituisci con le tue credenziali Supabase
const SUPABASE_URL = 'https://mpmixejryqrzwgqppsfq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWl4ZWpyeXFyendncXBwc2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDMwNjQsImV4cCI6MjA4NzgxOTA2NH0.bsr6J4H9r5sPHZOs2L3zT7CSPw9hv2hro3Zu37BZgIM'

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Carica tutti i locali dal database
async function caricaLocali() {
  const { data, error } = await supabaseClient
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
  const { data, error } = await supabaseClient
    .from('locali')
    .insert([{ nome, indirizzo, lat, lng, note, accessibile, aggiunto_da }])
    .select()

  if (error) {
    console.error('Errore nel salvataggio locale:', error)
    throw error
  }

  return data[0]
}
