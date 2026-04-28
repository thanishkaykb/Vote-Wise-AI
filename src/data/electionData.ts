// VoteWise AI — Mock election data (India / ECI)
export type ElectionEvent = {
  id: string;
  title: string;
  date: string; // ISO
  description: string;
  type: "deadline" | "voting" | "info";
};

export const ELECTION_TIMELINE: ElectionEvent[] = [
  { id: "e1", title: "Voter Roll Revision Opens", date: "2026-05-10", description: "Form 6 submissions begin. Add your name to the electoral roll.", type: "info" },
  { id: "e2", title: "EPIC (Voter ID) Application Deadline", date: "2026-06-02", description: "Last day to apply for your Voter ID card via NVSP / Voter Helpline.", type: "deadline" },
  { id: "e3", title: "Final Electoral Roll Published", date: "2026-06-20", description: "Verify your name and booth on electoralsearch.eci.gov.in", type: "info" },
  { id: "e4", title: "Silent Period Begins", date: "2026-07-05", description: "Campaigning ends 48 hours before poll.", type: "info" },
  { id: "e5", title: "Polling Day", date: "2026-07-07", description: "Booths open 7 AM – 6 PM. Carry EPIC or accepted ID.", type: "voting" },
  { id: "e6", title: "Counting & Results", date: "2026-07-10", description: "Live results from ECI.", type: "info" },
];

export const MOCK_BOOTHS = [
  { id: "b1", name: "Govt. Higher Secondary School, Ward 14", address: "MG Road, near Civic Center", distanceKm: 0.6 },
  { id: "b2", name: "Municipal Library Hall", address: "Station Road", distanceKm: 1.2 },
  { id: "b3", name: "Community Center, Sector 7", address: "Sector 7 Main", distanceKm: 2.1 },
];

export const LEARNING_CARDS = [
  {
    id: "l1",
    emoji: "🗳️",
    title: "What is NOTA?",
    short: "None Of The Above. A button on the EVM to reject every candidate.",
    long: "NOTA lets you vote without endorsing any candidate. Your vote is counted but doesn't change who wins — it's a recorded protest.",
  },
  {
    id: "l2",
    emoji: "🤖",
    title: "How does an EVM work?",
    short: "Two units: a Ballot Unit you press, a Control Unit that records.",
    long: "EVMs are standalone — not connected to internet. VVPAT prints a paper slip you can see for 7 seconds, then it drops into a sealed box for audit.",
  },
  {
    id: "l3",
    emoji: "📊",
    title: "Why does one vote matter?",
    short: "Margins of <1% decide thousands of seats. Yours stacks.",
    long: "In 2018 Karnataka, multiple seats were decided by under 500 votes. Low turnout means small groups decide for everyone.",
  },
  {
    id: "l4",
    emoji: "🆔",
    title: "EPIC vs Voter Roll",
    short: "EPIC is your card. The Roll is the official list.",
    long: "You can vote with EPIC or 11 other accepted IDs (Aadhaar, Passport, etc.) — but only if your name is on the Electoral Roll.",
  },
  {
    id: "l5",
    emoji: "📝",
    title: "Form 6 in 30 seconds",
    short: "The form to register as a new voter.",
    long: "File Form 6 online at voters.eci.gov.in — needs age proof, address proof, and a photo. Approved in 2–4 weeks.",
  },
  {
    id: "l6",
    emoji: "🔕",
    title: "What's the Silent Period?",
    short: "48 hours before poll — no campaigning allowed.",
    long: "No rallies, ads, or door-to-door canvassing in the 48 hours before voting. Helps you decide without last-minute pressure.",
  },
];

export const QUICK_PROMPTS = [
  "Am I eligible?",
  "What do I do next?",
  "Explain the voting process",
  "What is NOTA?",
  "How do I find my booth?",
];
