import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { UserProfile } from "@/lib/civicEngine";
import { QUICK_PROMPTS } from "@/data/electionData";
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "assistant" | "user"; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const greeting = (eli15: boolean): Msg => ({
  role: "assistant",
  content: eli15
    ? "Hey! I'm **VoteWise** — your voting buddy. Ask me anything about voting in India. 🗳️"
    : "Hi — I'm **VoteWise**, your civic assistant for Indian elections. Ask me about eligibility, registration, EPIC, EVM, NOTA, or polling day.",
});

export const Assistant = ({ profile, eli15 }: { profile: UserProfile; eli15: boolean }) => {
  const [msgs, setMsgs] = useState<Msg[]>([greeting(eli15)]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (q: string) => {
    if (!q.trim() || streaming) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }, { role: "assistant", content: "" }];
    setMsgs(next);
    setInput("");
    setStreaming(true);

    const ctl = new AbortController();
    abortRef.current = ctl;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/civic-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON}`,
          apikey: ANON,
        },
        body: JSON.stringify({
          messages: next.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
          eli15,
          profile,
        }),
        signal: ctl.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) toast.error("Rate limit — wait a moment.");
        else if (res.status === 402) toast.error("AI credits exhausted.");
        else toast.error(err.error || "Assistant error");
        setMsgs((m) => m.slice(0, -1));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              setMsgs((curr) => {
                const copy = [...curr];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: copy[copy.length - 1].content + delta,
                };
                return copy;
              });
            }
          } catch { /* ignore parse errors on partial chunks */ }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast.error("Connection error");
        setMsgs((m) => m.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMsgs([greeting(eli15)]);
  };

  return (
    <section className="brutal-card p-0 bg-card overflow-hidden flex flex-col h-[560px]">
      <div className="px-5 py-3 border-b-2 border-foreground bg-background flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center border-2 border-foreground">
            <Bot className="w-4 h-4 text-ink" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-bold leading-none">Civic Assistant</div>
            <div className="text-[10px] uppercase tracking-widest text-lime mt-0.5">
              {streaming ? "Thinking…" : eli15 ? "Simplified mode · live AI" : "Standard mode · live AI"}
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="chip hover:bg-coral hover:text-white transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""} animate-slide-up`}>
            <div className={`w-7 h-7 shrink-0 rounded-full border-2 border-foreground flex items-center justify-center ${m.role === "user" ? "bg-sky text-white" : "bg-lime text-ink"}`}>
              {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[82%] flex flex-col gap-1.5`}>
              <div className={`px-3.5 py-2.5 rounded-2xl border-2 border-foreground ${m.role === "user" ? "bg-sky text-white rounded-tr-sm" : "bg-card rounded-tl-sm"}`}>
                {m.role === "assistant" && m.content === "" && streaming ? (
                  <Loader2 className="w-4 h-4 animate-spin text-lime" />
                ) : (
                  <div className="prose-chat">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t-2 border-foreground p-3 bg-card">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={streaming}
              className="text-[11px] px-2 py-1 rounded-md border border-foreground/30 hover:border-foreground hover:bg-lime/20 transition-colors disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={streaming ? "Streaming…" : "Ask anything about voting…"}
            disabled={streaming}
            className="flex-1 px-3 py-2 rounded-xl border-2 border-foreground bg-background text-foreground outline-none focus:border-lime transition-colors text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="px-4 rounded-xl border-2 border-foreground bg-lime text-ink hover:bg-foreground hover:text-background transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </section>
  );
};
