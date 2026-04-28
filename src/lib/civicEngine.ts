// VoteWise AI — Civic Decision Engine (state machine + scoring)
export type CivicState =
  | "unknown"
  | "not_eligible"
  | "eligible_unregistered"
  | "registered_uninformed"
  | "ready";

export type UserProfile = {
  name?: string;
  age?: number;
  city?: string;
  isCitizen?: boolean;
  isRegistered?: boolean;
  hasEPIC?: boolean;
  knowsBooth?: boolean;
  awarenessScore?: number; // 0..100 from quiz/learning
  preparedness?: boolean; // has a plan (date, transport, ID)
  decisionMade?: boolean;
};

export const EMPTY_PROFILE: UserProfile = {
  awarenessScore: 0,
};

export function deriveState(p: UserProfile): CivicState {
  if (p.age == null || p.isCitizen == null) return "unknown";
  if (p.isCitizen === false || (p.age ?? 0) < 18) return "not_eligible";
  if (!p.isRegistered) return "eligible_unregistered";
  if (!(p.knowsBooth && (p.awarenessScore ?? 0) >= 50)) return "registered_uninformed";
  return "ready";
}

export function readinessScore(p: UserProfile): number {
  let score = 0;
  // Eligibility (25)
  if (p.isCitizen && (p.age ?? 0) >= 18) score += 25;
  // Registration (25)
  if (p.isRegistered) score += 15;
  if (p.hasEPIC) score += 10;
  // Awareness (30) — from learning + quiz
  score += Math.round(((p.awarenessScore ?? 0) / 100) * 30);
  // Preparedness (20)
  if (p.knowsBooth) score += 10;
  if (p.preparedness) score += 10;
  return Math.min(100, score);
}

export type Step = {
  id: string;
  label: string;
  done: boolean;
  cta: string;
  hint: string;
};

export function nextSteps(p: UserProfile): Step[] {
  const eligible = !!p.isCitizen && (p.age ?? 0) >= 18;
  return [
    {
      id: "eligibility",
      label: "Confirm eligibility",
      done: eligible,
      cta: "Check now",
      hint: "Indian citizen, 18+ on qualifying date.",
    },
    {
      id: "register",
      label: "Get on the electoral roll",
      done: !!p.isRegistered,
      cta: "Open Form 6 guide",
      hint: "File Form 6 at voters.eci.gov.in",
    },
    {
      id: "epic",
      label: "Get your EPIC (Voter ID)",
      done: !!p.hasEPIC,
      cta: "Apply / download e-EPIC",
      hint: "Or carry one of 11 accepted IDs.",
    },
    {
      id: "awareness",
      label: "Learn the basics (NOTA, EVM, VVPAT)",
      done: (p.awarenessScore ?? 0) >= 60,
      cta: "Open learning cards",
      hint: "6 swipeable cards · 2 minutes.",
    },
    {
      id: "booth",
      label: "Find your polling booth",
      done: !!p.knowsBooth,
      cta: "Find booth",
      hint: "Use Electoral Search by EPIC No.",
    },
    {
      id: "plan",
      label: "Make your voting day plan",
      done: !!p.preparedness,
      cta: "Set my plan",
      hint: "Date, ID ready, transport sorted.",
    },
  ];
}

// Lightweight assistant — pattern-matched; only "complex" branch would call AI.
export function assistantReply(
  q: string,
  p: UserProfile,
  eli15: boolean
): { text: string; followups?: string[] } {
  const s = q.toLowerCase();
  const eligible = !!p.isCitizen && (p.age ?? 0) >= 18;

  if (/eligib|can i vote|qualify/.test(s)) {
    if (p.age == null) return { text: eli15 ? "Tell me your age first — I can't check without it." : "Please share your age and citizenship to verify eligibility." };
    if (!eligible) return { text: eli15 ? "You're not eligible yet — you need to be 18 and an Indian citizen." : "Eligibility requires Indian citizenship and age ≥ 18 on the qualifying date." };
    return { text: eli15 ? "Yes — you can vote! ✅ Now make sure your name is on the list." : "You meet eligibility. Verify your name on the electoral roll next.", followups: ["What do I do next?", "How do I register?"] };
  }
  if (/next|what.*do/.test(s)) {
    const steps = nextSteps(p).filter((x) => !x.done);
    if (steps.length === 0) return { text: "You're fully ready. 🎉 Show up on polling day with your ID." };
    return { text: `Your next step: ${steps[0].label}. ${steps[0].hint}` };
  }
  if (/nota/.test(s)) {
    return { text: eli15 ? "NOTA = 'None Of The Above'. It's the last button on the EVM. Use it if you don't like any candidate — your vote is counted but no one gets it." : "NOTA is a constitutional option allowing voters to reject all candidates. Recorded but doesn't alter outcome." };
  }
  if (/booth|where.*vote/.test(s)) {
    return { text: eli15 ? "Search your name on electoralsearch.eci.gov.in — it'll show your booth." : "Visit the ECI Electoral Search and query by EPIC No. or details to retrieve your assigned polling station." };
  }
  if (/process|how.*vote|evm/.test(s)) {
    return {
      text: eli15
        ? "1) Go to your booth. 2) Show ID. 3) Get finger inked. 4) Press the button on the EVM. 5) Watch the VVPAT slip — done!"
        : "Identify at the polling station, receive indelible ink marking, cast your vote on the EVM, and verify the VVPAT slip before exit.",
    };
  }
  if (/regist|form 6|epic/.test(s)) {
    return { text: eli15 ? "Go to voters.eci.gov.in → fill Form 6 → upload age + address proof + photo. Takes ~10 minutes." : "Submit Form 6 via the National Voter Service Portal with valid age and address documentation." };
  }
  // fallback (the only branch that would call AI in production)
  return { text: eli15 ? "Hmm, I'm not sure. Try a quick question below 👇" : "I don't have a structured answer for that. Try one of the suggested prompts.", followups: ["Am I eligible?", "What do I do next?", "What is NOTA?"] };
}

// Decision simulator: turnout shifts seat outcome
export function simulateOutcome(turnoutPct: number, leanA: number) {
  // leanA: 0..100 — share of *your* group voting party A
  // baseline assumption: opposing engaged voters split 55/45 for B
  const yourBlock = turnoutPct; // % of your group that shows up
  const otherBlock = 100 - turnoutPct;
  const aShare = (yourBlock * (leanA / 100) + otherBlock * 0.45);
  const bShare = (yourBlock * ((100 - leanA) / 100) + otherBlock * 0.55);
  const total = aShare + bShare;
  const a = Math.round((aShare / total) * 100);
  const b = 100 - a;
  return { a, b, winner: a > b ? "A" : a < b ? "B" : "Tie" as const };
}
