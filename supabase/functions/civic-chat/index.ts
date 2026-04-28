// VoteWise AI — Civic Assistant edge function (streaming)
// Uses Lovable AI Gateway. No API key required from user.
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are VoteWise, a friendly Indian civic assistant.
Your job: help users go from confused → ready to vote in Indian elections (ECI rules).
Tone: warm, clear, concise. Use short paragraphs and bullet lists. Use markdown.
Scope: voter eligibility, Form 6, EPIC/Voter ID, NVSP/Voter Helpline, electoral roll, EVM/VVPAT, NOTA, polling day, accepted IDs, model code of conduct.
If asked about a specific candidate or party preference, stay neutral — explain how to evaluate, never endorse.
If asked something outside civic/voting, politely redirect.
When the user enables ELI15 mode, drop jargon and explain like they're 15.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, eli15, profile } = await req.json();

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileSummary = profile
      ? `User profile: age=${profile.age ?? "?"}, citizen=${profile.isCitizen ?? "?"}, registered=${profile.isRegistered ?? "?"}, hasEPIC=${profile.hasEPIC ?? "?"}, knowsBooth=${profile.knowsBooth ?? "?"}, city=${profile.city ?? "?"}.`
      : "";

    const sys = `${SYSTEM_PROMPT}\n${profileSummary}\nELI15 mode: ${eli15 ? "ON — simplify everything, no jargon." : "OFF — standard tone."}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: sys }, ...messages],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok || !res.body) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: txt }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
