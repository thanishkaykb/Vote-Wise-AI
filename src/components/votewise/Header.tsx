import { Vote, Sparkles } from "lucide-react";

type Props = {
  eli15: boolean;
  setEli15: (v: boolean) => void;
};

export const Header = ({ eli15, setEli15 }: Props) => {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b-2 border-foreground">
      <div className="container flex items-center justify-between py-3">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-lime border-2 border-foreground rounded-xl flex items-center justify-center shadow-brutal-sm group-hover:rotate-[-6deg] transition-transform">
            <Vote className="w-5 h-5 text-ink" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-lg tracking-tight text-foreground">VoteWise<span className="text-lime">.AI</span></div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Civic Decision Engine</div>
          </div>
        </a>

        <button
          onClick={() => setEli15(!eli15)}
          className="chip hover:bg-lime transition-colors"
          aria-pressed={eli15}
          aria-label="Toggle Explain Like I'm 15 mode"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{eli15 ? "ELI15: ON" : "ELI15"}</span>
        </button>
      </div>
    </header>
  );
};
