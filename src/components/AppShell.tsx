import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Target, PieChart, Lightbulb, LogOut, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

const nav = [
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/reports", label: "Relatório", icon: PieChart },
  { to: "/tips", label: "Dicas", icon: Lightbulb },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-primary" strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-semibold">Verdinho</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}
              >
                <Icon className="w-4.5 h-4.5" size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground transition"
        >
          <LogOut size={18} /> Sair
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/60 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-primary" strokeWidth={2.4} />
          </div>
          <span className="font-display font-semibold">{title ?? "Verdinho"}</span>
        </div>
        <button onClick={signOut} className="text-muted-foreground p-2"><LogOut size={18} /></button>
      </header>

      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
