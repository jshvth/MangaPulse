import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCollection } from "../context/CollectionContext";

type ReleaseRow = {
  id: string;
  user_manga_id: string;
  volume: number | null;
  release_date: string | null;
  source: string | null;
  source_url: string | null;
  created_at: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  image: string | null;
  latestVolume: number | null;
  release: ReleaseRow | null;
};

export function NotificationBell() {
  const { entries } = useCollection();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const pending = useMemo(
    () => entries.filter((entry) => entry.needsNotification),
    [entries]
  );

  const pendingIds = useMemo(
    () => pending.map((entry) => entry.id),
    [pending]
  );

  useEffect(() => {
    if (!open) return;
    if (pendingIds.length === 0) {
      setItems([]);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("manga_releases")
        .select("id, user_manga_id, volume, release_date, source, source_url, created_at")
        .in("user_manga_id", pendingIds)
        .order("volume", { ascending: false });

      if (!active) return;

      const latestByManga = new Map<string, ReleaseRow>();
      (data ?? []).forEach((row) => {
        const existing = latestByManga.get(row.user_manga_id);
        if (!existing || (row.volume ?? 0) > (existing.volume ?? 0)) {
          latestByManga.set(row.user_manga_id, row as ReleaseRow);
        }
      });

      const nextItems = pending.map((entry) => ({
        id: entry.id,
        title: entry.title,
        image: entry.image,
        latestVolume: entry.totalVolumes,
        release: latestByManga.get(entry.id) ?? null,
      }));

      setItems(nextItems);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [open, pendingIds.join("|")]);

  const count = pending.length;

  return (
    <div className="relative">
      <button
        className="btn-ghost relative flex items-center gap-2"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>Pulse</span>
        {count > 0 && (
          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-card reveal absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Notifications</p>
              <p className="font-display text-lg">New releases</p>
            </div>
            <button
              className="text-xs text-ink/50 hover:text-ink"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {loading && (
              <div className="rounded-2xl border border-ink/10 bg-white/70 p-3 text-sm text-ink/60">
                Loading updates...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white/70 p-3 text-sm text-ink/60">
                No new releases right now.
              </div>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/80 p-3"
              >
                <img
                  src={item.image ?? "/placeholder-cover.svg"}
                  alt={item.title}
                  className="h-12 w-9 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-xs text-ink/50">
                    {item.release?.volume
                      ? `New volume: ${item.release.volume}`
                      : "New update detected"}
                  </p>
                </div>
                {item.release?.source_url && (
                  <a
                    className="text-xs text-ink/50 hover:text-ink"
                    href={item.release.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ink/50">
              Keep your owned volumes up to date.
            </span>
            <Link className="text-xs font-semibold text-ink" to="/collection">
              View collection
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
