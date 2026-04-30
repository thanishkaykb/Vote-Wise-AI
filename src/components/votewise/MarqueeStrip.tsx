import { Megaphone } from "lucide-react";

const STRIP = [
  "Don't just learn voting · Be ready for it",
  "Margins under 1% decide thousands of seats",
  "EPIC + Roll = Vote",
  "NOTA is a recorded protest, not silence",
  "Plans beat polling-day excuses",
];

export const MarqueeStrip = () => (
  <div className="border-y-2 border-foreground bg-lime text-ink overflow-hidden">
    <div className="flex marquee-track gap-12 py-2.5 whitespace-nowrap font-display font-extrabold tracking-tight">
      {[...STRIP, ...STRIP].map((s, i) => (
        <span key={i} className="flex items-center gap-3 text-sm">
          <Megaphone className="w-4 h-4 text-ink" />
          <span className="text-ink">{s}</span>
          <span className="text-ink">●</span>
        </span>
      ))}
    </div>
  </div>
);
