import { Shield, Key, Database, Mic, BarChart2, Lock } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Tus datos financieros",
    content:
      "Tus transacciones, cuentas y categorías se almacenan en una base de datos PostgreSQL alojada en Railway, bajo tu cuenta exclusiva. Nadie más tiene acceso a esa información. No compartimos, vendemos ni analizamos tus datos financieros con terceros.",
  },
  {
    icon: Key,
    title: "API keys propias (BYOK)",
    content:
      "Si cargás tu propia API key, la guardamos cifrada con AES-256-GCM. La clave de cifrado vive en el servidor y nunca viaja junto con los datos cifrados. Tu API key jamás se envía en texto plano, no aparece en logs, y no la compartimos con ningún servicio externo. Solo la desciframos en memoria en el momento exacto de hacer la llamada al modelo.",
  },
  {
    icon: Lock,
    title: "Cómo viaja tu API key",
    content:
      "Cuando usás el chat, tu API key viaja desde el navegador al backend de vaquita en el cuerpo del request HTTPS, cifrado en tránsito. El backend la descifra, hace la llamada al proveedor de IA que tengas configurado, y descarta el valor de memoria. La key nunca llega al modelo ni aparece en el contexto de la conversación.",
  },
  {
    icon: Mic,
    title: "Audio y transcripción",
    content:
      "Si usás la función de audio, el archivo se envía al servicio de transcripción de tu proveedor de LLM para obtener el texto, y luego se descarta. No almacenamos grabaciones de voz. La transcripción resultante sigue el mismo flujo que cualquier mensaje de texto.",
  },
  {
    icon: BarChart2,
    title: "Estadísticas e insights",
    content:
      "Los insights y resúmenes se generan a partir de tus propios datos almacenados. El LLM recibe únicamente la información necesaria para responder tu consulta — nunca el historial completo de tus transacciones de una sola vez. No usamos tus datos para entrenar modelos.",
  },
  {
    icon: Shield,
    title: "Sin tracking ni analytics",
    content:
      "vaquita no tiene Google Analytics, Mixpanel ni ninguna herramienta de seguimiento de comportamiento. No registramos eventos de navegación, clics ni patrones de uso. La app es para vos, no para nosotros.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur sm:p-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
                Privacidad
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3 sm:text-4xl">
              Cómo protegemos tus datos
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              vaquita es una app personal. La privacidad no es una feature — es
              el punto de partida.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-3">
          {sections.map(({ icon: Icon, title, content }, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-background/70 px-4 py-5 transition-colors last:border-border/80 hover:bg-muted/40 sm:px-5"
            >
              <div className="flex gap-4">
                <div className="mt-0.5 shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <h2 className="mb-2 text-sm font-medium">{title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* AES explainer callout */}
          <div className="mt-8 rounded-2xl border border-border bg-muted/50 px-5 py-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Sobre el cifrado AES-256-GCM:
              </span>{" "}
              Es el mismo estándar que usan bancos y servicios de salud para
              proteger datos sensibles. La clave de cifrado vive en las
              variables de entorno del servidor y nunca se almacena junto con
              los datos cifrados. Sin esa clave, los datos cifrados son
              ilegibles.
            </p>
          </div>

          {/* Footer note */}
          <div className="mt-8 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Si tenés preguntas, podés escribirme directamente.</p>
            <a
              href="https://github.com/fedecarboni7/vaquita-backend"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent"
            >
              Backend en GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
