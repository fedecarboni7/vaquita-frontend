import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/useAuth";
import { useTheme } from "@/hooks/useTheme";

const mainNav = [
  { to: "/transactions", icon: "≡", label: "Registros" },
  { to: "/accounts", icon: "◫", label: "Cuentas" },
  { to: "/", icon: "✦", label: "Agente" },
];

const systemNav = [
  { to: "/settings", icon: "⚙", label: "Configuración" },
];

function getUserInitials(name: string | null | undefined) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = getUserInitials(user?.display_name);
  const displayName = user?.display_name ?? user?.email ?? "";

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[99] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed top-12 left-0 bottom-[76px] z-[100] flex w-[220px] flex-col bg-card border-r border-border py-7 transition-transform duration-250 ease-out md:top-0 md:bottom-0",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)]" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="px-5 pb-7 border-b border-border/50 mb-4">
          <div className="font-serif text-lg font-medium tracking-tight">
            gastos.
          </div>
          <div className="text-[11px] text-muted-foreground/60 font-mono tracking-wider mt-0.5">
            personal finance
          </div>
        </div>

        {/* Nav — Principal */}
        <div className="px-3 mb-2">
          <div className="text-[10px] text-muted-foreground/60 font-mono tracking-widest uppercase px-2 mb-1">
            Principal
          </div>
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer text-muted-foreground text-[13.5px] transition-all duration-150 select-none",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-background hover:text-foreground",
                )
              }
            >
              <span className="w-4 text-center text-sm opacity-70">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 mx-5 my-2" />

        {/* Nav — Sistema */}
        <div className="px-3 mb-2">
          <div className="text-[10px] text-muted-foreground/60 font-mono tracking-widest uppercase px-2 mb-1">
            Sistema
          </div>
          {systemNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer text-muted-foreground text-[13.5px] transition-all duration-150 select-none",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-background hover:text-foreground",
                )
              }
            >
              <span className="w-4 text-center text-sm opacity-70">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 px-5 border-t border-border/50 flex flex-col gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between cursor-pointer py-1"
          >
            <span className="text-xs text-muted-foreground">
              {isDark ? "Modo claro" : "Modo oscuro"}
            </span>
            <div
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
                isDark ? "bg-accent" : "bg-border",
              )}
            >
              <div
                className={cn(
                  "absolute w-3.5 h-3.5 rounded-full bg-white top-[3px] left-[3px] transition-transform duration-200 shadow-sm",
                  isDark && "translate-x-4",
                )}
              />
            </div>
          </button>

          {/* User chip */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent text-sidebar-accent-foreground flex items-center justify-center text-[11px] font-medium">
              {initials}
            </div>
            <span className="text-[12.5px] truncate">{displayName}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              setSidebarOpen(false);
            }}
            className="w-full mt-1 rounded-md border border-border px-2.5 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-card border-b border-border flex items-center justify-between px-4 z-[200]">
        <div className="font-serif text-base font-medium">gastos.</div>
        <div className="flex gap-2 items-center">
          <button
            onClick={toggleTheme}
            className="border border-border rounded-md cursor-pointer text-muted-foreground text-sm px-2 py-1"
          >
            {isDark ? "☾" : "☀"}
          </button>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="cursor-pointer text-foreground text-lg flex items-center bg-transparent border-none"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="md:ml-[220px] flex-1 bg-background px-3 sm:px-4 pt-[60px] pb-[88px] md:px-12 md:py-10 md:max-w-[1100px]">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border py-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom))] z-[200]">
        <div className="flex justify-around">
          {[...mainNav, ...systemNav].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer text-[10px] font-mono tracking-wider uppercase transition-colors duration-150",
                  isActive ? "text-accent" : "text-muted-foreground/60",
                )
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label === "Configuración" ? "Config" : item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
