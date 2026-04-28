import { Megaphone } from "lucide-react";

const STRIP = [
  "Don't just learn voting · Be ready for it",
  "Margins under 1% decided thousands of seats",
  "EPIC + Roll = Vote",
  "NOTA is not silence — it's a recorded protest",
  "Polling day plans beat polling day excuses",
];

export const MarqueeStrip = () => (
  <div className="border-y-2 border-ink bg-ink text-paper overflow-hidden">
    <div className="flex marquee-track gap-12 py-2.5 whitespace-nowrap font-display font-semibold tracking-tight">
      {[...STRIP, ...STRIP].map((s, i) => (
        <span key={i} className="flex items-center gap-3 text-sm">
          <Megaphone className="w-4 h-4 text-lime" />
          {s}
          <span className="text-lime">●</span>
        </span>
      ))}
    </div>
  </div>
);
