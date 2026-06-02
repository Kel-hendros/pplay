// Auth + Home + Onboarding screens

// Hook compartido: trae el catálogo de Supabase (vía CatalogAPI) con cache.
// Devuelve { catalog, loading, error }. Re-fetch automático tras error.
function useCatalog() {
  const [state, setState] = useState(() => ({
    catalog: window.CatalogAPI?.getCatalog() || null,
    loading: !window.CatalogAPI?.getCatalog(),
    error: null,
  }));
  useEffect(() => {
    if (state.catalog) return;
    let cancelled = false;
    window.CatalogAPI.load()
      .then(c => { if (!cancelled) setState({ catalog: c, loading: false, error: null }); })
      .catch(e => { if (!cancelled) setState({ catalog: null, loading: false, error: e }); });
    return () => { cancelled = true; };
  }, []);
  return state;
}

function CatalogLoading() {
  return (
    <div className="pp-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
      <span className="dots"><span></span><span></span><span></span></span>
      <div className="mono" style={{ marginTop: 14, color: "var(--ink-3)" }}>Cargando catálogo…</div>
    </div>
  );
}

function CatalogError({ error, onRetry }) {
  return (
    <div className="pp-body" style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
      <p className="eyebrow">Error</p>
      <h2 className="title">No pudimos cargar el catálogo.</h2>
      <p className="body" style={{ color: "var(--ink-3)" }}>{error?.message || "Revisa tu conexión e intenta de nuevo."}</p>
      {onRetry && <Btn primary block lg onClick={onRetry}>Reintentar</Btn>}
    </div>
  );
}

function ScreenAuth({ onAuth }) {
  return (
    <div className="pp-screen pp-screen--has-cover">
      <div className="auth-bg" />
      <div className="pp-body" style={{ paddingTop: 60, paddingBottom: 32, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <p className="eyebrow eyebrow-dot">PowerPlay · v0.1</p>
        <h1 className="display">No estudies <em>Power skills</em>.<br/>Entrenalas.</h1>
        <p className="lede">Entra a escenarios cargados de tensión, habla con personajes vivos servidos por IA, y descubre cómo decides bajo presión. Cada partida cierra con un análisis personalizado de cómo jugaste.</p>

        <div style={{ flex: 1 }} />

        <div style={{ marginTop: 28 }}>
          <Btn primary block lg onClick={() => onAuth({ name: "Invitado", email: "invitado@perspectiveplay.app" })}>Ingresar como invitado</Btn>
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textAlign: "center", marginTop: 14, marginBottom: 0, textTransform: "uppercase" }}>
          Práctica inmersiva · Personajes con IA · Respaldo académico
        </p>
      </div>
    </div>
  );
}

// ── Catalog ────────────────────────────────────────────────────────
// Reemplaza la home. Recomendada arriba (Aethelgard, jugable), serie por
// serie abajo con sus capítulos como rows. Solo Aethelgard tiene status
// "available" — el resto se ve pero no es clicleable.

// Mapping tag → ribbon visual. Para agregar uno nuevo, basta con sumar
// una entrada acá; cualquier serie con ese tag muestra el ribbon.
const SERIES_RIBBONS = [
  { tag: "must",        label: "Fundamental", kind: "must" },
  { tag: "new",         label: "Nueva",       kind: "new" },
  { tag: "most_played", label: "Más jugada",  kind: "popular" },
];

function getSeriesRibbons(series) {
  const tags = series.tags || [];
  return SERIES_RIBBONS.filter(r => tags.includes(r.tag));
}

// Card única para una serie del catálogo.
// Muestra: título, bajada (tagline), cantidad de temporadas, skills,
// endorser y bibliografía. NO muestra capítulos.
//
// Variantes visuales (cambia solo el style, no el contenido):
//   - "hero"    → destacada, top de la home.
//   - "compact" → catálogo general, más densa.
//
// Es clicleable: tap → onOpen(series).
function SeriesCard({ series, variant = "compact", onOpen }) {
  const ribbons = getSeriesRibbons(series);
  const seasonsLabel = series.season_count === 1
    ? "1 temporada"
    : `${series.season_count} temporadas`;

  const Tag = onOpen ? "button" : "div";

  return (
    <Tag
      className={`series-card series-card--${variant}`}
      onClick={onOpen}
    >
      <div className="series-card-head">
        <div className="series-card-title">{series.title}</div>
        <div className="series-card-tagline">{series.tagline}</div>
      </div>

      <div className="series-card-meta">
        <span className="series-card-meta-chip">{seasonsLabel}</span>
        {series.difficulty && (
          <span className="series-card-meta-chip">{difficultyLabel(series.difficulty)}</span>
        )}
      </div>

      {series.skills.length > 0 && (
        <div className="series-card-block">
          <div className="series-card-block-lbl">Power skills</div>
          <div className="series-card-skills">
            {series.skills.map(s => (
              <span key={s.id} className="series-card-skill">{s.name}</span>
            ))}
          </div>
        </div>
      )}

      {series.endorser && (
        <div className="series-card-block">
          <div className="series-card-block-lbl">Avalado por</div>
          <div className="series-card-endorser">
            <div className="series-card-endorser-name">{series.endorser.name}</div>
            {(series.endorser.title || series.endorser.institution) && (
              <div className="series-card-endorser-sub">
                {[series.endorser.title, series.endorser.institution].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        </div>
      )}

      {series.bibliography.length > 0 && (
        <div className="series-card-block">
          <div className="series-card-block-lbl">Bibliografía</div>
          <ul className="series-card-biblio">
            {series.bibliography.map(b => (
              <li key={b.id}>
                <strong>{b.title}</strong>
                {b.authors?.length > 0 && <span> · {b.authors.join(", ")}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(ribbons.length > 0 || onOpen) && (
        <div className="series-card-footer">
          <div className="series-card-ribbons">
            {ribbons.map(r => (
              <span
                key={r.tag}
                className={`series-ribbon series-ribbon--${r.kind}`}
              >
                {r.label}
              </span>
            ))}
          </div>
          {onOpen && <div className="series-card-cta">Ver serie →</div>}
        </div>
      )}
    </Tag>
  );
}

// Card para cada objetivo del capítulo. Diferencia visualmente entre
// objetivo principal (primary) y objetivos extra (secondary).
function ObjectiveCard({ obj }) {
  const isPrimary = obj.type === "primary";
  const label = isPrimary ? "Objetivo principal" : "Objetivo extra";
  const ptsLabel = `${obj.points} ${obj.points === 1 ? "pt" : "pts"}`;
  return (
    <div className={`objective-card ${isPrimary ? "objective-card--primary" : "objective-card--secondary"}`}>
      <div className="objective-card-head">
        <span className="objective-card-label">
          {isPrimary ? "🎯" : "⭐"} {label}
        </span>
        <span className="objective-card-pts">{ptsLabel}</span>
      </div>
      <div className="objective-card-desc">{obj.description}</div>
      {obj.skills.length > 0 && (
        <div className="objective-card-skills">
          {obj.skills.map(s => (
            <span key={s.id} className="series-card-skill">{s.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function difficultyLabel(d) {
  return ({
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  })[d] || d;
}

function ScreenHome({ user, profile, onOpenSeries, onProfile }) {
  const { catalog, loading, error } = useCatalog();

  // "Recomendada para ti" = todas las series con el tag 'recommended'.
  // El resto cae en "Más series". Si una serie tiene el tag pero no tiene
  // capítulos cargados, queda afuera del hero.
  const hasTag = (s, tag) => (s.tags || []).includes(tag);
  const recommendedSeries = catalog ? catalog.series.filter(s => hasTag(s, 'recommended') && s.chapters.length > 0) : [];
  const otherSeries = catalog ? catalog.series.filter(s => !hasTag(s, 'recommended')) : [];

  return (
    <div className="pp-screen">
      <div className="pp-topbar" style={{ borderBottom: "none" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="mono">Hola</span>
          <span style={{ fontFamily: "var(--serif)", fontSize: 22 }}>{user.name}</span>
        </div>
        <button onClick={onProfile} style={{ background: "none", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 14px", color: "var(--ink)", fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
          Perfil · {profile.totalPoints}
        </button>
      </div>

      {loading && <CatalogLoading />}
      {error && <CatalogError error={error} onRetry={() => window.location.reload()} />}
      {catalog && (
        <div className="pp-body" style={{ paddingTop: 6 }}>
          {recommendedSeries.length > 0 && (
            <>
              <p className="eyebrow eyebrow-dot">
                {recommendedSeries.length === 1 ? "Recomendada para ti" : "Recomendadas para ti"}
              </p>
              <div className="series-stack">
                {recommendedSeries.map(s => (
                  <SeriesCard
                    key={s.id}
                    series={s}
                    variant="hero"
                    onOpen={() => onOpenSeries(s.id)}
                  />
                ))}
              </div>
            </>
          )}

          {otherSeries.length > 0 && (
            <>
              <div className="divider">Más series</div>
              <div className="series-stack">
                {otherSeries.map(s => (
                  <SeriesCard
                    key={s.id}
                    series={s}
                    variant="compact"
                    onOpen={() => onOpenSeries(s.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Series detail ──────────────────────────────────────────────────
// Lista los capítulos de una serie. Solo "available" son clicleables;
// el resto se muestra como "Próximamente".

function ScreenSeries({ seriesId, profile, onBack, onOpenChapter }) {
  const { catalog, loading, error } = useCatalog();
  const series = catalog?.series.find(s => s.id === seriesId);
  const hasCover = !!series?.thumbnail_url;
  return (
    <div className={`pp-screen ${hasCover ? "pp-screen--has-cover" : ""}`}>
      {!hasCover && <TopBar onBack={onBack} progress={0} totalSegments={1} label="Serie" />}
      {loading && <CatalogLoading />}
      {error && <CatalogError error={error} onRetry={() => window.location.reload()} />}
      {catalog && !series && (
        <div className="pp-body"><p className="body">Serie no encontrada.</p></div>
      )}
      {series && <ScreenSeriesBody series={series} onBack={onBack} onOpenChapter={onOpenChapter} />}
    </div>
  );
}

function ScreenSeriesBody({ series, onBack, onOpenChapter }) {
  const seasonCount = series.seasons.length;
  const seasonsLabel = seasonCount === 1 ? "1 temporada" : `${seasonCount} temporadas`;

  return (
    <div className="pp-body pp-body--with-cover">
      {series.thumbnail_url && (
        <div className="series-cover">
          <div
            className="series-cover-bg"
            style={{ backgroundImage: `url("${series.thumbnail_url}")` }}
          />
          <div className="series-cover-text">
            <div className="series-cover-eyebrow">
              <button
                className="series-cover-back"
                onClick={onBack}
                aria-label="Volver"
              >←</button>
              <span className="series-cover-eyebrow-text">Serie</span>
            </div>
            <h2 className="series-cover-title">{series.title}</h2>
          </div>
        </div>
      )}
      {!series.thumbnail_url && (
        <>
          <p className="eyebrow eyebrow-dot">Serie</p>
          <h2 className="title">{series.title}</h2>
        </>
      )}

      <div className="series-card-meta" style={{ marginTop: 4, marginBottom: 18 }}>
        <span className="series-card-meta-chip">{seasonsLabel}</span>
        {series.difficulty && (
          <span className="series-card-meta-chip">{difficultyLabel(series.difficulty)}</span>
        )}
        {series.estimated_duration && (
          <span className="series-card-meta-chip">~{series.estimated_duration} min</span>
        )}
      </div>

      {series.description && (
        <>
          <div className="divider">Sobre esta serie</div>
          <p className="body" style={{ whiteSpace: "pre-line" }}>{series.description}</p>
        </>
      )}

      {series.skills.length > 0 && (
        <>
          <div className="divider">Power skills</div>
          <div className="series-card-skills">
            {series.skills.map(s => (
              <span key={s.id} className="series-card-skill">{s.name}</span>
            ))}
          </div>
        </>
      )}

      {series.endorser && (
        <>
          <div className="divider">Avalado por</div>
          <div className="endorser-card">
            <div className="endorser-card-name">{series.endorser.name}</div>
            {(series.endorser.title || series.endorser.institution) && (
              <div className="endorser-card-sub">
                {[series.endorser.title, series.endorser.institution].filter(Boolean).join(" · ")}
              </div>
            )}
            {series.endorser.bio && (
              <p className="endorser-card-bio">{series.endorser.bio}</p>
            )}
          </div>
        </>
      )}

      {series.bibliography.length > 0 && (
        <>
          <div className="divider">Bibliografía</div>
          <ul className="series-card-biblio">
            {series.bibliography.map(b => (
              <li key={b.id}>
                <strong>{b.title}</strong>
                {b.authors?.length > 0 && <span> · {b.authors.join(", ")}</span>}
                {b.year && <span className="biblio-year"> ({b.year})</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {series.seasons.map(season => (
        <SeasonBlock
          key={season.id}
          series={series}
          season={season}
          onOpenChapter={onOpenChapter}
        />
      ))}
    </div>
  );
}

function SeasonBlock({ series, season, onOpenChapter }) {
  const label = `Temporada ${season.order}`;
  return (
    <>
      <div className="divider">{label}</div>
      <div className="season-block">
        <div className="season-block-title">{season.title}</div>
        {season.description && (
          <p className="season-block-desc">{season.description}</p>
        )}
        {season.narrative_context && (
          <div className="season-block-context">
            <div className="season-block-context-lbl">Contexto</div>
            <p>{season.narrative_context}</p>
          </div>
        )}
        <div className="series-chapters" style={{ marginTop: 14 }}>
          {season.chapters.map(ch => {
            const available = ch.status === "available";
            return (
              <button
                key={ch.id}
                className={`chapter-row chapter-row--btn ${available ? "" : "chapter-row--soon"}`}
                onClick={available ? () => onOpenChapter(series.id, ch.id) : undefined}
                aria-disabled={!available}
                disabled={!available}
              >
                <div className="chapter-code">{ch.code}</div>
                <div className="chapter-title">{ch.title}</div>
                {available
                  ? <div className="chapter-status chapter-status--go">Jugar →</div>
                  : <div className="chapter-status">Próximamente</div>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Chapter detail ─────────────────────────────────────────────────
// La ficha del capítulo + el botón Empezar (el que antes vivía en la home).

function ScreenChapter({ seriesId, chapterId, profile, onBack, onPlay }) {
  const { catalog, loading, error } = useCatalog();
  const series = catalog?.series.find(s => s.id === seriesId);
  const chapter = series?.chapters.find(c => c.id === chapterId);
  const hasCover = !!chapter?.thumbnail_url;

  if (loading) return <div className="pp-screen"><CatalogLoading /></div>;
  if (error)   return <div className="pp-screen"><CatalogError error={error} onRetry={() => window.location.reload()} /></div>;
  if (!chapter) return (
    <div className="pp-screen">
      <TopBar onBack={onBack} progress={0} totalSegments={1} label="…" />
      <div className="pp-body"><p className="body">Capítulo no encontrado.</p></div>
    </div>
  );

  const completed = profile.chapterStatus === "done";
  const inProgress = profile.chapterStatus === "in_progress";

  return (
    <div className={`pp-screen ${hasCover ? "pp-screen--has-cover" : ""}`}>
      {!hasCover && <TopBar onBack={onBack} progress={0} totalSegments={1} label={chapter.code} />}
      <div className="pp-body pp-body--with-cover">
        {hasCover && (
          <div className="series-cover">
            <div
              className="series-cover-bg"
              style={{ backgroundImage: `url("${chapter.thumbnail_url}")` }}
            />
            <div className="series-cover-text">
              <div className="series-cover-eyebrow">
                <button
                  className="series-cover-back"
                  onClick={onBack}
                  aria-label="Volver"
                >←</button>
                <span className="series-cover-eyebrow-text">
                  {series.title} · {chapter.code}
                </span>
              </div>
              <h2 className="series-cover-title">
                {chapter.title}
                {chapter.subtitle && (
                  <>
                    <br/>
                    <em style={{ fontStyle: "italic", color: "var(--accent)" }}>{chapter.subtitle.toLowerCase()}</em>
                  </>
                )}
              </h2>
            </div>
          </div>
        )}
        {!hasCover && (
          <>
            <p className="eyebrow eyebrow-dot">{series.title} · {chapter.code}</p>
            <h1 className="display" style={{ fontSize: 36, marginBottom: 14 }}>
              {chapter.title}
              {chapter.subtitle && (
                <>
                  <br/>
                  <em style={{ fontStyle: "italic", color: "var(--accent)" }}>{chapter.subtitle.toLowerCase()}</em>
                </>
              )}
            </h1>
          </>
        )}

        <div className="series-card-meta" style={{ marginTop: 4, marginBottom: 18 }}>
          {chapter.time && (
            <span className="series-card-meta-chip">{chapter.time}</span>
          )}
          {chapter.npcs > 0 && (
            <span className="series-card-meta-chip">
              {chapter.npcs} {chapter.npcs === 1 ? "NPC" : "NPCs"}
            </span>
          )}
          {chapter.framework && (
            <span className="series-card-meta-chip">{chapter.framework}</span>
          )}
        </div>

        {chapter.description && (
          <>
            <div className="divider">Sobre este capítulo</div>
            <p className="body" style={{ whiteSpace: "pre-line" }}>{chapter.description}</p>
          </>
        )}

        {chapter.objectives.length > 0 && (
          <>
            <div className="divider">Tus objetivos</div>
            <div className="objective-list">
              {chapter.objectives.map(o => <ObjectiveCard key={o.id} obj={o} />)}
            </div>
          </>
        )}

        {chapter.learning_objectives.length > 0 && (
          <>
            <div className="divider">Conceptos que vas a practicar</div>
            <ul className="learning-list">
              {chapter.learning_objectives.map((lo, i) => <li key={i}>{lo}</li>)}
            </ul>
          </>
        )}

        {chapter.bibliography.length > 0 && (
          <>
            <div className="divider">Bibliografía del capítulo</div>
            <ul className="series-card-biblio">
              {chapter.bibliography.map(b => (
                <li key={b.id}>
                  <strong>{b.title}</strong>
                  {b.authors?.length > 0 && <span> · {b.authors.join(", ")}</span>}
                  {b.year && <span className="biblio-year"> ({b.year})</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        <Btn primary block lg sticky onClick={onPlay}>
          {completed ? "Volver a jugar" : inProgress ? "Continuar" : "Empezar capítulo"}
        </Btn>
      </div>
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────────────
// Skills + última run + capítulos completados. Movido desde la home vieja.

function ScreenProfile({ user, profile, onBack }) {
  const completed = profile.chapterStatus === "done";
  return (
    <div className="pp-screen">
      <TopBar onBack={onBack} progress={0} totalSegments={1} label="Perfil" />
      <div className="pp-body">
        <p className="eyebrow eyebrow-dot">Tu cuenta</p>
        <h2 className="title">{user.name}</h2>
        <p className="body" style={{ color: "var(--ink-3)", marginTop: -4 }}>{profile.totalPoints} puntos totales</p>

        <div className="divider">Power skills</div>
        {profile.skills.map(s => (
          <div className="skill" key={s.name}>
            <div className="skill-row">
              <div className="skill-meta">{s.tier}</div>
              <div className="skill-name">{s.name}</div>
              <div className="skill-bar"><span style={{ width: `${(s.points / s.max) * 100}%` }} /></div>
            </div>
            <div className="skill-pts">{s.points}</div>
          </div>
        ))}

        {completed && (
          <>
            <div className="divider">Capítulos completados</div>
            <div className="card card-tight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aethelgard — Cap. 1</div>
                <div className="mono" style={{ marginTop: 4 }}>Última run · {profile.lastRun}</div>
              </div>
              <div className="stars">
                {[1,2,3].map(i => <span key={i} className={`star ${i <= profile.stars ? "" : "empty"}`}>★</span>)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenAuth, ScreenHome, ScreenSeries, ScreenChapter, ScreenProfile });
