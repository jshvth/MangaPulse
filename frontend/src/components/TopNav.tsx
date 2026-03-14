import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function TopNav() {
  const { isAuthed, signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 px-6 py-4 shadow-[0_30px_70px_-40px_rgba(25,23,29,0.6)] backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
          MP
        </div>
        <div>
          <p className="font-display text-lg font-semibold">MangaPulse</p>
          <p className="text-xs text-ink/60">Collector Studio</p>
        </div>
      </Link>
      <div className="flex items-center gap-6 text-sm font-semibold text-ink/70">
        <NavLink
          to={isAuthed ? "/collection" : "/"}
          onClick={(event) => {
            if (!isAuthed) event.preventDefault();
          }}
          className={({ isActive }) =>
            isAuthed
              ? isActive
                ? "text-ink"
                : "hover:text-ink"
              : "cursor-not-allowed text-ink/40"
          }
        >
          Collection
        </NavLink>
        {isAuthed ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-ink/50">{user?.email}</span>
            <button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="hover:text-ink"
            >
              Sign out
            </button>
          </div>
        ) : (
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "text-ink" : "hover:text-ink")}
          >
            Sign in
          </NavLink>
        )}
      </div>
    </nav>
  );
}
