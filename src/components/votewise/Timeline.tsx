import { useState } from "react";
import { ELECTION_TIMELINE } from "@/data/electionData";
import { Calendar, AlertTriangle, Vote } from "lucide-react";

const ICON: Record<string, JSX.Element> = {
  deadline: <AlertTriangle className="w-4 h-4" />,
  voting: <Vote className="w-4 h-4" />,
  info: <Calendar className="w-4 h-4" />,
};

const TONE: Record<string, string> = {
  deadline: "bg-coral text-white",
  voting: "bg-lime",
  info: "bg-sky text-white",
};

export const Timeline = ({ city }: { city?: string }) => {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="mb-4">
        <h2 className="font-display font-bold text-xl">Election timeline</h2>
        <p className="text-sm text-muted-foreground">
          {city ? `Localized for ${city}` : "General timeline · add your city in profile"}
        </p>
      </div>
      <ol className="relative border-l-2 border-ink ml-3 space-y-4">
        {ELECTION_TIMELINE.map((e) => {
          const date = new Date(e.date);
          const isOpen = open === e.id;
          return (
            <li key={e.id} className="pl-5 relative">
              <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 border-ink flex items-center justify-center ${TONE[e.type]}`}>
                {ICON[e.type]}
              </span>
              <button
                onClick={() => setOpen(isOpen ? null : e.id)}
                className="text-left w-full"
              >
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                <div className="font-semibold">{e.title}</div>
                {isOpen && <div className="text-sm text-muted-foreground mt-1 animate-slide-up">{e.description}</div>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
