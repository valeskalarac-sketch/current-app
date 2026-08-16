<p align="center">
  <img src="public/logo.svg" width="72" height="72" alt="Logo de Current" />
</p>

<h1 align="center">Current</h1>
<p align="center"><b>Finanzas personales, mes a mes.</b></p>

Current es un panel de finanzas personales para llevar tus **ingresos**, **egresos**, **pagos pendientes** (recurrentes o únicos) y **metas de ahorro**, con un tablero visual de anillos en degradado que resume tu salud financiera de un vistazo.

## Funcionalidades

- 📊 **Resumen mensual**: ingresos, egresos, balance, tasa de gasto y tasa de ahorro
- 💳 **Movimientos**: registra ingresos y egresos por categoría
- 📅 **Pagos pendientes**: crea pagos recurrentes (arriendo, servicios) o pagos únicos (matrícula, seguros) y márcalos como pagados
- 🐷 **Metas de ahorro**: define un monto objetivo y fecha límite; Current te sugiere cuánto ahorrar cada mes
- 🗓️ Navega entre meses para planear o revisar cualquier período
- 💾 Tus datos se guardan localmente en tu navegador (`localStorage`) — no requiere cuenta ni servidor

## Cómo correrlo localmente

Necesitas tener [Node.js](https://nodejs.org/) instalado (v18 o superior).

```bash
# 1. Clona el repositorio
git clone <URL-de-tu-repositorio>
cd current-finanzas

# 2. Instala las dependencias
npm install

# 3. Inicia el servidor de desarrollo
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).

## Compilar para producción

```bash
npm run build
```

Esto genera una carpeta `dist/` lista para publicar en cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc).

## Tecnologías

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Recharts](https://recharts.org/) para las gráficas
- [Lucide React](https://lucide.dev/) para los íconos

## Privacidad

Current no envía tus datos a ningún servidor: todo se guarda en el `localStorage` de tu propio navegador. Si limpias los datos del sitio o cambias de navegador/dispositivo, la información no se transfiere automáticamente.

## Licencia

MIT — ver [LICENSE](./LICENSE).
