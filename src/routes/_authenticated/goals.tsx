import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Metas — Verdinho" },
      { name: "description", content: "Defina metas financeiras e acompanhe seu progresso." },
      { property: "og:title", content: "Metas — Verdinho" },
      { property: "og:description", content: "Acompanhe seu progresso rumo às suas metas." },
    ],
  }),
  component: GoalsPage,
});

type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
};

function GoalsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Goal[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("no user");
      const { error } = await supabase.from("goals").insert({
        user_id: u.user.id,
        title,
        target_amount: Number(target.replace(",", ".")),
        current_amount: current ? Number(current.replace(",", ".")) : 0,
        deadline: deadline || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      setOpen(false);
      setTitle(""); setTarget(""); setCurrent(""); setDeadline("");
      toast.success("Meta criada 🌱");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const addProgress = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal) return;
      const next = Math.max(0, Number(goal.current_amount) + delta);
      const { error } = await supabase.from("goals").update({ current_amount: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  return (
    <AppShell title="Metas">
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Suas metas</h1>
            <p className="text-muted-foreground text-sm mt-1">Um passo de cada vez.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-10"><Plus className="w-4 h-4 mr-1" /> Nova meta</Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Criar meta</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reserva de emergência" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Valor alvo (R$)</Label>
                    <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="3000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Já tenho (R$)</Label>
                    <Input inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Prazo (opcional)</Label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <Button
                  className="w-full rounded-full h-11"
                  disabled={!title.trim() || !target || create.isPending}
                  onClick={() => create.mutate()}
                >
                  {create.isPending ? "Criando..." : "Criar meta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length === 0 ? (
          <Card className="p-10 text-center rounded-3xl border-dashed">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground">Nenhuma meta ainda. Que tal criar a primeira?</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {goals.map((g) => {
              const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100);
              return (
                <Card key={g.id} className="p-5 rounded-3xl border-border/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-lg">{g.title}</h3>
                      {g.deadline && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Prazo: {new Date(g.deadline).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => remove.mutate(g.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg transition"
                      aria-label="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        R$ {Number(g.current_amount).toFixed(2)} <span className="opacity-60">de R$ {Number(g.target_amount).toFixed(2)}</span>
                      </span>
                      <span className="font-medium text-primary">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className="h-2.5" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    {[10, 50, 100].map((v) => (
                      <Button
                        key={v}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => addProgress.mutate({ id: g.id, delta: v })}
                      >+ R${v}</Button>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
