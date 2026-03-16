import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "../context/CollectionContext";
import { searchManga } from "../lib/search";
import type { SearchResult } from "../lib/types";

export function CollectionPage() {
  const {
    entries,
    loading: syncing,
    error: syncError,
    addEntry,
    updateStatus,
    removeEntry,
  } = useCollection();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [owned, setOwned] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalOwned = useMemo(
    () => entries.reduce((sum, item) => sum + item.ownedVolumes, 0),
    [entries]
  );

  const needsCount = useMemo(
    () => entries.filter((item) => item.needsNotification).length,
    [entries]
  );

  const totalSeries = entries.length;

  const handleSearch = async () => {
    setSearching(true);
    setError(null);
    try {
      const data = await searchManga(query);
      setResults(data);
    } catch (err) {
      setError("Could not reach the manga APIs. Try again in a moment.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = (item: SearchResult) => {
    const ownedCount = Number(owned) || 0;
    addEntry(item, ownedCount);
    setOwned("");
    setResults([]);
    setQuery("");
  };

  return (
    <div className="space-y-8">
      <section className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Collection</p>
          <h2 className="font-display text-3xl">Your manga shelf</h2>
          <p className="text-sm text-ink/60">
            Add series, track owned volumes, and jump into details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncing && <div className="chip">Syncing library...</div>}
          {needsCount > 0 && (
            <div className="chip border-transparent bg-accent/10 text-accent">
              {needsCount} updates
            </div>
          )}
          <div className="chip">{totalSeries} series</div>
          <div className="chip">{totalOwned} volumes</div>
        </div>
      </section>

      <section className="reveal reveal-delay-1 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card hover-lift rounded-[32px] p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Add new</p>
              <h3 className="font-display text-2xl">Search a manga</h3>
            </div>
            <span className="chip">Jikan + AniList</span>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_160px_120px]">
            <input
              className="input-field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a manga title"
            />
            <input
              className="input-field"
              value={owned}
              onChange={(event) => setOwned(event.target.value)}
              placeholder="Owned vols"
              type="number"
              min={0}
            />
              <button className="btn-primary" onClick={handleSearch}>
                {searching ? "Searching..." : "Find"}
              </button>
          </div>
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {syncError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {syncError}
            </div>
          )}
          {results.length > 0 && (
            <div className="mt-6 grid gap-3">
              {results.map((item) => (
                <div
                  key={`${item.source}-${item.sourceId}`}
                  className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image ?? "/placeholder-cover.svg"}
                    alt={item.title}
                    className="h-16 w-12 rounded-lg object-cover shadow-sm"
                  />
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-xs text-ink/50">
                      {item.totalVolumes
                        ? `${item.totalVolumes} volumes`
                        : "Volumes unknown"}
                    </p>
                        <span className="mt-2 inline-flex rounded-full bg-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-ink/50">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  <button className="btn-ghost" onClick={() => handleAdd(item)}>
                    Add to collection
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card hover-lift rounded-[32px] p-6 md:p-8">
          <p className="label">Pulse</p>
          <h3 className="font-display text-2xl">Release readiness</h3>
          <p className="text-sm text-ink/60">
            Keep owned volumes accurate so the next scan is precise.
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                Next scan
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">In 3 days</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                Coverage
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {totalSeries} series tracked
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                Updates flagged
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {needsCount} series
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal reveal-delay-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">Collection overview</h3>
          <span className="text-sm text-ink/50">Click a card for details</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((item) => {
            const progress = item.totalVolumes
              ? `${item.ownedVolumes}/${item.totalVolumes}`
              : `${item.ownedVolumes}/?`;
            const progressPct = item.totalVolumes
              ? Math.min((item.ownedVolumes / item.totalVolumes) * 100, 100)
              : 0;
            return (
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/manga/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") navigate(`/manga/${item.id}`);
                }}
                key={item.id}
                className="group glass-card cursor-pointer rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(232,93,74,0.15),_0_20px_40px_-30px_rgba(232,93,74,0.6)]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image ?? "/placeholder-cover.svg"}
                    alt={item.title}
                    className="h-24 w-16 rounded-xl object-cover shadow-sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{item.title}</p>
                      {item.needsNotification && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/50">{progress} volumes</p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-haze">
                      <div
                        className="h-full rounded-full bg-accent transition"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                  <select
                    className="rounded-full border border-ink/10 bg-white/80 px-3 py-1"
                    value={item.status}
                    onChange={(event) => {
                      event.stopPropagation();
                      updateStatus(item.id, event.target.value as any);
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="planned">Planned</option>
                  </select>
                  <button
                    className="text-ink/50 hover:text-ink"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeEntry(item.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!syncing && entries.length === 0 && (
        <div className="glass-card rounded-3xl p-8 text-center text-sm text-ink/60">
          Your shelf is empty. Search a manga above to add your first series.
        </div>
      )}
    </div>
  );
}
