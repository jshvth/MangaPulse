import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SignUpPage() {
  const { signUp, error, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "sent">("form");
  const [sentTo, setSentTo] = useState("");
  const [remember, setRemember] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("mp_remember") !== "0";
  });

  const handleSignUp = async () => {
    setNotice("Account created. If email confirmation is enabled, check your inbox.");
    const ok = await signUp(email, password, remember, { firstName, lastName });
    if (ok) {
      setSentTo(email);
      setStep("sent");
    }
  };

  useEffect(() => {
    if (isAuthed) {
      navigate("/collection");
    }
  }, [isAuthed, navigate]);

  return (
    <div className="flex justify-center">
      <section className="glass-card hover-lift reveal w-full max-w-xl rounded-[32px] p-8 md:p-10">
        <div className="space-y-8">
          <div>
            <p className="label">Account</p>
            <h2 className="font-display text-3xl">
              {step === "sent" ? "Check your inbox" : "Create account"}
            </h2>
            <p className="text-sm text-ink/60">
              {step === "sent"
                ? "We sent a confirmation link to activate your account."
                : "Use a valid email so we can confirm your account."}
            </p>
          </div>
          {step === "form" ? (
            <>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span className="text-ink/60">First name</span>
                    <input
                      className="input-field"
                      placeholder="First name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-ink/60">Last name</span>
                    <input
                      className="input-field"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </label>
                </div>
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
                <button
                  className="btn-primary"
                  onClick={handleSignUp}
                  disabled={!firstName.trim() || !lastName.trim()}
                >
                  Create account
                </button>
                <Link to="/" className="btn-ghost text-center">
                  Already have an account? Sign in
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="neo-panel rounded-2xl px-4 py-3 text-sm text-ink/70">
                We sent a confirmation link to{" "}
                <span className="font-semibold text-ink">{sentTo}</span>.
              </div>
              <p className="text-sm text-ink/70">
                Open the email to activate your account, then come back to sign in.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/" className="btn-primary text-center">
                  Back to sign in
                </Link>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setStep("form");
                    setNotice(null);
                  }}
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
