import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SignUpPage() {
  const { signUp, error, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [remember, setRemember] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("mp_remember") !== "0";
  });

  const handleSignUp = async () => {
    setNotice("Account created. If email confirmation is enabled, check your inbox.");
    await signUp(email, password, remember);
  };

  useEffect(() => {
    if (isAuthed) {
      navigate("/collection");
    }
  }, [isAuthed, navigate]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="reveal hover-lift rounded-[32px] bg-mist p-10 text-white shadow-[0_30px_70px_-40px_rgba(0,0,0,0.7)]">
        <div className="flex h-full flex-col justify-between gap-10">
          <div className="space-y-6">
            <p className="label text-white/70">MANGAPULSE</p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Build your manga universe in one place.
            </h1>
            <p className="text-white/80">
              Create your account to track volumes, follow new releases, and
              keep your shelf perfectly organized.
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/15 bg-white/10 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/80">Live pulse</p>
              <span className="chip border-white/40 bg-white/10 text-white/90">
                Next check in 3 days
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <p className="text-xs text-white/80">Release checks + alerts ready</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card hover-lift reveal reveal-delay-1 rounded-[32px] p-8 md:p-10">
        <div className="space-y-8">
          <div>
            <p className="label">Account</p>
            <h2 className="font-display text-3xl">Create account</h2>
            <p className="text-sm text-ink/60">
              Use a valid email so we can confirm your account.
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
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember me on this device
            </label>
          </div>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="neo-panel rounded-2xl px-4 py-3 text-sm text-ink/70">
              {notice}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button className="btn-primary" onClick={handleSignUp}>
              Create account
            </button>
            <Link to="/" className="btn-ghost text-center">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
