-- Migrazione: aggiunge colonne tipo, dotazioni, livello
-- Da eseguire nell'editor SQL di Supabase

alter table locali add column if not exists tipo text;
alter table locali add column if not exists dotazioni text[];
alter table locali add column if not exists livello text;
