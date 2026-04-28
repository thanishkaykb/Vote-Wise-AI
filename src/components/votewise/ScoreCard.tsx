import { CivicState, readinessScore, UserProfile } from "@/lib/civicEngine";
import { TrendingUp, Award } from "lucide-react";

const STATE_LABEL: Record<CivicState, { label: string; tone: string }> = {
  unknown: { label: "Tell us about you", tone: "bg-muted" },
  not_eligible: { label: "Not yet eligible", tone: "bg-coral text-white" },
  eligible_unregistered: { label: "Eligible — register now", tone: "bg-sky text-white" },
  registered_uninformed: { label: "Registered — get informed", tone: "bg-lime text-ink" },
  ready: { label: "Ready to vote 🎉", tone: "bg-lime text-ink" },
};

export const ScoreCard = ({ profile, state }: { profile: UserProfile; state: CivicState }) => {
  const score = readinessScore(profile);
  const badge = STATE_LABEL[state];
  const badges = [
    { id: "elig", label: "Eligible", earned: !!profile.isCitizen && (profile.age ?? 0) >= 18, emoji: "🪪" },
    { id: "reg", label: "Registered", earned: !!profile.isRegistered, emoji: "📋" },
    { id: "epic", label: "EPIC", earned: !!profile.hasEPIC, emoji: "🆔" },
    { id: "aware", label: "Informed", earned: (profile.awarenessScore ?? 0) >= 60, emoji: "🧠" },
    { id: "booth", label: "Booth", earned: !!profile.knowsBooth, emoji: "📍" },
    { id: "plan", label: "Plan", earned: !!profile.preparedness, emoji: "🗓️" },
  ];

  return (
    <section className="brutal-card p-6 md:p-8 bg-card relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-lime/40 blur-2xl pointer-events-none" />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" /> Your civic readiness
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="font-display font-bold text-6xl md:text-7xl tracking-tight tabular-nums">{score}</div>
            <div className="text-2xl font-display text-muted-foreground">/100</div>
          </div>
          <div className={`chip mt-3 ${badge.tone} border-ink`}>{badge.label}</div>
        </div>

        <div className="flex flex-wrap gap-2 max-w-xs">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-foreground text-xs font-semibold transition-all ${
                b.earned ? "bg-lime text-ink shadow-brutal-sm" : "bg-muted text-muted-foreground opacity-60"
              }`}
              title={b.label}
            >
              <span className={b.earned ? "" : "grayscale"}>{b.emoji}</span>
              <span>{b.label}</span>
              {b.earned && <Award className="w-3 h-3" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 w-full bg-muted rounded-full border-2 border-ink overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lime to-lime-deep transition-all duration-700 ease-out"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground font-medium">
          Built from: eligibility · registration · awareness · preparedness
        </div>
      </div>
    </section>
  );
};
