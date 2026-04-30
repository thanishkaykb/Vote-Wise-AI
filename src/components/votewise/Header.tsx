import { Vote, Sparkles, LogOut, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Props = {
  eli15: boolean;
  setEli15: (v: boolean) => void;
};

export const Header = ({ eli15, setEli15 }: Props) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b-2 border-foreground">
      <div className="container flex items-center justify-between py-3 gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-lime border-2 border-foreground rounded-xl flex items-center justify-center shadow-brutal-sm group-hover:rotate-[-6deg] transition-transform">
            <Vote className="w-5 h-5 text-ink" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-lg tracking-tight text-foreground">
              VoteWise<span className="text-lime">.AI</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Civic Decision Engine
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEli15(!eli15)}
            className="chip hover:bg-lime hover:text-ink transition-colors"
            aria-pressed={eli15}
            aria-label="Toggle Explain Like I'm 15 mode"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{eli15 ? "ELI15: ON" : "ELI15"}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs text-muted-foreground max-w-[160px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="chip hover:bg-coral hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <Link to="/auth" className="chip bg-lime text-ink hover:bg-foreground hover:text-background transition-colors">
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
