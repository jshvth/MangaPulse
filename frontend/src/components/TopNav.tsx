import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";

export function TopNav() {
  const { isAuthed, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="glass-card reveal relative z-50 rounded-3xl px-5 py-4 md:flex md:items-center md:justify-between md:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-3 transition hover:-translate-y-0.5"
          onClick={closeMenu}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-[0_10px_24px_-16px_rgba(16,24,38,0.8)]">
            MP
          </div>
          <div>
            <p className="font-display text-lg font-semibold">MangaPulse</p>
            <p className="text-xs text-ink/60">Collector Studio</p>
          </div>
        </Link>
        <button
          className="md:hidden rounded-2xl border border-ink/10 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink/60"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          Menu
        </button>
      </div>
      <div
        id="mobile-menu"
        className={`mt-4 flex flex-col gap-3 text-sm font-semibold text-ink/70 md:mt-0 md:flex md:flex-row md:items-center md:gap-6 ${
          menuOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <NavLink
            to={isAuthed ? "/collection" : "/"}
            onClick={(event) => {
              if (!isAuthed) event.preventDefault();
              closeMenu();
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
              closeMenu();
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
              closeMenu();
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
                closeMenu();
              }}
              className="hover:text-ink"
            >
              Sign out
            </button>
          </div>
        ) : (
          <NavLink
            to="/"
            onClick={closeMenu}
            className={({ isActive }) => (isActive ? "text-ink" : "hover:text-ink")}
          >
            Sign in
          </NavLink>
        )}
      </div>
    </nav>
  );
}
