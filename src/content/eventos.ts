import type { Evento } from "@/lib/eventos";

/**
 * Eventos del colegio — reemplaza las tablas Evento/Edicion/Multimedia.
 *
 * Para agregar uno: copiar un bloque, cambiar los textos y crear las carpetas
 * de media. Los AÑOS de galería se detectan solos leyendo las carpetas —
 * no se declaran acá. Ver docs/EVENTOS.md.
 *
 *   public/media/eventos/<slug>/
 *     hero/      → video o imagen de portada
 *     polaroid/  → fotos del bloque polaroid
 *     2026/      → galería de ese año  (soltar otra carpeta = otra edición)
 */
export const eventos: Evento[] = [
  {
    slug: "fomento-lector",
    nombre: "Fomento Lector",
    titulo: "Fomento Lector 2026 — De Peter Pan a Alicia en el país de las maravillas",
    extracto: "Peter Pan, Papelucho, El Principito, Coraline, Alicia en el país de las maravillas — cada curso eligió su aventura literaria.",
    fecha: "2026-04-20",
    publicado: true,
    texto: `
      El fomento lector en Garden College no vive en un solo evento — vive en un trasfondo que no se apaga. A lo largo del año, el profesor de Lenguaje y el equipo PIE mantienen la lectura presente con acciones puntuales: un afiche, un stand, una actividad suelta en el pasillo. Nunca se detiene del todo. Y cada año, en torno al Día Mundial del Libro, ese trasfondo sube de intensidad hasta estallar en una semana completa.

      Los cursos llevan días preparándose antes de que empiece: cartón, pintura, tela, maquillaje, convirtiendo cada sala en el escenario de un universo literario distinto. Este año, 4° medio construyó Wonderland — Alicia, el Sombrerero Loco, la Reina de Corazones. 3° medio eligió Coraline: sala oscura, telas negras, botones. En básica, Papelucho, fábulas, leyendas chilenas. Trece cursos, trece mundos simultáneos.

      El martes llega la Maratón Literaria Internivelada — los grandes leen a los chicos: 8° básico a 2°, 4° medio guiando a 1° medio. Liderazgo que no se enseña desde el pizarrón sino codo a codo, libro en mano. El viernes cierra con desfile por los Halls de ambas sedes, estudiantes de todos los niveles en personaje, diplomas y reconocimientos. Garden La Unión participa además en Booktubers CRA, la iniciativa nacional del Ministerio de Educación — la misma voz lectora que se sostiene todo el año, esta vez en video.

      El Ministerio marca la fecha. Lo que se hace con ella lo decide el colegio: no dejarla en un acto de una hora, sino sostenerla el resto del año, aunque nadie le ponga nombre de programa.
    `,
  },
  {
    slug: "gala-folclorica",
    nombre: "Gala Folclórica",
    titulo: "Gala Folclórica — Fiestas Patrias en Garden College",
    extracto: "El baile es la excusa. Lo que hace la Gala Folclórica es juntar a todo Garden College, cada septiembre, a sostener una tradición a propósito — la del país, y la propia.",
    fecha: "2026-09-14",
    publicado: false, // falta el material real (fotos/video) — ver LEEME.txt de la carpeta
    texto: `
      Cada septiembre, en el marco de Fiestas Patrias, Garden College hace su Gala Folclórica. El baile importa — se nota el trabajo detrás —, pero no es el punto final: es cómo la comunidad completa se junta a celebrar una tradición, la del país y la que el colegio mismo se ha construido a pulso, año tras año. Una nación con tradiciones fuertes es una nación fuerte; un colegio que sostiene las suyas, también.

      Sostenerla toma trabajo real. Mes y medio de ensayo dentro de las clases de Educación Física, con harto compromiso — el día previo se practica la jornada completa. El programa cambia cada año — quién abre, quién cierra, qué número nuevo arman los propios alumnos —, pero hay un clásico que nunca falta: el pie de cueca a la bandera, el que abre la gala propiamente tal después de los discursos. De ahí en adelante entran los bailes de todos los niveles y los apoderados, que también suben con su propio número.

      Nada de esto pasa porque el calendario lo pida. Pasa porque hay una convicción detrás: que una tradición no se hereda sola — se sostiene a propósito, generación tras generación. Para cuarto medio, además, tiene un peso puntual: es su última presentación pública como alumnos del colegio, el primer paso de una despedida que termina en la Licenciatura. Un colegio que hace este esfuerzo cada año está, en el fondo, diciendo algo sobre quién es.
    `,
  },
  {
    slug: "campeonatos-deportivos",
    nombre: "Campeonatos Deportivos",
    titulo: "Campeonato comunal de tenis de mesa",
    extracto: "Estudiantes demostraron talento y espíritu competitivo representando al colegio.",
    fecha: "2025-09-10",
    publicado: false,
    texto: `
      Nuestros estudiantes representaron a Garden College en el campeonato comunal de tenis de mesa, una disciplina que combina concentración, reflejos y estrategia.

      Con espíritu competitivo y juego limpio, nuestros deportistas dejaron el nombre del colegio en alto. El Departamento de Educación Física y Salud continúa impulsando la participación deportiva como parte esencial de la formación integral.
    `,
  },
  
];
