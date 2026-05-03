import { useEffect, useState } from "react";
import { MapPin, Sparkles, AlertCircle, Lock, Loader2, ExternalLink, Search } from "lucide-react";
import { type PredictedBooth } from "@/lib/boothLookup";
import { Input } from "@/components/ui/input";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type BoothLookupResponse = {
  booths: PredictedBooth[];
  geo: { displayName: string } | null;
};

type Props = {
  city?: string;
};

export const BoothFinder = ({ city }: Props) => {
  const [manualQuery, setManualQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState<string>("");
  const [booths, setBooths] = useState<PredictedBooth[]>([]);
  const [geoName, setGeoName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "empty" | "error">("idle");

  // Whenever the profile city changes, use it as the active query (unless user has typed their own)
  useEffect(() => {
    if (city && city.trim() && !manualQuery.trim()) {
      setActiveQuery(city.trim());
    }
  }, [city, manualQuery]);

  // Run lookup whenever activeQuery changes
  useEffect(() => {
    const q = activeQuery.trim();
    if (!q) {
      setBooths([]);
      setGeoName(null);
      setStatus("idle");
      return;
    }
    const ctrl = new AbortController();
    setStatus("loading");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/booth-predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON}`,
            apikey: ANON,
          },
          body: JSON.stringify({ query: q }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          throw new Error(`Booth lookup failed [${res.status}]`);
        }

        const result = (await res.json()) as BoothLookupResponse;
        if (ctrl.signal.aborted) return;

        if (!result?.geo) {
          setBooths([]);
          setGeoName(null);
          setStatus("empty");
          return;
        }

        setGeoName(result.geo.displayName);
        setBooths(result.booths ?? []);
        setStatus((result.booths?.length ?? 0) > 0 ? "ok" : "empty");
      } catch (e) {
        if (ctrl.signal.aborted) return;
        console.warn("[booth] lookup failed", e);
        setStatus("error");
      }
    }, 500);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [activeQuery]);

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = manualQuery.trim();
    if (q) setActiveQuery(q);
  };

  const top = booths[0];
  const others = booths.slice(1);
  const displayQuery = activeQuery || city?.trim();

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-xl flex items-center gap-2 flex-wrap">
            Predicted polling booth
            <span className="chip bg-lime text-ink border-foreground"><Sparkles className="w-3 h-3" /> Live · OSM</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {!displayQuery ? (
              <>Type your address / locality below, or set city in your Profile above.</>
            ) : status === "loading" ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding real schools & community halls near <span className="text-lime font-semibold">{displayQuery}</span>…</span>
            ) : status === "ok" ? (
              <>Top matches near <span className="text-lime font-semibold">{displayQuery}</span> — pulled live from OpenStreetMap.</>
            ) : status === "empty" ? (
              <>Couldn't find buildings near <span className="font-semibold">{displayQuery}</span>. Try something more specific (e.g. "Jayanagar, Bengaluru" or "Andheri West, Mumbai").</>
            ) : (
              <>Couldn't reach OpenStreetMap right now — try again in a moment.</>
            )}
          </p>
        </div>
        <div className="chip bg-background text-foreground border-foreground">
          <Lock className="w-3 h-3" /> Auto-assigned
        </div>
      </div>

      {/* Manual address input — works even without filling out profile */}
      <form onSubmit={onManualSubmit} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Type any address — e.g. Indiranagar Bengaluru, Salt Lake Kolkata, Andheri Mumbai"
            className="pl-9 border-2 border-foreground rounded-xl"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl border-2 border-foreground bg-lime text-ink font-bold text-sm hover:shadow-brutal-sm transition-all whitespace-nowrap"
        >
          Predict
        </button>
      </form>

      {!displayQuery && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl border-2 border-foreground bg-background/50">
          <AlertCircle className="w-4 h-4 text-lime mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Tip: be specific — "Koramangala, Bengaluru" works better than just "Bengaluru".
          </p>
        </div>
      )}

      {status === "loading" && (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl border-2 border-foreground bg-background animate-pulse" />
          ))}
        </div>
      )}

      {status === "ok" && top && (
        <>
          <div className="p-4 rounded-xl border-2 border-foreground bg-lime text-ink shadow-brutal-sm">
            <div className="text-[11px] uppercase tracking-widest font-bold">Most likely · 1st prediction</div>
            <div className="font-display font-bold text-lg mt-0.5">{top.name}</div>
            <div className="text-xs flex items-center gap-1 mt-1 text-ink/80">
              <MapPin className="w-3 h-3" /> {top.address} · ~{top.distanceKm} km · {top.type}
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${top.lat}&mlon=${top.lon}#map=18/${top.lat}/${top.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold mt-2 underline underline-offset-2"
            >
              View on map <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {others.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                Other nearby candidates
              </div>
              <ul className="space-y-2">
                {others.map((b, i) => (
                  <li key={b.id} className="flex items-start gap-3 p-3 rounded-xl border-2 border-foreground bg-background">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold border-2 border-foreground bg-foreground text-background shrink-0">
                      {i + 2}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{b.name}</div>
                      <div className="text-xs flex items-center gap-1 mt-0.5 text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{b.address} · ~{b.distanceKm} km · {b.type}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lon}#map=18/${b.lat}/${b.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-foreground hover:bg-lime hover:text-ink transition-colors shrink-0"
                    >
                      Map <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {geoName && status === "ok" && (
        <p className="text-[11px] text-muted-foreground mt-4 truncate">
          📍 Geocoded as: <span className="text-foreground/80">{geoName}</span>
        </p>
      )}

      <p className="text-[11px] text-muted-foreground mt-3">
        ⚠️ Your real booth is decided by ECI based on your registered address. Verify on{" "}
        <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noopener noreferrer" className="text-lime font-semibold underline underline-offset-2">
          electoralsearch.eci.gov.in
        </a>.
      </p>
    </section>
  );
};
