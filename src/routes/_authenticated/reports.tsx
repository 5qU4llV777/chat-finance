import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Relatório — Verdinho" },
      { name: "description", content: "Veja um resumo simples de seus gastos por categoria." },
      { property: "og:title", content: "Relatório — Verdinho" },
      { property: "og:description", content: "Entenda para onde seu dinheiro está indo." },
    ],
  }),
  component: ReportsPage,
});

type Tx = { type: "expense" | "income"; amount: number; category: string; occurred_at: string };

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
];

function ReportsPage() {
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("type, amount, category, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(200);
      return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Tx[];
    },
  });

  const { byCategory, totals } = useMemo(() => {
    const expenses = txs.filter((t) => t.type === "expense");
    const incomes = txs.filter((t) => t.type === "income");
    const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
    const totalInc = incomes.reduce((a, b) => a + b.amount, 0);
    const map = new Map<string, number>();
    expenses.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    const cats = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return {
      byCategory: cats,
      totals: { expenses: totalExp, incomes: totalInc, balance: totalInc - totalExp },
    };
  }, [txs]);

  return (
    <AppShell title="Relatório">
      <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-semibold">Seu resumo</h1>
        <p className="text-muted-foreground text-sm mt-1">Baseado nas suas últimas transações.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Gastos" value={totals.expenses} tone="warm" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Receitas" value={totals.incomes} tone="sage" />
          <StatCard icon={<Wallet className="w-5 h-5" />} label="Saldo" value={totals.balance} tone={totals.balance >= 0 ? "sage" : "destructive"} />
        </div>

        <Card className="p-6 mt-6 rounded-3xl border-border/60">
          <h2 className="font-semibold text-lg mb-1">Gastos por categoria</h2>
          <p className="text-xs text-muted-foreground mb-4">Onde seu dinheiro está indo</p>
          {byCategory.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Ainda não há gastos registrados. Vá para o chat e conte um para começar 🌱
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "sage" | "warm" | "destructive" }) {
  const toneClass =
    tone === "sage" ? "bg-primary/10 text-primary" :
    tone === "warm" ? "bg-accent/40 text-accent-foreground" :
    "bg-destructive/10 text-destructive";
  return (
    <Card className="p-5 rounded-3xl border-border/60">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${toneClass}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">R$ {value.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
