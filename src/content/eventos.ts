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
    destacado: true,
    publicado: true,
    texto: `
      El fomento lector en Garden College no vive en un solo evento — vive en un trasfondo que no se apaga. A lo largo del año, el profesor de Lenguaje y el equipo PIE mantienen la lectura presente con acciones puntuales: un afiche, un stand, una actividad suelta en el pasillo. Nunca se detiene del todo. Y cada año, en torno al Día Mundial del Libro, ese trasfondo sube de intensidad hasta estallar en una semana completa.

      Los cursos llevan días preparándose antes de que empiece: cartón, pintura, tela, maquillaje, convirtiendo cada sala en el escenario de un universo literario distinto. Este año, 4° medio construyó Wonderland — Alicia, el Sombrerero Loco, la Reina de Corazones. 3° medio eligió Coraline: sala oscura, telas negras, botones. En básica, Papelucho, fábulas, leyendas chilenas. Trece cursos, trece mundos simultáneos.

      El martes llega la Maratón Literaria Internivelada — los grandes leen a los chicos: 8° básico a 2°, 4° medio guiando a 1° medio. Liderazgo que no se enseña desde el pizarrón sino codo a codo, libro en mano. El viernes cierra con desfile por los Halls de ambas sedes, estudiantes de todos los niveles en personaje, diplomas y reconocimientos. Garden La Unión participa además en Booktubers CRA, la iniciativa nacional del Ministerio de Educación — la misma voz lectora que se sostiene todo el año, esta vez en video.

      El Ministerio marca la fecha. Lo que se hace con ella lo decide el colegio: no dejarla en un acto de una hora, sino sostenerla el resto del año, aunque nadie le ponga nombre de programa.
    `,
  },
  {
    slug: "fiestas-patrias",
    nombre: "Fiestas Patrias",
    titulo: "Fiestas Patrias 2025 — Una semana de chilenidad en Garden College",
    extracto: "Ramadas, cueca, empanadas y parrillada. Toda la comunidad Garden celebró las fiestas patrias con una semana de actividades que fortalecen nuestra identidad y unión.",
    fecha: "2025-09-19",
    destacado: false,
    publicado: false,
    texto: `
      Durante la semana del 15 al 19 de septiembre, Garden College se vistió de colores patrios para celebrar la identidad chilena de la manera más auténtica: en comunidad.

      Los cursos compitieron en el concurso de empanadas, donde apoderados y estudiantes pusieron a prueba sus mejores recetas familiares. Las ramadas montadas por cada nivel llenaron los patios de olor a chilenería, con muelles, sopaipillas y bebidas tradicionales servidas con orgullo.

      El Departamento de Música y Artes organizó presentaciones de cueca, con parejas de todos los niveles desde pre-kínder hasta cuarto medio. Ver a los más pequeños bailar con sus trajes típicos fue uno de los momentos más emotivos de la semana, demostrando que la tradición se aprende y se vive desde los primeros años.

      El cierre de semana fue una gran convivencia familiar con parrillada, música en vivo y un show artístico que reunió a toda la comunidad Garden en una tarde de celebración, orgullo y chilenidad compartida. Una semana que reafirma que ser chileno también se enseña.
    `,
  },
  {
    slug: "campeonatos-deportivos",
    nombre: "Campeonatos Deportivos",
    titulo: "Campeonato comunal de tenis de mesa",
    extracto: "Estudiantes demostraron talento y espíritu competitivo representando al colegio.",
    fecha: "2025-09-10",
    destacado: false,
    publicado: false,
    texto: `
      Nuestros estudiantes representaron a Garden College en el campeonato comunal de tenis de mesa, una disciplina que combina concentración, reflejos y estrategia.

      Con espíritu competitivo y juego limpio, nuestros deportistas dejaron el nombre del colegio en alto. El Departamento de Educación Física y Salud continúa impulsando la participación deportiva como parte esencial de la formación integral.
    `,
  },
  
];
