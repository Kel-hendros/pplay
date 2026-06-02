# Cómo se evalúa si el usuario gana o pierde

Diagnóstico del flujo actual de evaluación y por qué hoy es prácticamente imposible terminar en un mal escenario.

## TL;DR

**Hoy no existe un camino de "fracaso" real.** El sistema sólo sabe sumar puntos (mínimo 1, máximo `max_points`, default 3) y la pantalla final siempre celebra el resultado. Ni la UI, ni la lógica de scoring, ni el prompt del sistema, ni el guardado de sesión contemplan un final negativo. Hay 5 lugares concretos donde se "blindó" el final feliz, listados abajo.

---

## Cómo se llega al final hoy

El recorrido vive en [js/views/scenario-play.js](js/views/scenario-play.js) y depende de que el modelo emita un marcador `[SCENARIO_COMPLETE]` (o que `response.isEnding === true`) — no hay tope de turnos ni límite por tiempo.

```
intro → chat (turnos N) → AI emite [SCENARIO_COMPLETE] → completeScenario(points) → renderConclusion
```

El modelo es el único juez de cuándo termina. El cliente nunca corta.

## Cómo se calculan los puntos

Hay **dos** fuentes de puntaje, y ambas tienden hacia arriba:

### 1. Puntos que devuelve la IA en el cierre

En [js/views/scenario-play.js:362](js/views/scenario-play.js:362):

```js
ScenarioPlayView.completeScenario(response.points || 2);
```

- Si la IA no devuelve `points`, **default = 2/3**.
- Si la IA devolviera `0` (fracaso), el `||` lo convierte en `2`. → **bug de scoring**: un fracaso explícito se pisa como aprobado.

### 2. `OpenAI.evaluatePerformance()` como fallback

En [js/openai.js:376-397](js/openai.js:376):

```js
const positiveFeedback = OpenAI.conversationHistory.filter(m =>
    m.role === 'assistant' && m.content.includes('[FEEDBACK_POSITIVE]')
).length;

const points = Math.min(3, Math.max(1, positiveFeedback + 1));
```

- **Sólo cuenta `[FEEDBACK_POSITIVE]`.** Ignora por completo `[FEEDBACK_IMPROVEMENT]` — un usuario con 0 positivos y 10 negativos saca lo mismo que uno con 0 de ambos.
- **Piso forzado en 1.** No existe el 0 ni puntajes negativos.
- **Techo en 3.** Más positivos no penalizan, pero tampoco diferencian.
- El `summary` cubre sólo tres casos (3, 2, "otro") — y el "otro" ya es "Negociación completada. Considera practicar…", o sea, neutro-positivo.

## Cómo se muestra el cierre

En [js/views/scenario-play.js:481-528](js/views/scenario-play.js:481), el `renderConclusion` está cableado para celebrar siempre:

- Título fijo: **"🎉 ¡Escenario Completado!"**
- Estrellas: `points` de `max_points` (siempre al menos 1).
- Cierre con `Toast.show('¡Has ganado puntos de experiencia!', 'success')`.
- CTAs: "Repetir Escenario" / "Volver al Catálogo". No hay "Revisar errores" ni "Reintentar para zafar".

No existe una rama `if (failed)` en el render. **El cierre triste no está en el código.**

## Qué le decimos al modelo

El prompt de sistema lo genera [js/admin/components/prompt-generator.js](js/admin/components/prompt-generator.js). Los `failure_conditions` se incluyen como sección ([prompt-generator.js:218](js/admin/components/prompt-generator.js:218)), pero las **Instrucciones de Comportamiento** ([prompt-generator.js:261-282](js/admin/components/prompt-generator.js:261)) no le dan al modelo herramientas para señalar fracaso:

- Sólo distingue `[FEEDBACK_POSITIVE]` vs `[FEEDBACK_IMPROVEMENT]` — no hay un `[FEEDBACK_NEGATIVE]` que reste, ni un `[SCENARIO_FAILED]` distinto del `[SCENARIO_COMPLETE]`.
- No le pide explícitamente que devuelva un `points` numérico, ni que distinga "outcome: success | partial | failure".
- No le dice a los personajes que **abandonen la mesa / se levanten / se nieguen** si el usuario incumple las restricciones — apenas "solo ceden ante argumentos que satisfagan sus necesidades reales".
- No define qué pasa si se cumple una `failure_condition`: ¿el escenario termina ahí? ¿con qué puntaje? Queda a interpretación libre del modelo, que por sesgo de RLHF tiende a cerrar en tono colaborativo.

Además, el parser ([js/openai.js:142-167](js/openai.js:142)) reconoce `[FEEDBACK_POSITIVE]` y `[FEEDBACK_IMPROVEMENT]` pero **nada más** — si el modelo inventara `[FEEDBACK_NEGATIVE]` o `[SCENARIO_FAILED]`, se mostraría como texto plano.

## Qué se persiste

En `db.sessions.completeSession(sessionId, pointsEarned, conversation, feedbackHistory)` ([js/supabase.js:317](js/supabase.js:317)) sólo se guarda un número `points_earned`. No hay columna `outcome` / `passed` / `failed`. Y en [js/supabase.js:180-220](js/supabase.js:180), `updateUserSkill` **sólo suma** (`newPoints = existing + points`), nunca resta — un mal desempeño igual sube XP.

---

## Los 5 puntos a tocar si querés finales malos reales

Resumen procesable, en orden de impacto:

1. **Quitar el `|| 2` fallback** en [scenario-play.js:362](js/views/scenario-play.js:362). Que `0` signifique `0`.
2. **Cambiar el piso de `evaluatePerformance`** en [openai.js:383](js/openai.js:383). Restar por `[FEEDBACK_IMPROVEMENT]` (o introducir `[FEEDBACK_NEGATIVE]`) y permitir `points = 0`.
3. **Bifurcar `renderConclusion`** en [scenario-play.js:481](js/views/scenario-play.js:481). Si `points === 0` (o si llegó un marcador `[SCENARIO_FAILED]`), mostrar pantalla de fracaso, sin estrellas, con CTA a reintentar y un análisis de qué condición de fracaso disparó.
4. **Actualizar `generateInstructions`** en [prompt-generator.js:261](js/admin/components/prompt-generator.js:261) para:
    - pedir que termine con un JSON estructurado `{ outcome: "success" | "partial" | "failure", points: 0-N, reason: "..." }` en vez de marcadores;
    - autorizar a los personajes a abandonar la conversación o cerrarla en negativo si se incumplen sus restricciones / se gatilla una `failure_condition`;
    - obligar a citar la `failure_condition` específica que se cumplió.
5. **Hard cap de turnos** en [scenario-play.js](js/views/scenario-play.js) (p. ej. `MAX_TURNS = scenario.max_turns ?? 10`). Si se alcanza sin éxito → fracaso por timeout. Saca al modelo del único asiento del juez.

Como bonus, en `updateUserSkill` ([supabase.js:180](js/supabase.js:180)) decidir si un fracaso resta XP, no resta nada, o sólo no premia. Hoy siempre suma.
