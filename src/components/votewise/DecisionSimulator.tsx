import { useMemo, useState } from "react";
import { simulateOutcome } from "@/lib/civicEngine";
import { Slider } from "@/components/ui/slider";
import { Zap, TrendingUp, Users } from "lucide-react";

// Real Indian races decided by tiny margins — grounds the simulation in reality.
const REAL_MARGINS = [
  { race: "Atingi-Mongchak (Arunachal, 2014)", margin: 1, unit: "vote" },
  { race: "RK Nagar bypoll (TN, 2017) — NOTA exceeded margin", margin: 2017, unit: "votes (NOTA: 2,373)" },
  { race: "Kanker (Chhattisgarh LS, 2019)", margin: 6914, unit: "votes" },
  { race: "Machhalishahr (UP LS, 2019)", margin: 181, unit: "votes" },
];

const GROUPS = [
  { id: "youth", label: "First-time voters (18–25)", default: 45 },
  { id: "women", label: "Women voters in your area", default: 58 },
  { id: "urban", label: "Urban professionals", default: 52 },
  { id: "custom", label: "Your community / colony", default: 55 },
];

export const DecisionSimulator = () => {
  const [groupId, setGroupId] = useState("youth");
  const [turnout, setTurnout] = useState(45);
  const [lean, setLean] = useState(60);
  const [vote, setVote] = useState<"vote" | "skip">("vote");
  const [seatSize, setSeatSize] = useState(150000); // typical assembly seat electorate

  const group = GROUPS.find((g) => g.id === groupId)!;

  // If user skips, model a -8pp drop in their *group's* turnout (one absent voter
  // also discourages their immediate circle: family, roommates).
  const effectiveTurnout = vote === "vote" ? turnout : Math.max(0, turnout - 8);
  const r = useMemo(() => simulateOutcome(effectiveTurnout, lean), [effectiveTurnout, lean]);
  const baseline = useMemo(() => simulateOutcome(turnout, lean), [turnout, lean]);
  const swing = r.a - baseline.a;
  const votesShifted = Math.round((Math.abs(swing) / 100) * seatSize);

  const real = REAL_MARGINS[Math.floor(Math.random() * REAL_MARGINS.length)];

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <div className="chip bg-lime text-ink border-foreground"><Zap className="w-3 h-3" /> Live simulator</div>
        <div className="chip bg-sky text-white border-foreground"><TrendingUp className="w-3 h-3" /> India context</div>
      </div>
      <h2 className="font-display font-bold text-xl mt-2">Does your one vote actually matter?</h2>
      <p className="text-sm text-muted-foreground">
        Pick a group, set their turnout, decide if you show up. Watch the seat flip in real time.
      </p>

      <div className="mt-5 grid gap-5">
        {/* Group selector */}
        <div>
          <div className="text-xs uppercase tracking-wide font-bold flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5" /> Which group are you in?
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => { setGroupId(g.id); setTurnout(g.default); }}
                className={`p-2.5 rounded-xl border-2 border-foreground text-left text-sm font-semibold transition-all ${
                  groupId === g.id
                    ? "bg-lime text-ink shadow-brutal-sm -translate-x-0.5 -translate-y-0.5"
                    : "bg-background hover:bg-foreground/5"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-semibold">
            <span>{group.label} turnout</span>
            <span className="font-mono text-lime">{turnout}%</span>
          </div>
          <Slider value={[turnout]} onValueChange={(v) => setTurnout(v[0])} max={100} step={1} className="mt-2" />
          <div className="text-[11px] text-muted-foreground mt-1">India's national avg turnout: ~67% (2024 LS)</div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-semibold">
            <span>This group leans toward Candidate A</span>
            <span className="font-mono text-lime">{lean}%</span>
          </div>
          <Slider value={[lean]} onValueChange={(v) => setLean(v[0])} max={100} step={1} className="mt-2" />
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide font-bold mb-2">Your choice on polling day</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVote("vote")}
              className={`p-3 rounded-xl border-2 border-foreground font-bold transition-all ${
                vote === "vote" ? "bg-lime text-ink shadow-brutal-sm -translate-x-0.5 -translate-y-0.5" : "bg-background hover:bg-foreground/5"
              }`}
            >
              🗳️ I show up & vote
            </button>
            <button
              onClick={() => setVote("skip")}
              className={`p-3 rounded-xl border-2 border-foreground font-bold transition-all ${
                vote === "skip" ? "bg-coral text-white shadow-brutal-sm -translate-x-0.5 -translate-y-0.5" : "bg-background hover:bg-foreground/5"
              }`}
            >
              😴 I skip / "doesn't matter"
            </button>
          </div>
        </div>

        {/* Outcome bar */}
        <div className="mt-2">
          <div className="flex h-12 rounded-xl border-2 border-foreground overflow-hidden font-display font-bold">
            <div
              className="bg-sky text-white flex items-center justify-center transition-all duration-500 min-w-[20%]"
              style={{ width: `${r.a}%` }}
            >
              A · {r.a}%
            </div>
            <div
              className="bg-coral text-white flex items-center justify-center transition-all duration-500 min-w-[20%]"
              style={{ width: `${r.b}%` }}
            >
              B · {r.b}%
            </div>
          </div>

          <div className="mt-3 p-4 bg-background border-2 border-foreground rounded-xl">
            <div className="text-[11px] uppercase tracking-widest font-bold text-lime">Result</div>
            <div className="font-display font-bold text-lg mt-0.5 text-foreground">
              Candidate {r.winner} wins
              {swing !== 0 && (
                <span className="ml-2 text-sm font-mono text-lime">
                  ({swing > 0 ? "+" : ""}{swing}pp swing vs. you-voting baseline)
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {vote === "skip" ? (
                <>You sitting out shifts <span className="font-bold text-coral">~{votesShifted.toLocaleString("en-IN")} votes</span> in a 1.5L-voter seat. That's enough to flip many real Indian races.</>
              ) : (
                <>Voting puts your group's voice on the record. Each vote stacks — see the real margin below.</>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-foreground/20">
              <div className="text-[11px] uppercase tracking-widest font-bold text-sky">Real margin · India</div>
              <div className="text-xs text-foreground mt-0.5"><span className="font-bold">{real.race}</span> — won by just {real.margin.toLocaleString("en-IN")} {real.unit}.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
