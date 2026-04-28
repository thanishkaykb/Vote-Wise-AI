import { useMemo, useState } from "react";
import { simulateOutcome } from "@/lib/civicEngine";
import { Slider } from "@/components/ui/slider";
import { Zap } from "lucide-react";

export const DecisionSimulator = () => {
  const [turnout, setTurnout] = useState(55);
  const [lean, setLean] = useState(60);
  const [vote, setVote] = useState<"vote" | "skip">("vote");

  const effectiveTurnout = vote === "vote" ? turnout : Math.max(0, turnout - 10);
  const r = useMemo(() => simulateOutcome(effectiveTurnout, lean), [effectiveTurnout, lean]);
  const baseline = useMemo(() => simulateOutcome(turnout, lean), [turnout, lean]);
  const swing = r.a - baseline.a;

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center gap-2 mb-1">
        <div className="chip bg-lime"><Zap className="w-3 h-3" /> Simulator</div>
      </div>
      <h2 className="font-display font-bold text-xl mt-2">What happens if you don't vote?</h2>
      <p className="text-sm text-muted-foreground">Move the sliders. Watch the outcome shift in real time.</p>

      <div className="mt-5 grid gap-5">
        <div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Your group's turnout</span>
            <span className="font-mono">{turnout}%</span>
          </div>
          <Slider value={[turnout]} onValueChange={(v) => setTurnout(v[0])} max={100} step={1} className="mt-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Your group leans toward Party A</span>
            <span className="font-mono">{lean}%</span>
          </div>
          <Slider value={[lean]} onValueChange={(v) => setLean(v[0])} max={100} step={1} className="mt-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setVote("vote")}
            className={`p-3 rounded-xl border-2 border-ink font-bold transition-all ${vote === "vote" ? "bg-lime shadow-brutal-sm" : "bg-paper"}`}
          >
            🗳️ I vote
          </button>
          <button
            onClick={() => setVote("skip")}
            className={`p-3 rounded-xl border-2 border-ink font-bold transition-all ${vote === "skip" ? "bg-coral text-white shadow-brutal-sm" : "bg-paper"}`}
          >
            😴 I skip
          </button>
        </div>

        <div className="mt-2">
          <div className="flex h-12 rounded-xl border-2 border-ink overflow-hidden font-display font-bold">
            <div
              className="bg-sky text-white flex items-center justify-center transition-all duration-500"
              style={{ width: `${r.a}%` }}
            >
              A · {r.a}%
            </div>
            <div
              className="bg-coral text-white flex items-center justify-center transition-all duration-500"
              style={{ width: `${r.b}%` }}
            >
              B · {r.b}%
            </div>
          </div>
          <div className="mt-3 p-3 bg-ink text-paper rounded-xl">
            <div className="text-xs uppercase tracking-widest font-bold text-lime">Result</div>
            <div className="font-display font-bold text-lg mt-0.5">
              Party {r.winner} wins
              {swing !== 0 && (
                <span className="ml-2 text-sm font-mono text-lime">
                  ({swing > 0 ? "+" : ""}{swing}% A vs. baseline)
                </span>
              )}
            </div>
            <div className="text-xs text-paper/70 mt-1">
              {vote === "skip"
                ? "Skipping shrinks your group's voice. Small dropouts decide close races."
                : "Voting amplifies your group's preference at the booth."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
