import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateTips } from "@/lib/finance-ai.functions";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tips")({
  head: () => ({
    meta: [
      { title: "Dicas — Verdinho" },
      { name: "description", content: "Dicas financeiras personalizadas geradas pelo seu agente pessoal." },
      { property: "og:title", content: "Dicas — Verdinho" },
      { property: "og:description", content: "Dicas amigáveis feitas para você." },
    ],
  }),
  component: TipsPage,
});

function TipsPage() {
  const fn = useServerFn(generateTips);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["tips"],
    queryFn: () => fn({ data: undefined }),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <AppShell title="Dicas">
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Dicas para você</h1>
            <p className="text-muted-foreground text-sm mt-1">Feitas pelo Verdinho, com base no seu perfil.</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>

        {isFetching && !data && (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 rounded-3xl border-border/60 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-1.5" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-4">
          {data?.tips.map((t, i) => (
            <Card key={i} className="p-5 rounded-3xl border-border/60 hover:border-primary/30 transition">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-2xl">
                  {t.emoji || <Lightbulb className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-1">{t.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
