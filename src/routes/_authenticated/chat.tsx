import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sprout, Send, TrendingUp, TrendingDown } from "lucide-react";
import { sendChatMessage } from "@/lib/finance-ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Verdinho" },
      { name: "description", content: "Converse com o Verdinho para registrar gastos e receitas com frases naturais." },
      { property: "og:title", content: "Chat — Verdinho" },
      { property: "og:description", content: "Registre suas finanças conversando." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: "user" | "assistant"; content: string; created_at: string };

const SUGGESTIONS = [
  "gastei 30 no mercado",
  "recebi 500 de freela",
  "paguei 80 de internet",
  "como economizar mais?",
];

function ChatPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sendFn = useServerFn(sendChatMessage);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Redirect to onboarding if not done
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).maybeSingle();
      if (!p?.onboarded) navigate({ to: "/onboarding" });
    });
  }, [navigate]);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .order("created_at", { ascending: true });
      return (data ?? []) as Msg[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name").maybeSingle();
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (message: string) => sendFn({ data: { message } }),
    onMutate: async (message) => {
      // Optimistic
      qc.setQueryData<Msg[]>(["chat-messages"], (old = []) => [
        ...old,
        { id: `local-${Date.now()}`, role: "user", content: message, created_at: new Date().toISOString() },
      ]);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
      if (res.transaction) {
        qc.invalidateQueries({ queryKey: ["transactions"] });
        toast.success(
          `${res.transaction.type === "expense" ? "Gasto" : "Receita"} de R$${res.transaction.amount.toFixed(2)} em ${res.transaction.category} registrado`,
        );
      }
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onSettled: () => {
      setTimeout(() => textareaRef.current?.focus(), 50);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mutation.isPending]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    setInput("");
    mutation.mutate(text);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <AppShell title="Chat">
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {isEmpty && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-7 h-7 text-primary" strokeWidth={2.2} />
                </div>
                <h1 className="text-2xl font-semibold">
                  Olá{profile?.name ? `, ${profile.name}` : ""}! Vamos começar?
                </h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                  Me conte um gasto ou receita em uma frase, ou peça uma dica. Vou cuidar do resto.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                      className="px-3.5 py-2 rounded-full bg-card border border-border text-sm text-foreground hover:border-primary/40 hover:bg-accent/30 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}

            {mutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sprout className="w-4 h-4 text-primary" strokeWidth={2.4} />
                </div>
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:300ms]" />
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 bg-background/80 backdrop-blur px-4 md:px-8 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-end gap-2 bg-card rounded-3xl border border-border/60 p-2 pl-4 shadow-sm focus-within:border-primary/40 transition">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ex: gastei 30 reais no mercado"
                rows={1}
                className="flex-1 resize-none border-0 focus-visible:ring-0 bg-transparent px-0 py-2 min-h-[2.5rem] max-h-40 shadow-none"
              />
              <Button
                onClick={submit}
                disabled={!input.trim() || mutation.isPending}
                size="icon"
                className="rounded-full h-10 w-10 shrink-0"
                aria-label="Enviar"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Verdinho registra gastos e receitas automaticamente a partir das suas frases.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-3xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  // Detect transaction confirmations by looking for currency
  const isMoney = /R\$\s?\d/.test(msg.content) || /reais/i.test(msg.content);
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        {isMoney ? <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2.4} /> : <Sprout className="w-4 h-4 text-primary" strokeWidth={2.4} />}
      </div>
      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pt-1">
        {msg.content}
      </div>
    </div>
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _icon = TrendingDown;
