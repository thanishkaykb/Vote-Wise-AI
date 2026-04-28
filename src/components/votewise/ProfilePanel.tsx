import { UserProfile } from "@/lib/civicEngine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RotateCcw } from "lucide-react";

type Props = {
  profile: UserProfile;
  update: (p: Partial<UserProfile>) => void;
  reset: () => void;
};

export const ProfilePanel = ({ profile, update, reset }: Props) => {
  return (
    <section className="brutal-card p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-xl">Your profile</h2>
          <p className="text-sm text-muted-foreground">Drives every recommendation. Stays on your device.</p>
        </div>
        <button onClick={reset} className="chip hover:bg-coral hover:text-white transition-colors" title="Reset profile">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide">Name</Label>
          <Input
            id="name"
            value={profile.name ?? ""}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Aarav"
            className="mt-1 border-2 border-ink rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wide">Age</Label>
          <Input
            id="age"
            type="number"
            min={0}
            max={120}
            value={profile.age ?? ""}
            onChange={(e) => update({ age: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="18+"
            className="mt-1 border-2 border-ink rounded-xl"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wide">City / Constituency</Label>
          <Input
            id="city"
            value={profile.city ?? ""}
            onChange={(e) => update({ city: e.target.value })}
            placeholder="e.g. Bengaluru South"
            className="mt-1 border-2 border-ink rounded-xl"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <Toggle label="I am an Indian citizen" checked={!!profile.isCitizen} onChange={(v) => update({ isCitizen: v })} />
        <Toggle label="My name is on the electoral roll" checked={!!profile.isRegistered} onChange={(v) => update({ isRegistered: v })} />
        <Toggle label="I have my EPIC / Voter ID" checked={!!profile.hasEPIC} onChange={(v) => update({ hasEPIC: v })} />
        <Toggle label="I know my polling booth" checked={!!profile.knowsBooth} onChange={(v) => update({ knowsBooth: v })} />
        <Toggle label="I have a plan for polling day" checked={!!profile.preparedness} onChange={(v) => update({ preparedness: v })} />
      </div>
    </section>
  );
};

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between gap-3 p-3 border-2 border-foreground rounded-xl bg-background hover:bg-lime/10 cursor-pointer transition-colors">
    <span className="text-sm font-medium">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);
