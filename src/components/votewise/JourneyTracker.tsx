import { nextSteps, UserProfile } from "@/lib/civicEngine";
import { Check, ArrowRight } from "lucide-react";

type Props = {
  profile: UserProfile;
  onAction: (id: string) => void;
};

export const JourneyTracker = ({ profile, onAction }: Props) => {
  const steps = nextSteps(profile);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-xl">Your voting journey</h2>
          <p className="text-sm text-muted-foreground">{doneCount} of {steps.length} milestones complete</p>
        </div>
        <div className="font-mono text-xs px-2 py-1 bg-ink text-paper rounded-md">
          {Math.round((doneCount / steps.length) * 100)}%
        </div>
      </div>

      <ol className="relative space-y-3">
        {steps.map((s, i) => (
          <li key={s.id} className="flex items-start gap-3 group">
            <div className="flex flex-col items-center pt-1">
              <div
                className={`w-8 h-8 rounded-full border-2 border-ink flex items-center justify-center font-bold text-sm transition-all ${
                  s.done ? "bg-lime shadow-brutal-sm" : "bg-paper"
                }`}
              >
                {s.done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-0.5 flex-1 my-1 ${s.done ? "bg-ink" : "bg-ink/20"}`} style={{ minHeight: 20 }} />}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className={`font-semibold ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.label}</div>
                {!s.done && (
                  <button
                    onClick={() => onAction(s.id)}
                    className="text-xs font-bold inline-flex items-center gap-1 px-2.5 py-1 bg-ink text-paper rounded-md hover:bg-lime hover:text-ink transition-colors"
                  >
                    {s.cta} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.hint}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
