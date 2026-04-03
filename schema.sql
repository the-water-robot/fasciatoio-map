-- Schema per FasciatoioMap
-- Da eseguire nell'editor SQL di Supabase

create table locali (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  indirizzo   text,
  lat         float8 not null,
  lng         float8 not null,
  tipo        text,
  dotazioni   text[],
  livello     text,
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
