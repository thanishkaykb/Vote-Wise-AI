import { useState } from "react";
import { LEARNING_CARDS } from "@/data/electionData";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

type Props = {
  eli15: boolean;
  onComplete?: () => void;
};

export const LearningCards = ({ eli15, onComplete }: Props) => {
  const [i, setI] = useState(0);
  const card = LEARNING_CARDS[i];

  const next = () => {
    if (i === LEARNING_CARDS.length - 1) {
      onComplete?.();
      return;
    }
    setI((x) => Math.min(LEARNING_CARDS.length - 1, x + 1));
  };
  const prev = () => setI((x) => Math.max(0, x - 1));

  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="chip bg-sky text-white"><BookOpen className="w-3 h-3" /> Micro learning</div>
        <div className="font-mono text-xs">{i + 1} / {LEARNING_CARDS.length}</div>
      </div>

      <div
        key={card.id}
        className="brutal-card-lime p-6 min-h-[220px] flex flex-col justify-between animate-pop-in"
      >
        <div>
          <div className="text-5xl mb-3">{card.emoji}</div>
          <h3 className="font-display font-bold text-2xl">{card.title}</h3>
          <p className="mt-2 text-sm text-ink/80 font-medium">
            {eli15 ? card.short : card.long}
          </p>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={prev}
            disabled={i === 0}
            className="w-10 h-10 rounded-full border-2 border-ink bg-paper flex items-center justify-center disabled:opacity-30 hover:bg-lime transition-colors"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            {LEARNING_CARDS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-ink" : "w-1.5 bg-ink/30"}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full border-2 border-ink bg-ink text-paper flex items-center justify-center hover:bg-lime hover:text-ink transition-colors"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
