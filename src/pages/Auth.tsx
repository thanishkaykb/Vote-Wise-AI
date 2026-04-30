import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Vote, Loader2, Mail, Lock, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72, "Max 72 characters"),
});

const Auth = () => {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav("/", { replace: true });
  }, [loading, user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        // With email confirmation enabled, session is null until the user clicks the link.
        if (!data.session) {
          toast.success("Check your inbox — we sent a verification link to confirm your email.");
          setMode("signin");
          setPassword("");
          return;
        }
        toast.success("Account created — you're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          // Surface the "Email not confirmed" case clearly
          if (/confirm/i.test(error.message)) {
            toast.error("Please verify your email first — check your inbox for the link.");
            return;
          }
          throw error;
        }
        toast.success("Welcome back 👋");
      }
      nav("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b-2 border-foreground">
        <div className="container py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-lime border-2 border-foreground rounded-xl flex items-center justify-center">
              <Vote className="w-5 h-5 text-ink" strokeWidth={2.5} />
            </div>
            <div className="font-display font-bold text-lg">VoteWise<span className="text-lime">.AI</span></div>
          </Link>
          <Link to="/" className="chip hover:bg-lime hover:text-ink transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="brutal-card bg-card p-6 sm:p-8 w-full max-w-md">
          <h1 className="font-display font-bold text-3xl tracking-tight">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Welcome back to VoteWise." : "Start your civic readiness journey."}
          </p>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mt-6 w-full flex items-center justify-center gap-2 p-3 border-2 border-foreground rounded-xl bg-card hover:bg-lime hover:text-ink transition-colors font-bold disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-foreground/20" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-foreground/20" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide">Email</Label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 border-2 border-ink rounded-xl"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide">Password</Label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 border-2 border-ink rounded-xl"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
              {mode === "signup" && (
                <p className="mt-1 text-[11px] text-muted-foreground">Min 8 chars. Checked against breach databases.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full p-3 border-2 border-foreground rounded-xl bg-lime text-ink font-bold hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
            {mode === "signup" && (
              <p className="text-[11px] text-center text-muted-foreground">
                We'll email you a verification link. You can sign in once your email is confirmed.
              </p>
            )}
          </form>

          <p className="mt-5 text-sm text-center text-muted-foreground">
            {mode === "signin" ? "New to VoteWise?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-bold text-lime hover:underline"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
