import { NavLink, Outlet } from "react-router-dom";
import { MessageSquare, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: MessageSquare, label: "Chat" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transacciones" },
];

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col items-center gap-2 w-16 border-r border-border bg-card py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-lg text-xs gap-1 transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] leading-none">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-14 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex items-center justify-around h-14 border-t border-border bg-card z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] leading-none">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
