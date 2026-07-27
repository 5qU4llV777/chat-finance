import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sprout } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Verdinho" },
      { name: "description", content: "Acesse sua conta do Verdinho para conversar sobre suas finanças." },
      { property: "og:title", content: "Entrar — Verdinho" },
      { property: "og:description", content: "Acesse sua conta do Verdinho." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/chat" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name || undefined },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo(a) ao Verdinho 🌱");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/chat" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Não deu para entrar com Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/chat" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-secondary/50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
            <Sprout className="w-8 h-8 text-primary" strokeWidth={2.2} />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Verdinho</h1>
          <p className="text-muted-foreground mt-2 text-sm">Seu agente financeiro por chat</p>
        </div>

        <Card className="p-6 rounded-3xl border-border/60 shadow-sm">
          <div className="flex gap-2 p-1 bg-muted rounded-full mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition ${mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >Entrar</button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >Criar conta</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
              {loading ? "Aguarde..." : mode === "signup" ? "Criar minha conta" : "Entrar"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="w-full rounded-full h-11" onClick={handleGoogle} disabled={loading}>
            Continuar com Google
          </Button>
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-6">
          Seus dados ficam guardados de forma segura só para você.
        </p>
      </div>
    </div>
  );
}
