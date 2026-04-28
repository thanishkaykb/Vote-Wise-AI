import { useMemo, useState } from "react";
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
import { useProfile } from "@/hooks/useProfile";
import { deriveState } from "@/lib/civicEngine";
import { toast } from "sonner";
import { CheckCircle2, MapPin, BookOpen, Compass } from "lucide-react";

const Index = () => {
  const { profile, update, reset } = useProfile();
  const [eli15, setEli15] = useState(false);
  const state = useMemo(() => deriveState(profile), [profile]);

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
    <div className="min-h-screen bg-paper text-ink">
      <Header eli15={eli15} setEli15={setEli15} />
      <MarqueeStrip />

      {/* HERO */}
      <section className="container pt-10 pb-6">
        <div className="max-w-3xl">
          <div className="chip bg-lime mb-4">VoteWise.AI · India</div>
          <h1 className="font-display font-bold text-5xl md:text-7xl tracking-tight leading-[0.95]">
            Don't just <span className="bg-lime text-ink px-2 -skew-x-3 inline-block border-2 border-foreground shadow-brutal-sm">learn</span> voting. <br className="hidden sm:block" />
            Be <span className="underline decoration-coral decoration-[6px] underline-offset-4">ready</span> for it.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            A behavior-driven civic engine that guides you from confusion to the booth — readiness score, journey tracker, and a no-jargon assistant.
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionBtn icon={<CheckCircle2 className="w-4 h-4" />} label="Check eligibility" onClick={() => scrollTo("profile")} />
          <ActionBtn icon={<BookOpen className="w-4 h-4" />} label="Register guide" onClick={() => handleAction("register")} />
          <ActionBtn icon={<MapPin className="w-4 h-4" />} label="Find booth" onClick={() => scrollTo("booth")} />
          <ActionBtn icon={<Compass className="w-4 h-4" />} label="What's next?" onClick={() => scrollTo("journey")} />
        </div>
      </section>

      {/* DASHBOARD */}
      <main className="container pb-20 grid gap-6 lg:grid-cols-12">
        <div id="score" className="lg:col-span-12">
          <ScoreCard profile={profile} state={state} />
        </div>

        <div id="profile" className="lg:col-span-5">
          <ProfilePanel profile={profile} update={update} reset={reset} />
        </div>

        <div id="journey" className="lg:col-span-7">
          <JourneyTracker profile={profile} onAction={handleAction} />
        </div>

        <div id="simulator" className="lg:col-span-7">
          <DecisionSimulator />
        </div>

        <div id="timeline" className="lg:col-span-5">
          <Timeline city={profile.city} />
        </div>

        <div id="learn" className="lg:col-span-5">
          <LearningCards
            eli15={eli15}
            onComplete={() => {
              update({ awarenessScore: Math.max(profile.awarenessScore ?? 0, 80) });
              toast.success("Learning complete · awareness +80");
            }}
          />
        </div>

        <div id="booth" className="lg:col-span-7">
          <BoothFinder
            selectedBoothId={profile.boothId}
            onSelect={(boothId, boothName) => {
              update({ boothId, boothName, knowsBooth: true });
              toast.success(`Booth selected: ${boothName} 📍`);
            }}
          />
        </div>

        <div id="assistant" className="lg:col-span-12">
          <Assistant profile={profile} eli15={eli15} />
        </div>
      </main>

      <footer className="border-t-2 border-foreground bg-card text-foreground">
        <div className="container py-8 flex items-center justify-between flex-wrap gap-3">
          <div className="font-display font-bold text-lg">VoteWise<span className="text-lime">.AI</span></div>
          <div className="text-xs text-muted-foreground">Mock data for demonstration · Always verify with eci.gov.in</div>
        </div>
      </footer>
    </div>
  );
};

const ActionBtn = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex items-center justify-between gap-2 p-3 rounded-xl border-2 border-ink bg-card hover:bg-lime hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-left"
  >
    <span className="font-bold text-sm">{label}</span>
    <span className="w-7 h-7 rounded-lg bg-ink text-paper group-hover:bg-paper group-hover:text-ink flex items-center justify-center transition-colors">
      {icon}
    </span>
  </button>
);

export default Index;
