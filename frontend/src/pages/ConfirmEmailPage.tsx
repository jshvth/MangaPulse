import { Link, useLocation } from "react-router-dom";

export function ConfirmEmailPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get("email");

  return (
    <div className="flex justify-center">
      <section className="glass-card hover-lift reveal w-full max-w-xl rounded-[32px] p-8 md:p-10">
        <div className="space-y-6 text-center">
          <p className="label">Confirm email</p>
          <h2 className="font-display text-3xl">Check your inbox</h2>
          <p className="text-sm text-ink/70">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-ink">{email ?? "your email"}</span>.
            Open it to activate your account, then come back to sign in.
          </p>
          <div className="neo-panel rounded-2xl p-4 text-sm text-ink/70">
            If you don’t see the email, check your spam folder or try again with a
            different address.
          </div>
          <Link to="/" className="btn-primary w-full justify-center">
            Back to sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
