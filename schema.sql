-- Schema per FasciatoioMap
-- Da eseguire nell'editor SQL di Supabase

create table locali (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  indirizzo   text,
  lat         float8 not null,
  lng         float8 not null,
  note        text,
  accessibile boolean default false,
  aggiunto_da text,
  created_at  timestamptz default now()
);

-- Abilita Row Level Security
alter table locali enable row level security;

-- Chiunque può leggere i locali
create policy "Lettura pubblica"
  on locali for select
  using (true);

-- Chiunque può inserire un locale (MVP senza auth)
create policy "Inserimento pubblico"
  on locali for insert
  with check (true);

-- Dati di esempio per test
insert into locali (nome, indirizzo, lat, lng, note, accessibile, aggiunto_da) values
  ('Bar Centrale', 'Piazza Duomo 1, Milano', 45.4641, 9.1919, 'Fasciatoio nel bagno donne, pulito', true, 'admin'),
  ('McDonald''s Loreto', 'Viale Monza 2, Milano', 45.4890, 9.2166, 'Sempre aperto, fasciatoio al piano -1', true, 'admin');
