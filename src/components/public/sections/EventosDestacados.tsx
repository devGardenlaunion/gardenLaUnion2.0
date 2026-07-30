import { getConfig } from "@/lib/config";
import {
  getEventoDestacado,
  getEventosGrid,
  getMediaEvento,
  type Evento,
} from "@/lib/eventos";
import EventosWrapper, { type EdicionCard } from "./EventosWrapper";

/** Evento del contenido → card que espera el wrapper. */
function aCard(evento: Evento): EdicionCard {
  const media = getMediaEvento(evento);

  return {
    slug: evento.slug,
    nombre: evento.nombre,
    titulo: evento.titulo,
    extracto: evento.extracto,
    fecha: evento.fecha,
    // El video manda; la portada queda SIEMPRE como poster del video (y como
    // fallback si no hay video). El video móvil usa su propio clip si existe.
    heroVideo: media.heroVideo,
    heroVideoMobile: media.heroVideoMobile,
    imagenPortada: media.portada,
  };
}

export default async function EventosDestacados() {
  const config = await getConfig();

  const destacado = getEventoDestacado();
  const grid = getEventosGrid();

  if (!destacado && grid.length === 0) return null;

  const heroEdicion = destacado ? aCard(destacado) : null;
  const gridEdiciones = grid.map(aCard);

  // Tira de miniaturas cuando el destacado es la única historia publicada:
  // da profundidad con la galería real en vez de dejar el espacio del grid vacío.
  const fotosHero =
    destacado && gridEdiciones.length === 0
      ? getMediaEvento(destacado).galeria
      : [];

  return (
    <EventosWrapper
      heroEdicion={heroEdicion}
      gridEdiciones={gridEdiciones}
      fotosHero={fotosHero}
      titulo={config["eventos.titulo"] || "Eventos Garden"}
      subtitulo={
        config["eventos.subtitulo"] ||
        "Tradiciones que construyen comunidad cada año"
      }
      badge={config["eventos.badge"] || "Lo que vivimos"}
      nombre={config["institucional.nombre"] || "Garden College"}
    />
  );
}
