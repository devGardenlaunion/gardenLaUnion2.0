import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import EventosWrapper, { type EdicionCard, type EventoMinimo } from "./EventosWrapper";

function serializeEdicion(edicion: {
  id: string;
  titulo: string;
  slug: string;
  extracto: string;
  contenido: string;
  imagenPortada: string | null;
  fecha: Date;
  destacada: boolean;
  evento: {
    id: string;
    nombre: string;
    slug: string;
    recurrencia: string;
    ediciones: { id: string; titulo: string; slug: string; fecha: Date }[];
  };
  multimedia: {
    id: string;
    tipo: string;
    url: string;
    thumbnail: string | null;
    titulo: string | null;
    orden: number;
  }[];
}): EdicionCard {
  return {
    ...edicion,
    fecha: edicion.fecha.toISOString(),
    evento: {
      ...edicion.evento,
      ediciones: edicion.evento.ediciones.map((e) => ({
        ...e,
        fecha: e.fecha.toISOString(),
      })),
    },
  };
}

const edicionInclude = {
  evento: {
    include: {
      ediciones: {
        where: { estado: "PUBLICADA" as const },
        orderBy: { fecha: "desc" as const },
        select: { id: true, titulo: true, slug: true, fecha: true },
      },
    },
  },
  multimedia: { orderBy: { orden: "asc" as const } },
} as const;

const gridInclude = {
  evento: {
    select: { id: true, nombre: true, slug: true, recurrencia: true },
  },
  multimedia: {
    orderBy: { orden: "asc" as const },
    take: 1,
  },
} as const;

export default async function EventosDestacados() {
  const [config, heroRaw, todosEventos] = await Promise.all([
    getConfig(),
    prisma.edicion
      .findFirst({
        where: { estado: "PUBLICADA", destacada: true },
        orderBy: { fecha: "desc" },
        include: edicionInclude,
      })
      .then(async (destacada) => {
        if (destacada) return destacada;
        return prisma.edicion.findFirst({
          where: { estado: "PUBLICADA" },
          orderBy: { fecha: "desc" },
          include: edicionInclude,
        });
      }),
    prisma.evento.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, slug: true, recurrencia: true },
    }),
  ]);

  const gridRaw = await prisma.edicion.findMany({
    where: {
      estado: "PUBLICADA",
      ...(heroRaw ? { id: { not: heroRaw.id } } : {}),
    },
    orderBy: { fecha: "desc" },
    take: 3,
    include: gridInclude,
  });

  if (!heroRaw && gridRaw.length === 0) return null;

  const heroEdicion = heroRaw ? serializeEdicion(heroRaw as Parameters<typeof serializeEdicion>[0]) : null;

  const gridEdiciones = gridRaw.map((e) =>
    serializeEdicion({
      ...e,
      evento: {
        ...e.evento,
        ediciones: [],
      },
    } as Parameters<typeof serializeEdicion>[0])
  );

  return (
    <EventosWrapper
      heroEdicion={heroEdicion}
      gridEdiciones={gridEdiciones}
      todosEventos={todosEventos as EventoMinimo[]}
      titulo={config["eventos.titulo"] || "Eventos Garden"}
      subtitulo={
        config["eventos.subtitulo"] ||
        "Tradiciones que construyen comunidad cada año"
      }
      badge={config["eventos.badge"] || "Lo que vivimos"}
    />
  );
}
