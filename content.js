// Static content for the demo. All NPC personas and prose live here.

const CONTENT = {
  meta: {
    chapter: "Capítulo 01 — Aethelgard",
    series: "PowerPlay · Game Theory & Drama Theory",
  },

  // Momento 0
  rol: {
    title: "Tu rol",
    paragraphs: [
      "Eres el CEO interino de Aethelgard, una empresa de tecnología de energía limpia.",
      "Llevas más de 5 años en la empresa. Conoces a la gente, entiendes el negocio, y sabes cómo se mueven las cosas por adentro. Cuando la CEO anterior se fue por diferencias con el Board, te ofrecieron el puesto de transición. Aceptaste — no solo por responsabilidad, sino porque sabes que si demuestras que tienes las Power Skills necesarias, el puesto puede ser tuyo.",
      "Hoy es tu primera prueba real.",
    ],
    tipsTitle: "Cómo jugar",
    tipsIntro: "Lo que viene es una situación de crisis. Vas a recibir información, hablar con personas, y tomar decisiones. No hay respuestas correctas — hay mejores y peores formas de manejar cada situación.",
    tips: [
      ["Escucha antes de hablar.", "Cada persona que encuentres tiene su propia agenda. Entender qué quieren te da ventaja."],
      ["Lo que dices importa.", "En las conversaciones, puedes escribir lo que quieras. Cómo lo digas va a cambiar cómo te respondan."],
      ["Todo conecta.", "Lo que hagas en una conversación puede abrir o cerrar puertas en la siguiente."],
      ["No intentes tener razón — intenta ser efectivo.", "A veces la mejor jugada no es la más obvia."],
      ["Piensa y actúa estratégicamente.", "No dejes que tu ego tome tus decisiones."],
    ],
  },

  // Momento 1
  rachelMessage: {
    sender: "Rachel Voss",
    role: "Chief of Staff",
    subject: "Titan Energy — Oferta pública",
    body: [
      "Hace 20 minutos Titan Energy hizo pública una oferta de adquisición por Aethelgard. La oferta es de $2.1B — un 30% por debajo de nuestra última valuación.",
      "Marcus Thorne, el CEO de Titan, dio una conferencia de prensa diciendo que “Aethelgard tiene tecnología prometedora pero un liderazgo que no está a la altura del desafío.”",
      "La prensa ya está llamando. El Board se enteró por las noticias, no por nosotros. Lord Harrison me acaba de escribir pidiendo una reunión de emergencia.",
      "Tienes 48 horas antes de que la Junta vote si acepta o rechaza la oferta.",
      "Te armé un dossier. Adentro está todo: quiénes son los actores, qué quiere cada uno, dónde estamos parados.",
      "No suavizo: esto es lo más difícil que te va a tocar. Pero por algo te pusieron aquí.",
      "— Rachel",
    ],
  },

  dossier: {
    situacion: [
      "Aethelgard es una empresa de tecnología de energía fundada hace 7 años por la Dra. Sia Kapoor. La empresa desarrolló un prototipo de reactor de fusión compacto que podría revolucionar la generación de energía limpia. Última ronda: valuación de $3B.",
      "Hace unas semanas el Board te nombró CEO interino tras la salida abrupta de la CEO anterior. Conoces Aethelgard por dentro, pero liderar es otra cosa.",
      "Hoy, Titan Energy hizo pública una oferta no solicitada por $2.1B. Deadline: 48 horas para que la Junta vote.",
      "Complicación crítica: el prototipo tiene una falla técnica sin resolver. Si Titan se entera (o si ya lo sabe), puede usarla para justificar la valuación baja.",
    ],
    actores: [
      {
        name: "Dra. Sia Kapoor",
        role: "Fundadora y CTO",
        tone: "risk",
        accent: "#c08a3e",
        bullets: [
          "74 años. Doctora en Física de Plasmas. La única persona que entiende a fondo la falla del prototipo.",
          "Lleva meses hablando de retirarse — quiere pasar tiempo con sus nietos.",
          "Si Sia se va, Aethelgard pierde a quien puede arreglar el reactor.",
        ],
        quiere: "Descansar. Pero también que lo que construyó no se destruya.",
        peligro: "Está casi decidida a irse.",
      },
      {
        name: "Lord Edmund Harrison",
        role: "Presidente del Board · voto decisivo",
        tone: "ally",
        accent: "#3a567c",
        bullets: [
          "Aristócrata británico. Angel investor original. No entiende la tecnología — invirtió por la visión de Sia.",
          "Es el voto decisivo: si Harrison vota no, el Board lo acompaña.",
          "Su miedo: que la falla no se corrija a tiempo y la empresa termine valiendo menos que la oferta.",
        ],
        quiere: "Saber que si vota no, no está apostando a un caballo muerto.",
        peligro: "Si Sia se va, su instinto es aceptar la oferta y salir.",
      },
      {
        name: "Marcus Thorne",
        role: "CEO de Titan Energy",
        tone: "foe",
        accent: "#a23b3b",
        bullets: [
          "Reputación de comprar tecnología prometedora a precio de descuento.",
          "Insinuó en prensa que Aethelgard “tiene problemas internos” — puede saber de la falla, o tirar un farol.",
          "Cada hora sin respuesta le da más espacio para presionar.",
        ],
        quiere: "Comprar Aethelgard barato, antes de que la falla se haga pública.",
        peligro: "Controla la narrativa pública si nadie le responde.",
      },
    ],
    favor: [
      "Tecnología de fusión que nadie más tiene. Si el prototipo funciona, valemos mucho más de $3B.",
      "48 horas también es poco para Titan. Si no entramos en pánico, Thorne tiene que justificar su oferta ante sus accionistas.",
      "El mercado de energía limpia está en auge — hay otros compradores potenciales si quieres contraoferta.",
    ],
    contra: [
      "La falla del prototipo. Si se hace pública, la valuación cae.",
      "Sia amenaza con irse. Sin ella, no hay quien arregle el prototipo.",
      "Harrison tiene miedo. Si no lo convences, vota sí.",
      "Eres nuevo en el rol. Todavía tienes que demostrar que puedes liderar bajo presión.",
    ],
  },

  transition1c: {
    notif: "Thorne acaba de dar otra conferencia. Dice que espera una respuesta “profesional y rápida”. La prensa nos está reventando el teléfono. ¿Qué hacemos?",
    narrator: "Tu bandeja explota. Tres periodistas pidiendo declaraciones. Un analista de Goldman publicó una nota diciendo que la oferta de Titan “refleja el riesgo real del pipeline tecnológico de Aethelgard”. Y en el grupo de WhatsApp del equipo ejecutivo, nadie dice nada — todos esperan que hables tú primero.\n\nEs tu primera crisis como CEO. Y el reloj ya está corriendo.",
  },

  // Momento 2
  m2: {
    intro: "Si no hacemos algo, el Board se va a dejar llevar por el pánico y va a votar sí antes de que tengamos chance de armar una defensa. Te preparé las opciones — pero la decisión es tuya.",
    options: [
      {
        id: "datos_publicos",
        title: "Controlar la narrativa con datos",
        sub: "Refutar públicamente la valuación de Titan con números reales.",
        body: "Pedirle al equipo de análisis financiero un informe con la valuación real — pipeline, contratos, IP, proyecciones — y salir a confrontar a Titan en medios y redes. Demostrar que $2.1B es una oferta ridícula para una empresa que vale $3B+.",
        rachel: "Es agresivo pero claro. Si los números son sólidos, la prensa nos hace caso. El riesgo: una vez que peleamos en público, la historia se vuelve un espectáculo — y eso presiona a todos, incluyendo al Board.",
      },
      {
        id: "auditoria_independiente",
        title: "Pedir una auditoría independiente",
        sub: "Meter a un tercero externo que valide la situación real.",
        body: "Contratar una firma de auditoría externa. Argumento público: “No aceptamos ni rechazamos hasta que un tercero independiente evalúe.” Suena razonable. El problema: si encuentran la falla del prototipo antes de que la arreglemos, esa información queda en registro formal — y Titan la usa.",
        rachel: "Suena bien en los diarios. Pero una auditoría no la controlamos. Si encuentran lo del prototipo antes de que lo arreglemos... estamos entregando nuestras debilidades en bandeja.",
      },
      {
        id: "campaña_emocional",
        title: "Controlar la narrativa desde lo emocional",
        sub: "Apelar a los valores de Aethelgard para ganarse al público.",
        body: "Campaña sobre la misión: energía limpia, innovación nacional, el equipo que construyó algo que nadie más pudo. No atacar a Titan — generar un relato positivo que haga que vender se sienta como una traición.",
        rachel: "Es la jugada de mediano plazo. Si tenemos tiempo, funciona. Pero tenemos 48 horas, no 48 días. Y consume recursos que podríamos necesitar para otras cosas.",
      },
      {
        id: "regulador_monopolio",
        title: "Bloquear la compra por concentración",
        sub: "Escalar al ente regulador alegando monopolio.",
        body: "Denuncia formal ante el regulador antimonopolio. Si acepta investigar, la oferta queda congelada por meses. Es la opción nuclear.",
        rachel: "Esto es ir a la guerra. Si tiramos esta carta, no hay vuelta atrás. Titan nos va a odiar, el regulador va a revisar todo con lupa — incluyendo nuestros trapos sucios — y el Board va a sentir que perdió el control.",
      },
      {
        id: "silencio_estrategico",
        title: "No responder públicamente",
        sub: "Bajar el volumen mediático y trabajar puertas adentro.",
        body: "No emitir comunicado. No darle a Thorne el espectáculo. Dejar que la noticia se enfríe sola y trabajar puertas adentro: hablar con Sia y Harrison sin la presión de los medios.",
        rachel: "Es contraintuitivo pero tiene lógica. Si no le damos combustible al circo, la presión baja para todos — también para el Board. El problema: Thorne es muy bueno hablando solo. Si no decimos nada, él dice todo.",
      },
    ],
  },

  // Briefs del equipo (pre-chat)
  briefs: {
    sia: {
      analyst: "Cassie · Analista del equipo",
      lines: [
        "Doctora en física de plasmas, 74 años. Más de cuatro décadas de carrera, mayormente en la academia, antes de fundar Aethelgard hace 7 años con su propia investigación.",
        "Brillante pero está harta. Desconfía profundamente del lado corporativo. Lleva meses hablando de jubilarse — quiere estar con sus nietos.",
        "La oferta de Titan le suena mal pero también le da una salida que ella ya quería. Cuidado con dos cosas: no la trates como un activo, y no le hables como inversor. Va a notar la diferencia.",
        "Si le hablas de “sinergias” o “alinear stakeholders” te corta el teléfono.",
      ],
    },
    harrison: {
      analyst: "Diego · Liaison del Board",
      lines: [
        "Aristócrata británico vieja escuela. Angel investor original. Puso plata en Aethelgard porque cree en lo que Sia quiere hacer, no porque entienda la tecnología.",
        "Es el voto decisivo: si Harrison vota no, el Board lo acompaña. Si Sia se va, él no tiene motivo para apoyar esto.",
        "Háblale desde la confianza, no desde los números — los números se los puede sacar un analista. Y sé honesto sobre lo que pasó con Sia: él ya tiene su propia lectura y va a notar si maquillas.",
      ],
    },
  },

  // ── Catálogo de series ────────────────────────────────────────────
  // Aethelgard es la única jugable hoy. El resto son mocks visuales
  // (status "soon") — se muestran pero no son clicleables.
  catalog: {
    featuredSeriesId: "crisis-ejecutiva",
    series: [
      {
        id: "crisis-ejecutiva",
        title: "Crisis ejecutiva",
        tagline: "Decisiones bajo presión en la sala del Board.",
        chapters: [
          {
            id: "aethelgard",
            code: "S01·E01",
            title: "Aethelgard",
            subtitle: "La oferta hostil",
            sub: "Eres el CEO interino de una empresa de fusión. En 48 horas, la Junta vota. Tienes que llegar preparado.",
            status: "available",
            time: "20–25 min",
            npcs: 2,
            framework: "Game Theory",
          },
        ],
      },
      {
        id: "el-otro-lado",
        title: "El otro lado de la mesa",
        tagline: "Negociar con clientes, proveedores y sindicatos.",
        chapters: [
          { id: "ol-1", code: "S01·E01", title: "El cliente que quiere irse", status: "soon" },
          { id: "ol-2", code: "S01·E02", title: "La huelga de logística", status: "soon" },
          { id: "ol-3", code: "S01·E03", title: "El proveedor estratégico", status: "soon" },
        ],
      },
      {
        id: "dias-dificiles",
        title: "Días difíciles",
        tagline: "Las conversaciones que nadie quiere tener.",
        chapters: [
          { id: "dd-1", code: "S01·E01", title: "Feedback que no se quiere oír", status: "soon" },
          { id: "dd-2", code: "S01·E02", title: "El despido", status: "soon" },
        ],
      },
      {
        id: "heredar-el-cargo",
        title: "Heredar el cargo",
        tagline: "Los primeros 90 días en un puesto nuevo.",
        chapters: [
          { id: "hc-1", code: "S01·E01", title: "La reunión de bienvenida", status: "soon" },
          { id: "hc-2", code: "S01·E02", title: "El predecesor que no se va", status: "soon" },
        ],
      },
    ],
  },
};

window.CONTENT = CONTENT;
