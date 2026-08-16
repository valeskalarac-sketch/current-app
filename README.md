<p align="center">
  <img src="public/logo.svg" width="72" height="72" alt="Logo de Current" />
</p>

<h1 align="center">Current</h1>
<p align="center"><b>Finanzas personales, mes a mes.</b></p>

Current es un panel de finanzas personales para llevar tus **ingresos**, **egresos**, **pagos pendientes** (recurrentes o únicos) y **metas de ahorro**, con un tablero visual de anillos en degradado que resume tu salud financiera de un vistazo.

## Funcionalidades

- 🔐 **Cuenta propia** con acceso por enlace mágico (sin contraseñas) vía Supabase Auth
- 📊 **Resumen mensual**: ingresos, egresos, balance, tasa de gasto y tasa de ahorro
- 💳 **Movimientos**: registra ingresos y egresos por categoría
- 📅 **Pagos pendientes**: crea pagos recurrentes (arriendo, servicios) o pagos únicos (matrícula, seguros) y márcalos como pagados
- 🐷 **Metas de ahorro**: define un monto objetivo y fecha límite; Current te sugiere cuánto ahorrar cada mes
- 🗓️ Navega entre meses para planear o revisar cualquier período
- ☁️ Tus datos viven en una base de datos Postgres (Supabase), accesibles desde cualquier dispositivo donde inicies sesión

## Base de datos

Current usa [Supabase](https://supabase.com) (Postgres) como backend:

- **`transactions`** — ingresos y egresos
- **`pending_payments`** — pagos recurrentes y únicos
- **`savings_goals`** — metas de ahorro

Todas las tablas tienen **Row Level Security (RLS)** activado: cada usuario solo puede leer y escribir sus propios datos, sin importar quién más use la misma base de datos.

## Cómo correrlo localmente

Necesitas tener [Node.js](https://nodejs.org/) instalado (v18 o superior) y un proyecto de Supabase.

```bash
# 1. Clona el repositorio
git clone <URL-de-tu-repositorio>
cd current-finanzas

# 2. Instala las dependencias
npm install

# 3. Copia el archivo de variables de entorno y complétalo con tus datos de Supabase
cp .env.example .env
# Edita .env con la URL y la clave "anon"/"publishable" de tu proyecto de Supabase
# (Project Settings → API en el dashboard de Supabase)

# 4. Inicia el servidor de desarrollo
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).

### Habilitar el inicio de sesión por enlace mágico

En el dashboard de Supabase: **Authentication → Providers → Email**, asegúrate de que el proveedor de correo esté habilitado. Por defecto Supabase ya envía los enlaces mágicos sin configuración adicional (usando su servidor de correo de pruebas); para producción, configura tu propio proveedor SMTP en **Authentication → Settings**.

## Compilar para producción

```bash
npm run build
```

Esto genera una carpeta `dist/` lista para publicar en cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc). Recuerda configurar las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en tu proveedor de hosting.

## Tecnologías

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/) (Postgres + Auth) para datos y autenticación
- [Recharts](https://recharts.org/) para las gráficas
- [Lucide React](https://lucide.dev/) para los íconos

## Privacidad y seguridad

- Tus datos se guardan en tu propio proyecto de Supabase, protegidos por Row Level Security: solo tu usuario autenticado puede leer o modificar tus propios registros.
- La clave incluida en `.env.example` es una clave **pública** (`anon`/`publishable`) diseñada para exponerse en el navegador — la protección real la da RLS, no la clave.
- Nunca compartas tokens de acceso personal (como los de GitHub o Supabase) en texto plano; si alguno se expone por accidente, revócalo de inmediato.

## Licencia

MIT — ver [LICENSE](./LICENSE).
