import { useEffect, useState } from "react";
import { Zap, TrendingUp, Users, Sparkles, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FUN_FACTS = [
  "In 2008, C.P. Joshi (Rajasthan) lost by just 1 vote — and his own family hadn't voted that day.",
  "Atingi-Mongchak (Arunachal, 2014) was won by a margin of exactly 1 vote.",
  "RK Nagar bypoll, Tamil Nadu 2017: NOTA got 2,373 votes — more than the winning margin between several candidates.",
  "Machhalishahr (UP, 2019 Lok Sabha) was decided by just 181 votes out of ~10 lakh cast.",
  "India's 2024 Lok Sabha turnout was ~67% — meaning 1 in 3 eligible voters didn't show up. That's ~30 crore silent votes.",
  "First-time voters (18–25) form ~20% of India's electorate but historically vote at lower rates than seniors.",
  "Form 6 takes ~10 minutes online at voters.eci.gov.in — most rejections happen because of mismatched address proof.",
  "VVPAT slips are stored for 45 days post-counting. You can request an audit if you suspect tampering.",
];

const GROUPS = [
  { id: "youth", label: "First-time voters (18–25)", emoji: "🎓" },
  { id: "women", label: "Women voters in your area", emoji: "👩" },
  { id: "urban", label: "Urban professionals", emoji: "💼" },
  { id: "custom", label: "Your community / colony", emoji: "🏘️" },
] as const;

type GroupId = typeof GROUPS[number]["id"];

const VOTED_KEY = "votewise.poll.voted.v2"; // v2: array of group IDs (multi-select)
const VOTER_KEY = "votewise.poll.voter.v1";

function getVoterKey() {
  let k = localStorage.getItem(VOTER_KEY);
  if (!k) {
    k = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) + "-" + Date.now();
    localStorage.setItem(VOTER_KEY, k);
  }
  return k;
}

function readMyVotes(): Set<GroupId> {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as GroupId[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function writeMyVotes(s: Set<GroupId>) {
  try { localStorage.setItem(VOTED_KEY, JSON.stringify([...s])); } catch {}
}

export const DecisionSimulator = () => {
  const [counts, setCounts] = useState<Record<GroupId, number>>({ youth: 0, women: 0, urban: 0, custom: 0 });
  const [myVotes, setMyVotes] = useState<Set<GroupId>>(() => readMyVotes());
  const [pending, setPending] = useState<GroupId | null>(null);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));

  useEffect(() => {
    const fetchCounts = async () => {
      const { data, error } = await supabase.from("poll_votes").select("group_id");
      if (error) {
        console.warn("[poll] fetch failed", error.message);
        return;
      }
      const next: Record<GroupId, number> = { youth: 0, women: 0, urban: 0, custom: 0 };
      for (const row of data ?? []) {
        const g = row.group_id as GroupId;
        if (g in next) next[g]++;
      }
      setCounts(next);
    };
    fetchCounts();

    const channel = supabase
      .channel("poll_votes_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "poll_votes" },
        (payload) => {
          const g = (payload.new as any).group_id as GroupId;
          setCounts((prev) => (g in prev ? { ...prev, [g]: prev[g] + 1 } : prev));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "poll_votes" },
        (payload) => {
          const g = (payload.old as any).group_id as GroupId;
          setCounts((prev) => (g in prev ? { ...prev, [g]: Math.max(0, prev[g] - 1) } : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const total = counts.youth + counts.women + counts.urban + counts.custom;
  const maxCount = Math.max(1, counts.youth, counts.women, counts.urban, counts.custom);

  const toggleVote = async (g: GroupId) => {
    if (pending) return;
    setPending(g);
    const voter_key = getVoterKey();
    const alreadyVoted = myVotes.has(g);

    if (alreadyVoted) {
      // un-vote
      const { error } = await supabase
        .from("poll_votes")
        .delete()
        .eq("voter_key", voter_key)
        .eq("group_id", g);
      setPending(null);
      if (error) {
        toast.error("Couldn't remove your vote — try again.");
        return;
      }
      const next = new Set(myVotes);
      next.delete(g);
      setMyVotes(next);
      writeMyVotes(next);
      toast("Vote removed");
    } else {
      const { error } = await supabase
        .from("poll_votes")
        .insert({ voter_key, group_id: g });
      setPending(null);
      if (error && error.code !== "23505") {
        toast.error("Couldn't record your vote — try again.");
        return;
      }
      const next = new Set(myVotes);
      next.add(g);
      setMyVotes(next);
      writeMyVotes(next);
      toast.success("Vote recorded · live poll updated");
    }
  };

  const fact = FUN_FACTS[factIndex];

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <div className="chip bg-lime text-ink border-foreground"><Zap className="w-3 h-3" /> Live poll</div>
        <div className="chip bg-sky text-white border-foreground"><TrendingUp className="w-3 h-3" /> India context</div>
      </div>
      <h2 className="font-display font-bold text-xl mt-2">Does your one vote actually matter?</h2>
      <p className="text-sm text-muted-foreground">
        Vote for any groups you belong to — pick more than one if it fits. Tap again to remove. The tally updates live as people across the country join in.
      </p>

      <div className="mt-5 grid gap-5">
        <div>
          <div className="text-xs uppercase tracking-wide font-bold flex items-center gap-1.5 mb-3">
            <Users className="w-3.5 h-3.5" /> Which group are you in?
            <span className="ml-auto font-mono text-muted-foreground normal-case tracking-normal">
              {total.toLocaleString("en-IN")} {total === 1 ? "vote" : "votes"} cast
            </span>
          </div>
          <div className="space-y-2.5">
            {GROUPS.map((g) => {
              const c = counts[g.id];
              const pct = total > 0 ? Math.round((c / total) * 100) : 0;
              const widthPct = total > 0 ? Math.max(4, (c / maxCount) * 100) : 0;
              const mine = myVotes.has(g.id);
              const isPending = pending === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => toggleVote(g.id)}
                  disabled={pending !== null && !isPending}
                  className={`relative w-full overflow-hidden p-3 rounded-xl border-2 border-foreground text-left transition-all ${
                    mine
                      ? "bg-background shadow-brutal-sm -translate-x-0.5 -translate-y-0.5"
                      : "bg-background hover:bg-foreground/5 cursor-pointer"
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-lime/80 transition-all duration-700 ease-out"
                    style={{ width: `${widthPct}%` }}
                    aria-hidden
                  />
                  <div className="relative flex items-center gap-3">
                    <div className="text-xl">{g.emoji}</div>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${widthPct > 30 ? "text-ink" : "text-foreground"}`}>
                        {g.label}
                        {mine && <span className="ml-2 text-[11px] uppercase tracking-wide font-bold bg-ink text-paper px-1.5 py-0.5 rounded">Your vote</span>}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${widthPct > 30 ? "text-ink/70" : "text-muted-foreground"}`}>
                        {c.toLocaleString("en-IN")} {c === 1 ? "voter" : "voters"} · {pct}%
                      </div>
                    </div>
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-md border-2 border-foreground inline-flex items-center gap-1 ${
                      mine ? "bg-ink text-paper" : "bg-background text-foreground"
                    }`}>
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : mine ? (
                        <><Check className="w-3.5 h-3.5" /> Voted · tap to undo</>
                      ) : "Vote"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Pick as many groups as fit you. Tap again to un-vote. Anonymous — only totals are stored.
          </p>
        </div>

        <div className="p-4 bg-background border-2 border-foreground rounded-xl">
          <div className="flex items-center gap-2">
            <div className="text-[11px] uppercase tracking-widest font-bold text-lime flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Did you know?
            </div>
            <button
              onClick={() => setFactIndex((i) => (i + 1) % FUN_FACTS.length)}
              className="ml-auto text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border-2 border-foreground hover:bg-lime hover:text-ink transition-colors"
            >
              Next fact
            </button>
          </div>
          <p className="text-sm text-foreground mt-2 leading-relaxed">{fact}</p>
        </div>
      </div>
    </section>
  );
};
