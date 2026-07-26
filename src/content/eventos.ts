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
    nombre: "Semana del Fomento Lector",
    titulo: "Fomento Lector 2026 — De Peter Pan a Alicia en el país de las maravillas",
    extracto: "Peter Pan, Papelucho, El Principito, Coraline, Alicia en el país de las maravillas — cada curso eligió su aventura literaria.",
    fecha: "2026-04-20",
    destacado: true,
    publicado: true,
    texto: `
      Cada año, en torno al Día Mundial del Libro, Garden College se transforma.
No es una metáfora — es literal. Las salas dejan de ser salas. Mientras el colegio se prepara, los cursos ya llevan días construyendo sus mundos: cartón, pintura, tela, maquillaje, horas de trabajo colectivo convirtiendo cada espacio en el escenario de un universo literario distinto. Algo despierta en los pasillos antes de que empiece la semana. Quienes han estado antes, lo reconocen.

      Este año, 4° medio eligió Wonderland. Alicia, el Sombrerero Loco, la Reina de Corazones y los soldados naipe aparecieron en una sala que dejó de ser una sala — todo construido por los mismos estudiantes que días antes estaban en el suelo pintando cartones gigantes. En 3° medio eligieron a Coraline: sala oscura, telas negras, botones. En básica, Papelucho, fábulas, leyendas chilenas. Trece universos simultáneos, trece equipos que apostaron en serio.

      La semana tiene su propio ritmo, como siempre lo ha tenido. El lunes activa. El martes llega la Maratón Literaria Internivelada — estaciones de lectura donde los grandes leen a los chicos: 8° básico a 2°, 4° medio guiando a 1° medio. Liderazgo que no se enseña desde el pizarrón sino codo a codo, libro en mano. El miércoles, producción escrita y murales sobre autores chilenos. El jueves, expresión oral y galería abierta. Y el viernes, el cierre.

      El viernes es el cierre, y siempre lo dice todo. Desfile por los Halls de nuestras sedes — estudiantes de todos los niveles en personaje, mezclados, mundos distintos compartiendo el mismo espacio por un momento. La comunidad mirando desde nuestras transmisiones online. Diplomas, reconocimientos, el Director en el medio de todo. Y después, silencio. Hasta el próximo año.

      Garden La Unión también participa en Booktubers CRA, la iniciativa nacional del Ministerio de Educación donde estudiantes voluntarios recomiendan un libro en video — porque la voz lectora de nuestros alumnos no se queda dentro del colegio.

      Nada de esto ocurre porque el calendario lo exige. El Ministerio de Educación marca la ocasión — Garden College decide qué hacer con ella. Creemos que formar personas capaces de pensar por sí mismas, expresarse con confianza y reconocer todo lo que es verdadero y bello, no cabe en una hora de acto. Cabe en una semana entera — bien ejecutada. Año tras año.
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
