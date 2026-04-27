# Vaquita — Frontend

Frontend de [Vaquita](https://vaquita.up.railway.app), una app de finanzas personales con IA integrada. El flujo principal es una interfaz de chat donde el usuario describe sus transacciones en lenguaje natural y el agente se encarga del resto.

---

## ¿Qué incluye?

- **Chat con IA** — registrá transacciones por texto o audio; el agente las interpreta y te muestra un borrador para confirmar antes de guardar
- **Historial de transacciones** — visualizá, filtrá y buscá todos tus movimientos
- **Cuentas** — administrá múltiples cuentas en distintas monedas
- **Estadísticas** — gráficos y resúmenes de gastos e ingresos por categoría y período
- **BYOK** — cargá tu propia API key de Groq o Google AI Studio para uso ilimitado

---

## Stack

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Gestor de paquetes | pnpm |
| Framework | React 19 + Vite |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui |
| Routing | react-router-dom v7 |
| Server state | TanStack Query |
| Auth | @react-oauth/google |
| Fuente | Geist |

---

## Cómo ejecutar

### Requisitos

- Node.js 18+
- pnpm

### Setup

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Completar los valores en .env

# Iniciar servidor de desarrollo
pnpm dev
```

### Build de producción

```bash
pnpm build
pnpm preview
```

---

## Licencia

MIT