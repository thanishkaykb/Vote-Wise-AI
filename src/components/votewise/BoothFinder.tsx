import { useMemo } from "react";
import { boothsForCity } from "@/data/electionData";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
  city?: string;
  selectedBoothId?: string;
  onSelect: (boothId: string, boothName: string) => void;
};

export const BoothFinder = ({ city, selectedBoothId, onSelect }: Props) => {
  const { booths, matched } = useMemo(() => boothsForCity(city), [city]);
  const cityLabel = city?.trim();

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-xl">Find your booth</h2>
          <p className="text-sm text-muted-foreground">
            {matched
              ? <>Showing booths near <span className="text-lime font-semibold capitalize">{matched}</span> · matched from your profile</>
              : cityLabel
                ? <>No booths mocked for <span className="font-semibold">{cityLabel}</span> — showing generic samples. Try Bengaluru, Mumbai, Delhi, Hyderabad, Chennai, Kolkata, Pune.</>
                : <>Add your city in the Profile to see booths near you. In production, queries ECI Electoral Search.</>
            }
          </p>
        </div>
        {selectedBoothId && (
          <div className="chip bg-lime text-ink border-foreground">
            <CheckCircle2 className="w-3 h-3" /> Booth locked in
          </div>
        )}
      </div>

      {!cityLabel && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl border-2 border-foreground bg-background/50">
          <AlertCircle className="w-4 h-4 text-lime mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Tip: enter your city in the Profile section above so booths match where you actually live.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {booths.map((b, i) => {
          const selected = selectedBoothId === b.id;
          return (
            <li key={b.id}>
              <button
                onClick={() => onSelect(b.id, b.name)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 border-foreground text-left transition-all ${
                  selected
                    ? "bg-lime text-ink shadow-brutal-sm -translate-x-0.5 -translate-y-0.5"
                    : "bg-background hover:bg-foreground/5"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold border-2 border-foreground ${selected ? "bg-background text-foreground" : "bg-foreground text-background"}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{b.name}</div>
                  <div className={`text-xs flex items-center gap-1 mt-0.5 ${selected ? "text-ink/70" : "text-muted-foreground"}`}>
                    <MapPin className="w-3 h-3" /> {b.address} · {b.distanceKm} km
                  </div>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded-md border-2 border-foreground ${selected ? "bg-foreground text-background" : "bg-background"}`}>
                  {selected ? "Selected" : "Pick"}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
