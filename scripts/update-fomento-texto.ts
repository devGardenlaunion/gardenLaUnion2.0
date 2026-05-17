/**
 * Actualiza el texto narrativo del evento "Semana del Fomento Lector" en la BD.
 * Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/update-fomento-texto.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NUEVO_TEXTO = `Cada año, en torno al Día Mundial del Libro, Garden College se transforma.
No es una metáfora — es literal. Las salas dejan de ser salas. Mientras el colegio se prepara, los cursos ya llevan días construyendo sus mundos: cartón, pintura, tela, maquillaje, horas de trabajo colectivo convirtiendo cada espacio en el escenario de un universo literario distinto. Algo despierta en los pasillos antes de que empiece la semana. Quienes han estado antes, lo reconocen.

Este año, 4° medio eligió Wonderland. Alicia, el Sombrerero Loco, la Reina de Corazones y los soldados naipe aparecieron en una sala que dejó de ser una sala — todo construido por los mismos estudiantes que días antes estaban en el suelo pintando cartones gigantes. En 3° medio eligieron a Coraline: sala oscura, telas negras, botones. En básica, Papelucho, fábulas, leyendas chilenas. Trece universos simultáneos, trece equipos que apostaron en serio.

La semana tiene su propio ritmo, como siempre lo ha tenido. El lunes activa. El martes llega la Maratón Literaria Internivelada — estaciones de lectura donde los grandes leen a los chicos: 8° básico a 2°, 4° medio guiando a 1° medio. Liderazgo que no se enseña desde el pizarrón sino codo a codo, libro en mano. El miércoles, producción escrita y murales sobre autores chilenos. El jueves, expresión oral y galería abierta. Y el viernes, el cierre.

El viernes es el cierre, y siempre lo dice todo. Desfile por los Halls de nuestras sedes — estudiantes de todos los niveles en personaje, mezclados, mundos distintos compartiendo el mismo espacio por un momento. La comunidad mirando desde nuestras transmisiones online. Diplomas, reconocimientos, el Director en el medio de todo. Y después, silencio. Hasta el próximo año.

Garden La Unión también participa en Booktubers CRA, la iniciativa nacional del Ministerio de Educación donde estudiantes voluntarios recomiendan un libro en video — porque la voz lectora de nuestros alumnos no se queda dentro del colegio.

Nada de esto ocurre porque el calendario lo exige. El Ministerio de Educación marca la ocasión — Garden College decide qué hacer con ella. Creemos que formar personas capaces de pensar por sí mismas, expresarse con confianza y reconocer todo lo que es verdadero y bello, no cabe en una hora de acto. Cabe en una semana entera — bien ejecutada. Año tras año.`;

async function main() {
  const result = await prisma.evento.update({
    where: { slug: "fomento-lector" },
    data: { descripcion: NUEVO_TEXTO },
  });
  console.log(`✅ Texto actualizado para: ${result.nombre}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
