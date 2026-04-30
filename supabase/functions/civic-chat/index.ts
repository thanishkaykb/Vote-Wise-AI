// VoteWise AI — Civic Assistant edge function (streaming)
// Uses Lovable AI Gateway. No API key required from user.
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are VoteWise, a friendly, knowledgeable assistant.
Primary mission: help users go from confused → ready to vote in Indian elections (ECI rules).
You CAN and SHOULD answer ANY question the user asks — civic topics, general knowledge, study help, casual chat — never refuse.
For non-civic questions, give a helpful direct answer in 2–4 sentences, then (only if natural) add one short line nudging them back to their voting readiness.
Tone: warm, clear, concise. Use short paragraphs and bullets. Use markdown.
Civic scope you know deeply: voter eligibility, Form 6 / 8, EPIC / e-EPIC, NVSP / Voter Helpline, electoral roll, EVM/VVPAT, NOTA, polling day, accepted IDs, Model Code of Conduct, cVIGIL.
On candidates/parties: stay strictly neutral — explain how to evaluate, never endorse.
When ELI15 mode is ON, drop jargon and explain like the user is 15.`;

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
