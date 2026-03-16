import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const { signIn, signUp, error, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const handleSignIn = async () => {
    setNotice(null);
    await signIn(email, password);
  };

  const handleSignUp = async () => {
    setNotice(
      "Account created. If email confirmation is enabled, check your inbox."
    );
    await signUp(email, password);
  };

  useEffect(() => {
    if (isAuthed) {
      navigate("/collection");
    }
  }, [isAuthed, navigate]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="reveal rounded-[32px] bg-ink p-10 text-white shadow-[0_30px_70px_-40px_rgba(16,24,38,0.6)]">
        <div className="flex h-full flex-col justify-between gap-10">
          <div className="space-y-6">
            <p className="label text-white/60">MANGAPULSE</p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              A calm, precise space for your manga collection.
            </h1>
            <p className="text-white/70">
              Track volumes, see what is missing, and get alerted when a new
              release drops. Designed like a boutique library.
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl bg-white/10 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">Live pulse</p>
              <span className="chip border-white/40 bg-white/10 text-white/80">Next check in 5 days</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <p className="text-xs text-white/70">Release checks + alerts ready</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card reveal reveal-delay-1 rounded-[32px] p-8 md:p-10">
        <div className="space-y-8">
          <div>
            <p className="label">Account</p>
            <h2 className="font-display text-3xl">Sign in</h2>
            <p className="text-sm text-ink/60">
              Use your MangaPulse account to sync your collection.
            </p>
          </div>
          <div className="space-y-4">
            <label className="grid gap-2 text-sm">
              <span className="text-ink/60">Email</span>
              <input
                className="input-field"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-ink/60">Password</span>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </div>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink/70">
              {notice}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button className="btn-primary" onClick={handleSignIn}>
              Sign in
            </button>
            <button className="btn-ghost" onClick={handleSignUp}>
              Create account
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 p-4 text-sm text-ink/60">
            New here? Create an account to unlock your collection.
          </div>
        </div>
      </section>
    </div>
  );
}
