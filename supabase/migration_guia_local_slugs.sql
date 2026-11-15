-- Guía local: URL propia por idioma y redirección de URLs antiguas
--   /es/guia-local/<slug>   ·   /en/local-guide/<slug_en>
-- slugs_antiguos guarda slugs anteriores para que los enlaces ya compartidos redirijan (301).
-- Ejecutar en: Supabase Dashboard → SQL Editor

alter table articulos add column if not exists slug_en text;
alter table articulos add column if not exists slugs_antiguos text[] not null default '{}';
create unique index if not exists articulos_slug_en_key on articulos (slug_en) where slug_en is not null;

-- Slugs cortos (ES) y slugs EN — ejecutado el 2026-11-15
update articulos set slugs_antiguos = array_append(slugs_antiguos, slug), slug = v.es, slug_en = v.en
from (values
  (2, 'tabernas-marbella', 'taverns-marbella'),
  (3, 'casco-antiguo-marbella', 'marbella-old-town'),
  (4, 'excursiones-ronda-mijas', 'day-trips-ronda-mijas'),
  (5, 'playas-marbella-centro', 'beaches-marbella-centre'),
  (6, 'chiringuitos-marbella', 'beach-bars-marbella'),
  (7, 'luces-navidad-malaga', 'christmas-lights-malaga')
) as v(id, es, en)
where articulos.id = v.id;
update articulos set slug_en = 'copper-forest-malaga' where id = 8;

-- DESPUÉS de publicar este cambio en producción (artículo ya publicado, para no romper su URL antes):
-- update articulos set slugs_antiguos = array_append(slugs_antiguos, slug), slug = 'bosque-de-cobre-malaga' where id = 8;
