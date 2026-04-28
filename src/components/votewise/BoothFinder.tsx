import { MOCK_BOOTHS } from "@/data/electionData";
import { MapPin, CheckCircle2 } from "lucide-react";

type Props = { onConfirm: () => void; confirmed?: boolean };

export const BoothFinder = ({ onConfirm, confirmed }: Props) => {
  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-xl">Find your booth</h2>
          <p className="text-sm text-muted-foreground">Mock data · in production, queries ECI Electoral Search</p>
        </div>
        {confirmed && <div className="chip bg-lime"><CheckCircle2 className="w-3 h-3" /> Locked in</div>}
      </div>
      <ul className="space-y-2">
        {MOCK_BOOTHS.map((b, i) => (
          <li key={b.id} className="flex items-start gap-3 p-3 rounded-xl border-2 border-ink bg-paper hover:bg-lime/20 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-ink text-paper flex items-center justify-center font-bold">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{b.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {b.address} · {b.distanceKm} km
              </div>
            </div>
            {i === 0 && (
              <button
                onClick={onConfirm}
                className="text-xs font-bold px-3 py-1.5 rounded-md bg-lime border-2 border-ink hover:shadow-brutal-sm transition-all"
              >
                {confirmed ? "Selected" : "Pick"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
