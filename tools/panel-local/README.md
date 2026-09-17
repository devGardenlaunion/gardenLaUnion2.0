# Panel local

Compresor genérico de medios para eventos. **Solo corre en tu máquina** — nunca se despliega, nunca se expone a internet (bind a `127.0.0.1`). No es parte del sitio: vive fuera de `src/app/`, no entra al build de Vercel (ver `.vercelignore` en la raíz).

## Requisitos (una sola vez)

```bash
pacman -S ffmpeg   # o el gestor de paquetes que corresponda
```

## Uso

```bash
cd tools/panel-local
npm install
npm start
```

Abrí `http://127.0.0.1:4747`. El puerto se puede cambiar con `PANEL_PUERTO=xxxx npm start`.

Elegís slug del evento + destino (`hero` / `polaroid` / un año), ves qué hay ya en esa carpeta (con preview y borrado), y arrastrás archivos nuevos — se comprimen según las specs de cada tipo (`docs/EVENTOS.md` §5: fotos webp ≤1600px calidad 72, videos sin audio 24fps con poster y variante `-mobile`) y quedan directo en `public/media/eventos/<slug>/<destino>/`.

Después de usarlo: `npm run dev`/`npm run build` en la raíz del repo para revisar, `git diff`, y commiteás vos mismo. El panel nunca toca git ni `src/content/eventos.ts` — el texto de Historias se sigue editando a mano, como siempre.

## Qué queda fuera

- Edición del texto de Historias (`src/content/eventos.ts`) — se probó y se sacó a propósito, para mantener la herramienta simple. Se edita a mano o pidiéndoselo a Claude Code.
- Documentos institucionales (`/documentos`).
- Selector de tipo de galería por evento — no existe ese concepto en el modelo de datos actual.
