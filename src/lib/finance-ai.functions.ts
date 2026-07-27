import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL_ID = "google/gemini-3.6-flash";

function gateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

const ChatInput = z.object({ message: z.string().min(1).max(2000) });

// Chat: parses message. If it describes a transaction, save it. Returns assistant reply.
export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ChatInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load profile + last messages for context
    const [{ data: profile }, { data: recent }] = await Promise.all([
      supabase.from("profiles").select("name, main_goal, categories, monthly_income").eq("id", userId).maybeSingle(),
      supabase.from("chat_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);

    const history = (recent ?? []).reverse();

    // Save user message
    await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: data.message });

    const catList = (profile?.categories ?? ["mercado", "transporte", "lazer", "moradia", "saúde", "outros"]).join(", ");

    const system = `Você é o Verdinho, um agente financeiro brasileiro, gentil, acolhedor e prático, feito para iniciantes em finanças pessoais. Fale sempre em português do Brasil, com tom caloroso e encorajador. Nunca julgue gastos. Use no máximo 2 frases curtas e 1 emoji sutil quando fizer sentido.

Perfil do usuário:
- Nome: ${profile?.name ?? "amigo(a)"}
- Objetivo principal: ${profile?.main_goal ?? "não informado"}
- Categorias favoritas: ${catList}

Sua tarefa: analisar a mensagem. Se ela descrever um gasto ou uma receita (ex: "gastei 30 no mercado", "recebi 500 de freela"), extraia a transação. Escolha a categoria da lista do usuário se possível, senão "outros". Se não for uma transação (dúvida, papo, pedido de conselho), responda normalmente sem transação.`;

    const schema = z.object({
      reply: z.string().describe("Resposta amigável e curta em português para o usuário."),
      transaction: z
        .object({
          type: z.enum(["expense", "income"]),
          amount: z.number().positive(),
          category: z.string(),
          description: z.string(),
        })
        .nullable()
        .describe("Transação detectada, ou null."),
    });

    let result: z.infer<typeof schema>;
    try {
      const gen = await generateText({
        model: gateway()(MODEL_ID),
        system,
        messages: [
          ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: data.message },
        ],
        output: Output.object({ schema }),
      });
      result = gen.output;
    } catch (e) {
      console.error("AI error", e);
      result = { reply: "Desculpe, tive um probleminha agora. Pode tentar de novo? 🌱", transaction: null };
    }

    if (result.transaction) {
      await supabase.from("transactions").insert({
        user_id: userId,
        type: result.transaction.type,
        amount: result.transaction.amount,
        category: result.transaction.category.toLowerCase(),
        description: result.transaction.description,
      });
    }

    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: result.reply });

    return { reply: result.reply, transaction: result.transaction };
  });

export const generateTips = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: txs }] = await Promise.all([
      supabase.from("profiles").select("name, main_goal, monthly_income, categories").eq("id", userId).maybeSingle(),
      supabase.from("transactions").select("type, amount, category, occurred_at").eq("user_id", userId).order("occurred_at", { ascending: false }).limit(60),
    ]);

    const summary = (txs ?? []).map((t) => `${t.type === "expense" ? "-" : "+"}R$${t.amount} ${t.category}`).join("; ");

    const schema = z.object({
      tips: z.array(
        z.object({
          title: z.string(),
          body: z.string(),
          emoji: z.string(),
        }),
      ),
    });

    try {
      const gen = await generateText({
        model: gateway()(MODEL_ID),
        system: `Você é o Verdinho, agente financeiro amigável brasileiro. Gere entre 3 e 5 dicas personalizadas, curtas, práticas e acolhedoras, em português, para um iniciante em finanças. Cada dica deve ter um título curto, um corpo de 1-2 frases e um emoji.`,
        prompt: `Perfil: nome=${profile?.name ?? "-"}, objetivo=${profile?.main_goal ?? "-"}, renda mensal aproximada=R$${profile?.monthly_income ?? "não informada"}, categorias=${(profile?.categories ?? []).join(", ")}.
Últimas transações: ${summary || "nenhuma ainda"}.
Gere dicas úteis e específicas com base nesse contexto.`,
        output: Output.object({ schema }),
      });
      return gen.output;
    } catch (e) {
      console.error("tips error", e);
      return {
        tips: [
          { emoji: "🌱", title: "Comece pequeno", body: "Registre todos os gastos por 7 dias para entender seus hábitos." },
          { emoji: "💡", title: "Regra 50/30/20", body: "Divida sua renda: 50% essenciais, 30% desejos, 20% poupança." },
          { emoji: "🎯", title: "Uma meta por vez", body: "Foque em uma meta financeira clara para manter a motivação." },
        ],
      };
    }
  });
