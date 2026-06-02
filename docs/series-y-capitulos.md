# Serie y Capítulo — modelo de contenido

Fuente de verdad: **[Play Brief.md](Play%20Brief.md)** (sección 2 — Jerarquía de Contenido).

Este doc resume las propiedades formales de Serie/Capítulo según el Play Brief, las contrasta con lo que tenemos hoy en el cliente, y deja claro lo que falta.

---

## 0. La jerarquía oficial

```
Program  (Serie)
└── Season  (Temporada)        ← el catálogo del cliente NO tiene este nivel
    └── Chapter  (Capítulo)
        └── Scene  (Escena)    ← tampoco tiene este, los "momentos" M0..M6 están hardcodeados
```

**Progresión:** Temporadas y capítulos son secuenciales (hay que terminar el anterior para abrir el siguiente). Cada temporada es **autoconclusiva**: un mal desempeño en una temporada no penaliza la siguiente.

---

## 1. Program (Serie) — modelo formal

Unidad temática de alto nivel. Cubre una power skill o un conjunto relacionado. Contiene una o más temporadas.

| Propiedad | Tipo | Descripción | ¿Lo tenemos hoy? |
|---|---|---|---|
| `id` | string | Identificador único | ✅ |
| `title` | string | Nombre de la serie | ✅ |
| `description` | string | Descripción general | ⚠️ (sólo `tagline`, más corto) |
| `power_skills` | string[] | Skills que se trabajan | ❌ |
| `endorser` | Endorser | Académico o institución que avala | ❌ |
| `bibliography` | BibliographyEntry[] | Referencias académicas | ❌ |
| `difficulty` | enum | `beginner` / `intermediate` / `advanced` | ❌ |
| `estimated_duration` | number | Duración estimada total | ❌ |
| `seasons` | Season[] | Temporadas | ❌ (saltamos directo a chapters) |
| `thumbnail` | string | URL de portada | ❌ |
| `tags` | string[] | Tags para búsqueda | ❌ |

---

## 2. Season (Temporada) — modelo formal

Arco narrativo autoconclusivo dentro de una serie. **Hoy no existe en el cliente.** El catálogo salta de Serie a Capítulo directo.

| Propiedad | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador |
| `title` | string | Nombre (ej: "El Joint Venture") |
| `description` | string | Sinopsis del arco |
| `order` | number | Posición en la serie |
| `prerequisite` | string? | ID de la temporada anterior |
| `narrative_context` | string | Contexto narrativo de la temporada |
| `primary_objective` | Objective | Objetivo principal narrativo |
| `secondary_objectives` | Objective[] | Objetivos opcionales (puntos extra) |
| `chapters` | Chapter[] | Capítulos ordenados |
| `bibliography` | BibliographyEntry[] | Referencias específicas |
| `estimated_duration` | number | Duración estimada |
| `completion_badge` | Badge? | Badge al completar |

---

## 3. Chapter (Capítulo) — modelo formal

Unidad de aprendizaje dentro de una temporada. Tiene un **objetivo narrativo concreto** que determina si se completó. Si no se cumple, no hay pantalla de éxito: hay feedback detallado y se puede rehacer.

| Propiedad | Tipo | Descripción | ¿Lo tenemos hoy? |
|---|---|---|---|
| `id` | string | Identificador | ✅ |
| `title` | string | Nombre | ✅ |
| `description` | string | Resumen | ⚠️ (lo llamamos `sub`) |
| `order` | number | Posición en la temporada | ❌ (lo deducimos por `code`) |
| `primary_objective` | Objective | Objetivo principal — determina si se completó | ❌ |
| `secondary_objectives` | Objective[] | Objetivos opcionales (las "estrellas") | ❌ |
| `learning_objectives` | string[] | Skills pedagógicas que se practican | ❌ |
| `bibliography` | BibliographyEntry[] | Referencias del capítulo | ❌ |
| `scenes` | Scene[] | Escenas que lo componen | ❌ (hardcoded como M0..M6) |
| `scene_graph` | SceneGraph | DAG de transiciones | ❌ |
| `feedback_config` | FeedbackConfig | Config del feedback de cierre | ❌ |
| `estimated_duration` | number | Duración estimada | ⚠️ (lo tenemos como `time` string) |

Extras "visuales/UX" que metimos por necesidad del catálogo y que el modelo formal no exige:

- `code` (`"S01·E01"`) — composición visual del orden de season + chapter.
- `subtitle`, `npcs`, `framework`, `status` — para la ficha de catálogo.

---

## 4. Scene (Escena) — modelo formal

**Unidad mínima de interacción**, hoy ausente en el cliente. Cada escena tiene un `type`:

- `text` — memo, email, news, document.
- `npc-interaction` — chat con personaje IA (lo único que tenemos, hoy hardcodeado en `screens-npcs.jsx`).
- `software-simulation` — emular un messenger, email client, spreadsheet.
- `choice` — punto de decisión (binary / multiple / timed).
- `multimedia` — video / imagen / audio.
- `narration` — bloque narrativo, static o generative.

Las escenas se conectan por **transitions** (con condiciones: `choice-selected`, `npc-sentiment`, `score-threshold`, etc.) formando un **DAG** (siempre se avanza, nunca se vuelve atrás).

> **Principio explícito del Brief:** No hay loops. Si el capítulo necesita que el usuario "vuelva" a una situación parecida, se crea una **nueva instancia** más adelante en el grafo con el estado actualizado.

---

## 5. Sistema de scoring (Objectives & ChapterResult)

El Play Brief detalla cómo se determina si un capítulo "se completó":

- **`Objective`** — narrativo y binario. Tiene `narrative_description` visible al usuario, `skill_refs`, `points_value`, `evaluation_method` (`ai-assessed` / `state-based` / `hybrid`), `success_criteria` (interno para la IA), y `visible_to_user` (los secundarios pueden ser sorpresa).
- **`ChapterResult`** — al final del run: `primary_objective_met`, `secondary_objectives_met[]`, `stars` (1 si solo primario, hasta N si todos), `skill_points_earned[]` (solo puntos nuevos respecto de runs previos), `feedback`.
- **High watermark:** los puntos se guardan acumulados como mejor resultado entre todos los runs. Rejugar un objetivo ya completado no vuelve a dar puntos pero sí da feedback nuevo. El historial se preserva como "cuaderno de aprendizaje".

> Esto es la **respuesta al gap que detectamos antes** (no se puede "perder" en Aethelgard): el modelo oficial dice que si `primary_objective_met = false`, **no hay pantalla de éxito**. Hoy el código siempre festeja. Ver [evaluacion-escenarios.md](evaluacion-escenarios.md).

---

## 6. NPCs — modelo de dos capas

Los NPCs no son entidades de Capítulo sino **componentes de Escenas de tipo `npc-interaction`**. Y se dividen en:

- **`NPCTemplate`** — el "molde" estático: `name`, `role`, `personality_base`, `system_prompt`, `agenda_template`, `boundaries`, `voice_profile`, `variation_config`.
- **`NPCInstance`** — la versión concreta para un run: estado emocional inicial, modifier de personalidad aplicado, agenda concreta (rigid/negotiable/adaptive), `context_snapshot`, y un log de `NPCEvolution` (cómo cambió durante la partida).

Esto explicita una decisión de diseño importante: **cada run del mismo capítulo da un NPC distinto** dentro de los rangos definidos por el template. Hoy Sia y Harrison son determinísticos (mismo prompt cada vez).

---

## 7. Otros componentes que aparecen en Play Brief

- **`ChapterState`** — estado persistente de un run (current_scene, decisions[], npc_instances[], variables, started_at, pacing_state...).
- **`PacingState`** — pausas narrativas justificadas por la ficción ("el directorio se reúne mañana") para gestionar costo de IA + engagement sostenido, sin romper inmersión con "volvé en 2 horas".
- **`PlayerProfile`** + **`SkillScore`** + **`Badge`** — la hoja de personaje exportable / verificable.
- **`SkillDomain`** + **`Skill`** + **`SkillFrameworkRef`** — taxonomía. Una skill puede pertenecer a múltiples domains; los puntos son permanentes; los niveles (`novice` → `expert`) usan curva progresiva tipo RPG.

---

## 8. Lo que dice el PRD de la demo

El [PRD - Demo Implementation.md](PRD%20-%20Demo%20Implementation.md) **explícitamente marca como Non-Goal**:

> "Catálogo de escenarios. Es un solo escenario (Aethelgard). No hay pantalla de selección ni navegación entre capítulos. Razón: un escenario bien ejecutado demuestra más que diez a medias."

> "Perfil de jugador / scoring persistente. No hay estrellas, no hay puntos, no hay historial entre sesiones. Razón: no necesitamos retención para la demo."

Y su modelo de datos (Supabase) tiene 6 tablas (`runs`, `npc_instances`, `messages`, `conversation_summaries`, `feedback`, `npc_templates`) — sin `series`, `seasons`, `chapters` ni `scenes`. Es **modelo de un solo escenario hardcodeado**, no del catálogo de la plataforma.

---

## 9. Resumen ejecutivo: qué tenemos vs. qué necesitamos

- **Catálogo / Serie / Capítulo (cliente)** — hoy son JS hardcodeado en [content.js → CONTENT.catalog](../content.js). Cubre ~30% del modelo Program/Chapter del Brief. Falta: Season, scenes, primary/secondary objectives, bibliography, endorser, difficulty, skills, scoring real.
- **PRD ≠ Play Brief.** El PRD describe la demo aislada sin catálogo; el Play Brief describe la plataforma final con catálogo + temporadas + scenes. **Lo que estamos construyendo hoy es un híbrido**: añadimos un catálogo (Non-Goal del PRD) pero sin la riqueza del Play Brief.
- **Aethelgard** (la única "scene playable" hoy) implementa pre-Brief: usa M0..M6 cableados en `app.jsx`, no `scenes` + `scene_graph`. Está adelantado en NPCs (Sia y Harrison con prompts ricos, parecidos al `NPCTemplate` del Brief) pero atrasado en scoring (sin objectives, sin chapter result, sin posibilidad de fracaso).

### Preguntas de dirección abiertas

1. **¿Movemos el catálogo del cliente a DB siguiendo el modelo del Play Brief** (Program / Season / Chapter / Scene tablas), o lo dejamos hardcodeado en JS hasta tener más capítulos?
2. **¿Modelamos Aethelgard como un Chapter con N Scenes** (M0 = narration scene, M1 = text + narration, M2 = choice scene, M3/M4 = npc-interaction scenes, M5 = choice + narration, M6 = feedback) o lo dejamos como flujo cableado?
3. **¿Implementamos `primary_objective` + `secondary_objectives`** para Aethelgard (ahora sí se puede ganar/perder) o seguimos con el final feliz fijo?
