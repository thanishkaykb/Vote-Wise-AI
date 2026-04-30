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

export type Booth = { id: string; name: string; address: string; distanceKm: number };

// City → realistic mock booths near that locality. Falls back to generic if city unknown.
export const BOOTHS_BY_CITY: Record<string, Booth[]> = {
  bengaluru: [
    { id: "blr-1", name: "Govt. Model Primary School, Jayanagar 4th Block", address: "11th Main Rd, Jayanagar, Bengaluru", distanceKm: 0.4 },
    { id: "blr-2", name: "BBMP Community Hall, Koramangala", address: "80 Ft Rd, 6th Block Koramangala", distanceKm: 1.1 },
    { id: "blr-3", name: "Govt. High School, HSR Layout", address: "Sector 2, HSR Layout, Bengaluru", distanceKm: 1.8 },
  ],
  mumbai: [
    { id: "mum-1", name: "Municipal School No. 3, Dadar (W)", address: "Ranade Rd, Dadar West, Mumbai", distanceKm: 0.5 },
    { id: "mum-2", name: "BMC Hall, Bandra (W)", address: "Hill Rd, Bandra West, Mumbai", distanceKm: 1.6 },
    { id: "mum-3", name: "Govt. Higher Sec. School, Andheri (E)", address: "Marol, Andheri East, Mumbai", distanceKm: 2.4 },
  ],
  delhi: [
    { id: "del-1", name: "Sarvodaya Kanya Vidyalaya, Lajpat Nagar", address: "Ring Rd, Lajpat Nagar IV, New Delhi", distanceKm: 0.7 },
    { id: "del-2", name: "MCD Primary School, Karol Bagh", address: "Pusa Rd, Karol Bagh, Delhi", distanceKm: 1.3 },
    { id: "del-3", name: "Govt. Boys Sr. Sec. School, Saket", address: "J Block, Saket, New Delhi", distanceKm: 2.0 },
  ],
  hyderabad: [
    { id: "hyd-1", name: "Govt. High School, Banjara Hills", address: "Rd No. 12, Banjara Hills, Hyderabad", distanceKm: 0.6 },
    { id: "hyd-2", name: "GHMC Community Hall, Madhapur", address: "Hitech City Rd, Madhapur", distanceKm: 1.4 },
    { id: "hyd-3", name: "ZP High School, Kukatpally", address: "KPHB Phase 1, Kukatpally", distanceKm: 2.2 },
  ],
  chennai: [
    { id: "che-1", name: "Corporation Higher Sec. School, T. Nagar", address: "South Usman Rd, T. Nagar, Chennai", distanceKm: 0.5 },
    { id: "che-2", name: "Govt. Girls School, Anna Nagar", address: "2nd Avenue, Anna Nagar West", distanceKm: 1.5 },
    { id: "che-3", name: "Panchayat Union School, Velachery", address: "Velachery Main Rd, Chennai", distanceKm: 2.3 },
  ],
  kolkata: [
    { id: "kol-1", name: "Ballygunge Govt. High School", address: "Ballygunge Circular Rd, Kolkata", distanceKm: 0.6 },
    { id: "kol-2", name: "KMC Primary School, Salt Lake", address: "Sector V, Bidhannagar", distanceKm: 1.7 },
    { id: "kol-3", name: "Howrah Zilla School", address: "GT Rd, Howrah", distanceKm: 2.5 },
  ],
  pune: [
    { id: "pun-1", name: "PMC School, Kothrud", address: "Karve Rd, Kothrud, Pune", distanceKm: 0.5 },
    { id: "pun-2", name: "Govt. Higher Sec. School, Aundh", address: "ITI Rd, Aundh, Pune", distanceKm: 1.4 },
    { id: "pun-3", name: "ZP School, Hinjewadi", address: "Phase 1, Hinjewadi, Pune", distanceKm: 2.6 },
  ],
};

const GENERIC_BOOTHS: Booth[] = [
  { id: "g1", name: "Govt. Higher Secondary School, Ward 14", address: "MG Road, near Civic Center", distanceKm: 0.6 },
  { id: "g2", name: "Municipal Library Hall", address: "Station Road", distanceKm: 1.2 },
  { id: "g3", name: "Community Center, Sector 7", address: "Sector 7 Main", distanceKm: 2.1 },
];

export function boothsForCity(city?: string): { booths: Booth[]; matched: string | null } {
  if (!city) return { booths: GENERIC_BOOTHS, matched: null };
  const key = city.toLowerCase();
  for (const c of Object.keys(BOOTHS_BY_CITY)) {
    if (key.includes(c)) return { booths: BOOTHS_BY_CITY[c], matched: c };
  }
  return { booths: GENERIC_BOOTHS, matched: null };
}

// Backwards compat
export const MOCK_BOOTHS = GENERIC_BOOTHS;

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
