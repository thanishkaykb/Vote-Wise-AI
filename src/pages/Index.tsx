import { useMemo, useState, useEffect } from "react";
import { Header } from "@/components/votewise/Header";
import { ScoreCard } from "@/components/votewise/ScoreCard";
import { ProfilePanel } from "@/components/votewise/ProfilePanel";
import { JourneyTracker } from "@/components/votewise/JourneyTracker";
import { Timeline } from "@/components/votewise/Timeline";
import { DecisionSimulator } from "@/components/votewise/DecisionSimulator";
import { LearningCards } from "@/components/votewise/LearningCards";
import { Assistant } from "@/components/votewise/Assistant";
import { BoothFinder } from "@/components/votewise/BoothFinder";
import { MarqueeStrip } from "@/components/votewise/MarqueeStrip";
import { OfficialLinks } from "@/components/votewise/OfficialLinks";
import { useProfile } from "@/hooks/useProfile";
import { deriveState } from "@/lib/civicEngine";
import { toast } from "sonner";
import { CheckCircle2, MapPin, BookOpen, Compass, ExternalLink } from "lucide-react";

const Index = () => {
  const { profile, update, reset } = useProfile();
  const [eli15, setEli15] = useState(false);
  const state = useMemo(() => deriveState(profile), [profile]);

  // Booth selection is now a prediction — auto-mark "knows booth" once city is set
  useEffect(() => {
    if (profile.city && profile.city.trim().length > 1 && !profile.knowsBooth) {
      update({ knowsBooth: true });
    }
  }, [profile.city, profile.knowsBooth, update]);

  // Force top of page on initial load — never auto-scroll to bottom
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAction = (id: string) => {
    switch (id) {
      case "eligibility":
        scrollTo("profile");
        toast("Set your age & citizenship in the profile panel.");
        break;
      case "register":
        update({ isRegistered: true });
        toast.success("Registered ✓ — File Form 6 at voters.eci.gov.in");
        break;
      case "epic":
        update({ hasEPIC: true });
        toast.success("EPIC marked as obtained ✓");
        break;
      case "awareness":
        scrollTo("learn");
        break;
      case "booth":
        scrollTo("booth");
        break;
      case "plan":
        update({ preparedness: true });
        toast.success("Polling day plan locked in 🗓️");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header eli15={eli15} setEli15={setEli15} />
      <MarqueeStrip />

      {/* HERO */}
      <section className="container pt-12 pb-10">
        <div className="max-w-3xl">
          <div className="chip bg-lime text-ink mb-4 border-foreground">VoteWise.AI · India</div>
          <h1 className="font-display font-bold text-5xl md:text-7xl tracking-tight leading-[0.95]">
            Don't just{" "}
            <span className="bg-lime text-ink px-2 -skew-x-3 inline-block border-2 border-foreground shadow-brutal-sm">
              learn
            </span>{" "}
            voting. <br className="hidden sm:block" />
            Be{" "}
            <span className="underline decoration-coral decoration-[6px] underline-offset-4">ready</span>{" "}
            for it.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            A behavior-driven civic engine that guides you from confusion to the booth — readiness score, journey tracker, official forms, and a no-jargon assistant.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionBtn icon={<CheckCircle2 className="w-4 h-4" />} label="Check eligibility" onClick={() => scrollTo("profile")} />
          <ActionBtn icon={<BookOpen className="w-4 h-4" />} label="Register guide" onClick={() => handleAction("register")} />
          <ActionBtn icon={<MapPin className="w-4 h-4" />} label="Find booth" onClick={() => scrollTo("booth")} />
          <ActionBtn icon={<ExternalLink className="w-4 h-4" />} label="Official forms" onClick={() => scrollTo("forms")} />
        </div>
      </section>

      {/* DASHBOARD — vertical, line-by-line, generous spacing */}
      <main className="container pb-24 space-y-12">
        <Section id="score" eyebrow="01 · Score" title="Your civic readiness">
          <ScoreCard profile={profile} state={state} />
        </Section>

        <Section id="profile" eyebrow="02 · Profile" title="Tell us about you">
          <ProfilePanel profile={profile} update={update} reset={reset} />
        </Section>

        <Section id="journey" eyebrow="03 · Journey" title="Your next best actions">
          <JourneyTracker profile={profile} onAction={handleAction} />
        </Section>

        <Section id="forms" eyebrow="04 · Awareness" title="Official forms & links">
          <OfficialLinks />
        </Section>

        <Section id="learn" eyebrow="05 · Learn" title="2-minute civic crash course">
          <LearningCards
            eli15={eli15}
            onComplete={() => {
              update({ awarenessScore: Math.max(profile.awarenessScore ?? 0, 80) });
              toast.success("Learning complete · awareness +80");
            }}
          />
        </Section>

        <Section id="simulator" eyebrow="06 · Simulate" title="Does my vote matter?">
          <DecisionSimulator />
        </Section>

        <Section id="timeline" eyebrow="07 · Timeline" title="Key dates ahead">
          <Timeline city={profile.city} />
        </Section>

        <Section id="booth" eyebrow="08 · Booth" title="Your predicted polling booth">
          <BoothFinder city={profile.city} />
        </Section>

        <Section id="assistant" eyebrow="09 · Assistant" title="Ask anything — civic or otherwise">
          <Assistant profile={profile} eli15={eli15} />
        </Section>
      </main>

      <footer className="border-t-2 border-foreground bg-card text-foreground">
        <div className="container py-8 flex items-center justify-between flex-wrap gap-3">
          <div className="font-display font-bold text-lg">
            VoteWise<span className="text-lime">.AI</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Mock data for demonstration · Always verify with eci.gov.in
          </div>
        </div>
      </footer>
    </div>
  );
};

const Section = ({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-24">
    <div className="mb-4">
      <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-lime">{eyebrow}</div>
      <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mt-1">{title}</h2>
    </div>
    {children}
  </section>
);

const ActionBtn = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex items-center justify-between gap-2 p-3 rounded-xl border-2 border-foreground bg-card hover:bg-lime hover:text-ink hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-left"
  >
    <span className="font-bold text-sm">{label}</span>
    <span className="w-7 h-7 rounded-lg bg-foreground text-background group-hover:bg-background group-hover:text-foreground flex items-center justify-center transition-colors">
      {icon}
    </span>
  </button>
);

export default Index;
