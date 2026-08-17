<p align="center">
  <img src="public/logo.svg" width="72" height="72" alt="Logo de Current" />
</p>

<h1 align="center">Current</h1>
<p align="center"><b>Finanzas personales, mes a mes.</b></p>

Current es un panel de finanzas personales para llevar tus **ingresos**, **egresos**, **pagos pendientes** (recurrentes o únicos) y **metas de ahorro**, con un tablero visual de anillos en degradado que resume tu salud financiera de un vistazo.

## Funcionalidades

- 🔐 **Cuenta propia** con inicio de sesión con Google (Supabase Auth)
- 📊 **Resumen mensual**: ingresos, egresos, balance, tasa de gasto y tasa de ahorro
- 💳 **Movimientos**: registra ingresos y egresos por categoría
- 📅 **Pagos pendientes**: pagos recurrentes o únicos, marcables como pagados
- 🔔 **Notificaciones push**: avisa en el celular cuando un pago está por vencer (hasta 3 días antes)
- 🐷 **Metas de ahorro**: monto objetivo, fecha límite y sugerencia de ahorro mensual
- 📲 **Instalable como app** (PWA) desde el navegador, sin tiendas de apps
- ☁️ Datos en Postgres (Supabase), sincronizados entre dispositivos

## Base de datos

Current usa [Supabase](https://supabase.com) (Postgres) como backend, con **Row Level Security** en todas las tablas:

- **`transactions`** — ingresos y egresos
- **`pending_payments`** — pagos recurrentes y únicos
- **`savings_goals`** — metas de ahorro
- **`push_subscriptions`** — suscripciones a notificaciones push por dispositivo

## Cómo correrlo localmente

```bash
git clone <URL-de-tu-repositorio>
cd current-finanzas
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno

### Frontend (`.env`, con prefijo `VITE_`)

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública ("anon"/"publishable") de Supabase |
| `VITE_VAPID_PUBLIC_KEY` | Clave pública VAPID, para suscribir el navegador a notificaciones push |

### Backend / función programada (solo en el dashboard de Vercel, **nunca en `.env`**)

Estas son secretas — se configuran en **Vercel → tu proyecto → Settings → Environment Variables**, no se suben a git ni se comparten:

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | Misma URL del proyecto de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave *service role* de Supabase (Settings → API) — tiene acceso total, nunca debe exponerse en el frontend |
| `VAPID_PUBLIC_KEY` | Igual a `VITE_VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID — nunca se expone al navegador |
| `VAPID_SUBJECT` | Un `mailto:tucorreo@ejemplo.com` de contacto (requerido por el estándar Web Push) |

`CRON_SECRET` la genera Vercel automáticamente al agregar un cron job — no hay que configurarla a mano.

## Notificaciones push: cómo funcionan

1. Cada persona activa las notificaciones desde el ícono 🔔 en el encabezado de la app (le pide permiso al navegador).
2. Su suscripción (endpoint + claves de cifrado) se guarda en la tabla `push_subscriptions`.
3. Una función programada (`api/send-payment-reminders.js`) corre **una vez al día** (configurado en `vercel.json`, 13:00 UTC ≈ 8:00 a.m. Colombia) vía [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs).
4. Revisa los pagos pendientes de todos los usuarios; a quienes tengan un pago venciendo en los próximos 3 días (y no marcado como pagado), les envía una notificación push real, incluso con la app cerrada.

Requiere que el proyecto esté desplegado en Vercel con las variables de entorno del backend configuradas.

## Compilar para producción

```bash
npm run build
```

## Tecnologías

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/) (Postgres + Auth) para datos y autenticación
- [web-push](https://github.com/web-push-libs/web-push) + [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) para notificaciones push
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) para la instalación como app
- [Recharts](https://recharts.org/) para las gráficas · [Lucide React](https://lucide.dev/) para los íconos

## Privacidad y seguridad

- Tus datos están protegidos por Row Level Security: solo tu usuario autenticado puede leer o modificar tus propios registros.
- Las notificaciones push no exponen contenido financiero específico en el texto visible salvo la descripción del pago; nunca se envían montos por otros canales.
- Nunca compartas tokens de acceso, la clave `service_role` de Supabase o las claves VAPID privadas en texto plano; si alguna se expone por accidente, revócala de inmediato.

## Licencia

MIT — ver [LICENSE](./LICENSE).
