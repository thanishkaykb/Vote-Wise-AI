import { ExternalLink, FileText, IdCard, Search, MapPin, Smartphone, ShieldCheck } from "lucide-react";

type OfficialLink = {
  id: string;
  title: string;
  desc: string;
  url: string;
  icon: React.ReactNode;
  tag: string;
};

const LINKS: OfficialLink[] = [
  {
    id: "form6",
    title: "Form 6 — New Voter Registration",
    desc: "Register your name on the electoral roll (first-time voters & shifted addresses).",
    url: "https://voters.eci.gov.in/",
    icon: <FileText className="w-5 h-5" />,
    tag: "Register",
  },
  {
    id: "form8",
    title: "Form 8 — Correct / Update Details",
    desc: "Fix name, photo, address, or transfer to a new constituency.",
    url: "https://voters.eci.gov.in/",
    icon: <FileText className="w-5 h-5" />,
    tag: "Update",
  },
  {
    id: "epic",
    title: "Download e-EPIC (digital Voter ID)",
    desc: "Get a downloadable PDF of your Voter ID — accepted at the booth.",
    url: "https://voters.eci.gov.in/download-eepic",
    icon: <IdCard className="w-5 h-5" />,
    tag: "Voter ID",
  },
  {
    id: "search",
    title: "Electoral Roll Search",
    desc: "Verify your name on the roll using EPIC No. or personal details.",
    url: "https://electoralsearch.eci.gov.in/",
    icon: <Search className="w-5 h-5" />,
    tag: "Verify",
  },
  {
    id: "booth",
    title: "Find Your Polling Station",
    desc: "Official ECI tool — locates your booth by EPIC No.",
    url: "https://electoralsearch.eci.gov.in/pollingstation",
    icon: <MapPin className="w-5 h-5" />,
    tag: "Booth",
  },
  {
    id: "voterhelpline",
    title: "Voter Helpline App",
    desc: "Official ECI mobile app — register, track, complain, learn.",
    url: "https://voterportal.eci.gov.in/",
    icon: <Smartphone className="w-5 h-5" />,
    tag: "App",
  },
  {
    id: "cvigil",
    title: "cVIGIL — Report MCC Violations",
    desc: "Report any Model Code of Conduct violation in 100 minutes.",
    url: "https://cvigil.eci.gov.in/",
    icon: <ShieldCheck className="w-5 h-5" />,
    tag: "Report",
  },
];

export const OfficialLinks = () => {
  return (
    <section className="brutal-card bg-card p-6 md:p-8">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="chip bg-sky text-white border-foreground">Awareness · Official</div>
          <h2 className="mt-3 font-display font-bold text-2xl tracking-tight">Forms & Official Links</h2>
          <p className="text-sm text-muted-foreground max-w-xl mt-1">
            Direct links to the Election Commission of India. Click any card to open the official portal in a new tab and complete the action.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {LINKS.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 p-4 border-2 border-foreground rounded-xl bg-background hover:bg-lime/15 hover:-translate-y-0.5 hover:shadow-brutal-sm transition-all"
          >
            <div className="w-10 h-10 shrink-0 rounded-lg bg-lime text-ink border-2 border-foreground flex items-center justify-center">
              {l.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest font-bold text-sky">{l.tag}</span>
              </div>
              <div className="font-bold text-sm leading-tight mt-0.5 truncate">{l.title}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.desc}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 mt-1" />
          </a>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Always verify links lead to <code className="px-1 rounded bg-foreground/10">eci.gov.in</code> before submitting personal info.
      </p>
    </section>
  );
};
