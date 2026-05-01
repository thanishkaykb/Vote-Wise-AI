import { useMemo } from "react";
import { boothsForCity } from "@/data/electionData";
import { MapPin, Sparkles, AlertCircle, Lock } from "lucide-react";

type Props = {
  city?: string;
};

// Read-only "predicted booth" display.
// Real booth assignment is done by ECI based on your address — we just predict
// the most likely station near the city/locality the user shared.
export const BoothFinder = ({ city }: Props) => {
  const { booths, matched } = useMemo(() => boothsForCity(city), [city]);
  const cityLabel = city?.trim();
  const top = booths[0];
  const others = booths.slice(1);

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            Predicted polling booth
            <span className="chip bg-lime text-ink border-foreground"><Sparkles className="w-3 h-3" /> Prediction</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {matched
              ? <>Based on <span className="text-lime font-semibold capitalize">{matched}</span> from your profile · ECI assigns the actual booth from your registered address.</>
              : cityLabel
                ? <>No mapping for <span className="font-semibold">{cityLabel}</span> yet — showing a generic prediction.</>
                : <>Add your city in the Profile section above to see your predicted booth.</>
            }
          </p>
        </div>
        <div className="chip bg-background text-foreground border-foreground">
          <Lock className="w-3 h-3" /> Auto-assigned
        </div>
      </div>

      {!cityLabel && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl border-2 border-foreground bg-background/50">
          <AlertCircle className="w-4 h-4 text-lime mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Tip: enter your city in the Profile section above so the prediction matches where you actually live.
          </p>
        </div>
      )}

      {/* Top prediction */}
      {top && (
        <div className="p-4 rounded-xl border-2 border-foreground bg-lime text-ink shadow-brutal-sm">
          <div className="text-[11px] uppercase tracking-widest font-bold">Most likely · 1st prediction</div>
          <div className="font-display font-bold text-lg mt-0.5">{top.name}</div>
          <div className="text-xs flex items-center gap-1 mt-1 text-ink/80">
            <MapPin className="w-3 h-3" /> {top.address} · ~{top.distanceKm} km from your locality
          </div>
        </div>
      )}

      {/* Alternates */}
      {others.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
            Other nearby booths in your area
          </div>
          <ul className="space-y-2">
            {others.map((b, i) => (
              <li
                key={b.id}
                className="flex items-start gap-3 p-3 rounded-xl border-2 border-foreground bg-background"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold border-2 border-foreground bg-foreground text-background">
                  {i + 2}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{b.name}</div>
                  <div className="text-xs flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {b.address} · ~{b.distanceKm} km
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-4">
        ⚠️ Your real booth is decided by ECI based on your registered address. Verify on{" "}
        <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noopener noreferrer" className="text-lime font-semibold underline underline-offset-2">
          electoralsearch.eci.gov.in
        </a>.
      </p>
    </section>
  );
};
