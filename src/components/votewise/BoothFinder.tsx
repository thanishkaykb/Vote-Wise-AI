import { MOCK_BOOTHS } from "@/data/electionData";
import { MapPin, CheckCircle2 } from "lucide-react";

type Props = {
  selectedBoothId?: string;
  onSelect: (boothId: string, boothName: string) => void;
};

export const BoothFinder = ({ selectedBoothId, onSelect }: Props) => {
  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-xl">Find your booth</h2>
          <p className="text-sm text-muted-foreground">Pick any booth · in production, queries ECI Electoral Search</p>
        </div>
        {selectedBoothId && (
          <div className="chip bg-lime text-ink border-ink">
            <CheckCircle2 className="w-3 h-3" /> Booth locked in
          </div>
        )}
      </div>
      <ul className="space-y-2">
        {MOCK_BOOTHS.map((b, i) => {
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
