// catalog-api.js
// Cliente mínimo de Supabase para el catálogo (Program / Season / Chapter).
// Se carga después de @supabase/supabase-js, así que `window.supabase`
// expone el global `createClient`.
//
// Expone window.CatalogAPI con:
//   - load()       → Promise<Catalog>  (cachea en memoria, evita re-fetch)
//   - getCatalog() → Catalog | null    (lo último cacheado)
//   - findSeries(seriesId)   → Program | null
//   - findChapter(seriesId, chapterId) → Chapter | null
//   - getRecommendedSeries() → Program[]
//   - filterByTag(tag)       → Program[]
//
// Shape devuelto (catálogo normalizado para el front):
//   {
//     series: [
//       { id, slug, title, tagline, description, difficulty, tags,
//         display_order, endorser, skills[], bibliography[],
//         chapters: [
//           { id, slug, title, subtitle, sub, code: "S01·E01",
//             order, status, time, npcs, framework, learning_objectives[] }
//         ]
//       }
//     ]
//   }
//
// Reglas de catálogo:
//   - "Recomendada para ti" = programas con el tag 'recommended'.
//   - El orden lo determina `display_order`.
//   - is_featured queda en la DB pero el cliente NO lo usa para nada
//     (deprecado en favor del sistema de tags).
//
// El campo `code` ("S01·E01") se compone en cliente a partir de
// season.order + chapter.order — la DB no lo guarda.

const SUPABASE_CATALOG_URL = 'https://idkmyquqqedjhwsemjwh.supabase.co';
const SUPABASE_CATALOG_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlka215cXVxcWVkamh3c2VtandoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTE5MDMsImV4cCI6MjA4NTc4NzkwM30.pF1XJgUQx7tcCjTIVAy5fRcqRbHr-TS9ixBrZWLJ-F0';

(function () {
  let client = null;
  let cache = null;       // último catálogo cargado
  let inflight = null;    // promesa en curso (evita doble fetch concurrente)

  const getClient = () => {
    if (client) return client;
    const lib = window.supabase;
    if (!lib || !lib.createClient) {
      console.error('[CatalogAPI] supabase-js no cargado');
      return null;
    }
    client = lib.createClient(SUPABASE_CATALOG_URL, SUPABASE_CATALOG_KEY);
    return client;
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  // Buckets de portadas. Cada nivel tiene su propio bucket público.
  const SERIES_THUMB_BUCKET  = 'series-thumbnails';
  const CHAPTER_THUMB_BUCKET = 'chapter-thumbnails';

  // Resuelve un thumbnail_url a URL pública. Acepta:
  //   - URL absoluta (http/https)  → devuelta tal cual
  //   - filename relativo          → compuesto contra el bucket dado
  //   - null/empty                 → null
  const resolveBucketUrl = (raw, bucket) => {
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const c = getClient();
    if (!c) return null;
    const { data } = c.storage.from(bucket).getPublicUrl(raw);
    return data?.publicUrl || null;
  };

  const resolveThumbnailUrl        = (raw) => resolveBucketUrl(raw, SERIES_THUMB_BUCKET);
  const resolveChapterThumbnailUrl = (raw) => resolveBucketUrl(raw, CHAPTER_THUMB_BUCKET);

  // Convierte la respuesta nested de Supabase al shape que usa el front.
  // Devuelve dos vistas de los chapters:
  //   - series.chapters[]: lista flat (compat con findChapter / ScreenChapter)
  //   - series.seasons[]:  agrupados por temporada con detalle de la season
  const normalize = (programs) => {
    const series = (programs || [])
      .map(p => {
        const programThumbnail = resolveThumbnailUrl(p.thumbnail_url);
        const rawSeasons = (p.seasons || []).sort((a, b) => a.order - b.order);
        const chaptersFlat = [];
        const seasons = rawSeasons.map(s => {
          const chs = (s.chapters || [])
            .sort((a, b) => a.order - b.order)
            .map(ch => {
              const c = {
                id: ch.id,
                slug: ch.slug,
                title: ch.title,
                subtitle: ch.subtitle,
                sub: ch.tagline,
                description: ch.description,
                code: `S${pad2(s.order)}·E${pad2(ch.order)}`,
                order: ch.order,
                season_id: s.id,
                season_title: s.title,
                status: ch.status,
                time: ch.estimated_duration ? `${ch.estimated_duration} min` : null,
                npcs: ch.npc_count || 0,
                framework: ch.framework_label,
                learning_objectives: ch.learning_objectives || [],
                feedback_config: ch.feedback_config || null,
                // Portada del capítulo: usa la propia si tiene, sino la
                // hereda del programa para mantener continuidad visual.
                thumbnail_url: resolveChapterThumbnailUrl(ch.thumbnail_url) || programThumbnail,
                series_title: p.title,
                bibliography: (ch.chapter_bibliography || [])
                  .map(cb => cb.bibliography_entries).filter(Boolean),
                objectives: (ch.objectives || [])
                  .filter(o => o.visible_to_user)
                  .sort((a, b) => {
                    if (a.type !== b.type) return a.type === 'primary' ? -1 : 1;
                    return (a.display_order || 0) - (b.display_order || 0);
                  })
                  .map(o => ({
                    id: o.id,
                    type: o.type,
                    description: o.narrative_description,
                    points: o.points_value || 0,
                    evaluation_method: o.evaluation_method,
                    skills: (o.objective_skills || [])
                      .map(os => os.power_skills).filter(Boolean),
                  })),
              };
              chaptersFlat.push(c);
              return c;
            });
          return {
            id: s.id,
            slug: s.slug,
            title: s.title,
            description: s.description,
            order: s.order,
            narrative_context: s.narrative_context,
            estimated_duration: s.estimated_duration,
            completion_badge: s.completion_badge,
            chapters: chs,
          };
        });
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          tagline: p.tagline,
          description: p.description,
          difficulty: p.difficulty,
          tags: p.tags || [],
          display_order: p.display_order || 0,
          estimated_duration: p.estimated_duration,
          thumbnail_url: programThumbnail,
          season_count: seasons.length,
          endorser: p.endorsers || null,
          skills: (p.program_skills || []).map(ps => ps.power_skills).filter(Boolean),
          bibliography: (p.program_bibliography || [])
            .map(pb => pb.bibliography_entries).filter(Boolean),
          seasons,
          chapters: chaptersFlat,
        };
      })
      .sort((a, b) => a.display_order - b.display_order);

    return { series };
  };

  const fetchCatalog = async () => {
    const c = getClient();
    if (!c) throw new Error('Supabase no disponible');

    // Una sola query con joins anidados — Supabase resuelve el nesting
    // siguiendo las foreign keys.
    const { data, error } = await c
      .from('programs')
      .select(`
        id, slug, title, tagline, description, difficulty,
        estimated_duration, thumbnail_url, tags,
        is_published, display_order,
        endorsers ( id, name, title, institution, photo_url, bio ),
        program_skills ( power_skills ( id, name, description ) ),
        program_bibliography ( bibliography_entries ( id, title, authors, year, type, url ) ),
        seasons (
          id, slug, title, description, "order", narrative_context, estimated_duration,
          chapters (
            id, slug, title, subtitle, description, tagline, "order",
            learning_objectives, framework_label, estimated_duration,
            npc_count, status, feedback_config, thumbnail_url,
            chapter_bibliography ( bibliography_entries ( id, title, authors, year, type, url ) ),
            objectives (
              id, type, narrative_description, points_value, evaluation_method,
              visible_to_user, display_order,
              objective_skills ( power_skills ( id, name ) )
            )
          )
        )
      `)
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[CatalogAPI] error fetching catalog:', error);
      throw error;
    }
    return normalize(data);
  };

  const load = () => {
    if (cache) return Promise.resolve(cache);
    if (inflight) return inflight;
    inflight = fetchCatalog()
      .then(catalog => {
        cache = catalog;
        inflight = null;
        return catalog;
      })
      .catch(err => {
        inflight = null;
        throw err;
      });
    return inflight;
  };

  const getCatalog = () => cache;

  const findSeries = (seriesId) =>
    cache ? cache.series.find(s => s.id === seriesId) || null : null;

  const findChapter = (seriesId, chapterId) => {
    const s = findSeries(seriesId);
    if (!s) return null;
    return s.chapters.find(c => c.id === chapterId) || null;
  };

  const filterByTag = (tag) =>
    cache ? cache.series.filter(s => (s.tags || []).includes(tag)) : [];

  const getRecommendedSeries = () => filterByTag('recommended');

  window.CatalogAPI = {
    load, getCatalog, findSeries, findChapter,
    filterByTag, getRecommendedSeries,
  };
})();
