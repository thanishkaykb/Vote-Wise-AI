import { useEffect, useRef, useState } from "react";
import { assistantReply, UserProfile } from "@/lib/civicEngine";
import { QUICK_PROMPTS } from "@/data/electionData";
import { Send, Bot, User } from "lucide-react";

type Msg = { from: "bot" | "user"; text: string; followups?: string[] };

export const Assistant = ({ profile, eli15 }: { profile: UserProfile; eli15: boolean }) => {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: eli15 ? "Hey! I'm your voting buddy. What do you want to know?" : "Hello — I'm your civic assistant. Ask me anything about voting.", followups: QUICK_PROMPTS.slice(0, 3) },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = (q: string) => {
    if (!q.trim()) return;
    const reply = assistantReply(q, profile, eli15);
    setMsgs((m) => [...m, { from: "user", text: q }, { from: "bot", ...reply }]);
    setInput("");
  };

  return (
    <section className="brutal-card p-0 bg-card overflow-hidden flex flex-col h-[520px]">
      <div className="px-5 py-3 border-b-2 border-ink bg-ink text-paper flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-lime flex items-center justify-center">
          <Bot className="w-4 h-4 text-ink" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display font-bold leading-none">Civic Assistant</div>
          <div className="text-[10px] uppercase tracking-widest text-lime">{eli15 ? "Simplified mode" : "Standard mode"}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-paper">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.from === "user" ? "flex-row-reverse" : ""} animate-slide-up`}>
            <div className={`w-7 h-7 shrink-0 rounded-full border-2 border-ink flex items-center justify-center ${m.from === "user" ? "bg-sky text-white" : "bg-lime"}`}>
              {m.from === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[80%] ${m.from === "user" ? "items-end" : ""} flex flex-col gap-1.5`}>
              <div className={`px-3.5 py-2.5 rounded-2xl border-2 border-ink text-sm ${m.from === "user" ? "bg-sky text-white rounded-tr-sm" : "bg-card rounded-tl-sm"}`}>
                {m.text}
              </div>
              {m.followups && (
                <div className="flex flex-wrap gap-1.5">
                  {m.followups.map((f) => (
                    <button key={f} onClick={() => send(f)} className="text-xs px-2.5 py-1 rounded-full border-2 border-ink bg-card hover:bg-lime transition-colors">
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t-2 border-ink p-3 bg-card">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} className="text-[11px] px-2 py-1 rounded-md border border-ink/30 hover:border-ink hover:bg-lime/30 transition-colors">
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about voting…"
            className="flex-1 px-3 py-2 rounded-xl border-2 border-ink bg-paper outline-none focus:bg-lime/20 transition-colors text-sm"
          />
          <button type="submit" className="px-4 rounded-xl border-2 border-ink bg-ink text-paper hover:bg-lime hover:text-ink transition-colors flex items-center justify-center">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
};
