import { ExternalLink, Zap, Brain, Key, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Step {
  text: string;
  url?: { label: string; href: string };
}

interface ProviderCardProps {
  name: string;
  badge: string;
  badgeVariant: "speed" | "intelligence";
  description: string;
  steps: Step[];
  docsUrl: string;
}

function ProviderCard({
  name,
  badge,
  badgeVariant,
  description,
  steps,
  docsUrl,
}: ProviderCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">{name}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                badgeVariant === "speed"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
              }`}
            >
              {badgeVariant === "speed" ? (
                <Zap className="h-3 w-3" />
              ) : (
                <Brain className="h-3 w-3" />
              )}
              {badge}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Steps */}
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">{step.text}</span>
              {step.url && (
                <a
                  href={step.url.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {step.url.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Docs link */}
      <a
        href={docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Documentación oficial
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export default function ApiKeysGuidePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Key className="h-4 w-4" />
          <span className="text-sm">API Keys</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Obtenés tu API key gratis
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Para usar el agente de IA sin límites, necesitás cargar tu propia API key. Es gratis,
          tarda menos de 2 minutos, y tu clave se guarda encriptada en el servidor.
          Podés usar Groq o Google AI Studio.
        </p>
      </div>

      {/* Provider cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ProviderCard
          name="Groq"
          badge="Más rápido"
          badgeVariant="speed"
          description="Respuestas casi instantáneas. Ideal para el uso diario del chat."
          docsUrl="https://console.groq.com/docs/overview"
          steps={[
            {
              text: "Creá una cuenta en Groq Console.",
              url: {
                label: "console.groq.com",
                href: "https://console.groq.com/login",
              },
            },
            {
              text: 'En el menú lateral, entrá a "API Keys".',
            },
            {
              text: 'Hacé clic en "Create API Key", dale un nombre (ej: "vaquita") y copiá la clave.',
            },
            {
              text: "Pegala en Configuración → API Keys → Groq.",
            },
          ]}
        />

        <ProviderCard
          name="Google AI Studio"
          badge="Más inteligente"
          badgeVariant="intelligence"
          description="Modelo Gemini. Mejor para consultas complejas y con menos errores."
          docsUrl="https://ai.google.dev/gemini-api/docs/quickstart"
          steps={[
            {
              text: "Abrí Google AI Studio con tu cuenta de Google.",
              url: {
                label: "aistudio.google.com",
                href: "https://aistudio.google.com/app/apikey",
              },
            },
            {
              text: 'Hacé clic en "Get API key" → "Create API key in new project".',
            },
            {
              text: "Copiá la clave generada.",
            },
            {
              text: "Pegala en Configuración → API Keys → Google AI Studio.",
            },
          ]}
        />
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          ¿Ya tenés tu key? Cargala en Configuración.
        </p>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity shrink-0"
        >
          Ir a Configuración
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Security note */}
      <p className="text-xs text-muted-foreground">
        Tus claves se almacenan encriptadas (AES-256-GCM) y nunca se exponen en respuestas de la API.
        Podés eliminarlas en cualquier momento desde Configuración.
      </p>
    </div>
  );
}
