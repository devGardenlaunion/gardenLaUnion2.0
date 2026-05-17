# Setup de Desarrollo — Garden College Web

> Documento escrito para sobrevivir un formateo de SO. Si estás leyendo esto después de reinstalar, sigue los pasos en orden.

---

## Stack real (como funciona hoy)

| Capa | Herramienta | Dónde vive |
|------|-------------|------------|
| Framework | Next.js (App Router) | Local |
| Base de datos | **Neon** (PostgreSQL cloud) | neon.tech — misma para dev y prod |
| Deploy prod | **Vercel** | Conectado al repo GitHub, auto-deploy en cada push a `main` |
| Auth prod | NextAuth + Google OAuth 2.0 | Variables en Vercel |

> **Nota:** El `docker-compose.yml` y el `Dockerfile` existen pero son para un futuro deploy en Oracle Cloud. **En el flujo actual no se usa Docker.**

---

## Requisitos del sistema

```bash
# Arch Linux
sudo pacman -S nodejs npm git

# Verificar
node --version   # debe ser LTS (20.x o 22.x)
npm --version
```

Alternativa con nvm (recomendada para manejar versiones):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # o el archivo de tu shell
nvm install --lts
nvm use --lts
```

---

## Paso 1 — Clonar el repo (si no está)

```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git gardenLaUnion2.0
cd gardenLaUnion2.0
```

---

## Paso 2 — Crear el archivo `.env`

```bash
cp .env.example .env
```

Editar `.env` y completar **solo estas variables** para que funcione en dev:

```env
# ← La URL completa de Neon. La encuentras en:
# neon.tech → tu proyecto → "Connection Details" → copiar la connection string
DATABASE_URL=postgresql://usuario:password@host.neon.tech/neondb?sslmode=require

# ← Inventar uno (no importa el valor en dev)
DB_PASSWORD=cualquier_cosa

# ← Para dev
SITE_URL=http://localhost:3000

# ← Generar con: openssl rand -base64 32
AUTH_SECRET=GENERAR_CON_OPENSSL

# ← Dejar como placeholder en dev (el skip auth lo reemplaza)
GOOGLE_CLIENT_ID=placeholder.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=placeholder

ALLOWED_EMAIL_DOMAIN=gardenlaunion.cl
NODE_ENV=development

# ← true = salta el login de Google, accedes directo a /admin
NEXT_PUBLIC_SKIP_AUTH=true
```

**¿Dónde está la URL de Neon?**
1. Entrar a [neon.tech](https://neon.tech) con tu cuenta
2. Seleccionar el proyecto `garden` (o el nombre que tenga)
3. Panel principal → sección **"Connection Details"** o botón **"Connect"**
4. Copiar la connection string completa (tiene formato `postgresql://...@...neon.tech/neondb?sslmode=require`)

---

## Paso 3 — Instalar dependencias

```bash
npm install
```

---

## Paso 4 — Verificar la BD (solo si es una BD nueva o recién creada)

```bash
# Si la BD ya tiene datos de antes, esto NO es necesario
npx prisma migrate dev
npx prisma db seed
```

Si la BD ya estaba funcionando, basta con:
```bash
npx prisma generate   # regenera el client local
```

---

## Paso 5 — Arrancar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Listo.

---

## Deploy a producción

**No hay comando manual.** El deploy es automático:

1. Hacer commit y push a `main`
2. Vercel detecta el push y despliega automáticamente
3. En ~2-3 minutos el cambio está en producción

**¿Dónde están las variables de entorno de producción?**
→ Vercel dashboard → proyecto `garden-college` (o el nombre que tenga) → **Settings → Environment Variables**

Las variables que deben estar ahí:
- `DATABASE_URL` (la misma URL de Neon, o una branch separada de prod)
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ALLOWED_EMAIL_DOMAIN`
- `SITE_URL` = `https://gardencollege.cl`
- `NODE_ENV` = `production`
- `NEXT_PUBLIC_SKIP_AUTH` = `false`

---

## Migraciones de BD en producción

Vercel no corre migraciones automáticamente. Cuando hay una nueva migración:

```bash
# Apuntar a la BD de producción temporalmente
DATABASE_URL="url-de-neon-prod" npx prisma migrate deploy
```

O correrla directamente desde Neon console (para migraciones simples).

---

## Comandos útiles

```bash
npm run dev              # servidor de desarrollo
npx prisma studio        # UI para ver/editar la BD en el navegador
npx prisma migrate dev   # aplicar migraciones nuevas en dev
npx prisma db seed       # repoblar con datos iniciales
npx prisma generate      # regenerar el client (después de cambios en schema)
```
