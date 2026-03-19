import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";

export function TopNav() {
  const { isAuthed, signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="glass-card reveal relative z-50 flex flex-col gap-4 rounded-3xl px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <Link
        to="/"
        className="flex items-center gap-3 transition hover:-translate-y-0.5"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-[0_10px_24px_-16px_rgba(16,24,38,0.8)]">
          MP
        </div>
        <div>
          <p className="font-display text-lg font-semibold">MangaPulse</p>
          <p className="text-xs text-ink/60">Collector Studio</p>
        </div>
      </Link>
      <div className="flex flex-col gap-3 text-sm font-semibold text-ink/70 md:flex-row md:items-center md:gap-6">
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
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
          <NavLink
            to={isAuthed ? "/profiles" : "/"}
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
            Community
          </NavLink>
          <NavLink
            to={isAuthed ? "/profile" : "/"}
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
            Profile
          </NavLink>
        </div>
        {isAuthed ? (
          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell />
            <span className="hidden text-xs text-ink/50 sm:inline">{user?.email}</span>
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
