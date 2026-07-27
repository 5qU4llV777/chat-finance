import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sprout, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Boas-vindas — Verdinho" },
      { name: "description", content: "Personalize sua experiência no Verdinho em poucos passos." },
    ],
  }),
  component: OnboardingPage,
});

const DEFAULT_CATS = ["mercado", "transporte", "lazer", "moradia", "saúde", "restaurante", "assinaturas", "educação"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [goal, setGoal] = useState("");
  const [cats, setCats] = useState<string[]>(["mercado", "transporte", "lazer"]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (profile?.onboarded) navigate({ to: "/chat" });
      if (profile?.name) setName(profile.name);
    });
  }, [navigate]);

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const finish = async () => {
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: data.user.id,
      name: name.trim() || null,
      monthly_income: income ? Number(income.replace(",", ".")) : null,
      main_goal: goal.trim() || null,
      categories: cats,
      onboarded: true,
    });
    setSaving(false);
    if (error) {
      toast.error("Não deu para salvar. Tente novamente.");
      return;
    }
    toast.success("Tudo pronto! Vamos conversar 🌱");
    navigate({ to: "/chat" });
  };

  const steps = [
    {
      title: `Oi! Eu sou o Verdinho 🌱`,
      subtitle: "Vou te ajudar a organizar seu dinheiro conversando. Primeiro, como posso te chamar?",
      content: (
        <div className="space-y-2">
          <Label htmlFor="name">Seu nome</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ana" autoFocus />
        </div>
      ),
      canNext: name.trim().length > 0,
    },
    {
      title: `Prazer, ${name || "amigo(a)"}! 💚`,
      subtitle: "Qual é a sua renda mensal aproximada? Isso me ajuda a personalizar dicas. (opcional)",
      content: (
        <div className="space-y-2">
          <Label htmlFor="income">Renda mensal (R$)</Label>
          <Input id="income" inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Ex: 3500" />
          <p className="text-xs text-muted-foreground">Só você vê esses dados.</p>
        </div>
      ),
      canNext: true,
    },
    {
      title: "Qual seu objetivo principal?",
      subtitle: "Sem pressão — pode ser algo simples. Isso guia as suas metas.",
      content: (
        <div className="space-y-2">
          <Label htmlFor="goal">Meu objetivo</Label>
          <Textarea id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ex: economizar para uma viagem, sair das dívidas, começar a investir" rows={3} />
        </div>
      ),
      canNext: true,
    },
    {
      title: "Onde você costuma gastar?",
      subtitle: "Escolha as categorias que fazem sentido para você. Dá para mudar depois.",
      content: (
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATS.map((c) => {
            const active = cats.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      ),
      canNext: cats.length > 0,
    },
  ];

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-background to-secondary/40">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-primary" strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-semibold">Verdinho</span>
        </div>

        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <Card className="p-6 md:p-8 rounded-3xl border-border/60 shadow-sm">
          <h1 className="text-2xl font-semibold">{s.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.subtitle}</p>
          <div className="mt-6">{s.content}</div>
          <div className="flex justify-between items-center mt-8">
            <button
              type="button"
              className="text-sm text-muted-foreground disabled:opacity-40"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >Voltar</button>
            <Button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              disabled={!s.canNext || saving}
              className="rounded-full h-11 px-6"
            >
              {isLast ? (saving ? "Salvando..." : "Começar") : "Continuar"} <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
