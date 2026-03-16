import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCollection } from "../context/CollectionContext";
import { supabase } from "../lib/supabaseClient";

type ReleaseEntry = {
  id: string;
  volume: number;
  release_date: string | null;
  source: string | null;
  source_url: string | null;
  created_at: string | null;
};

type PlaceEntry = {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location?: { lat: () => number; lng: () => number } };
};

export function MangaDetailPage() {
  const { id } = useParams();
  const { entries, updateOwned, updateStatus, removeEntry } = useCollection();
  const entry = entries.find((item) => String(item.id) === id);
  const [ownedInput, setOwnedInput] = useState(entry?.ownedVolumes.toString() ?? "");
  const [releases, setReleases] = useState<ReleaseEntry[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceEntry[]>([]);
  const [placesStatus, setPlacesStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [placesError, setPlacesError] = useState<string | null>(null);
  const googleKey = (import.meta as any).env?.VITE_GOOGLE_PLACES_KEY as string | undefined;

  const progress = useMemo(() => {
    if (!entry) return 0;
    if (!entry.totalVolumes) return 0;
    return Math.min((entry.ownedVolumes / entry.totalVolumes) * 100, 100);
  }, [entry]);

  useEffect(() => {
    if (!entry) return;
    let alive = true;

    const loadReleases = async () => {
      setReleasesLoading(true);
      setReleasesError(null);
      const { data, error } = await supabase
        .from("manga_releases")
        .select("id, volume, release_date, source, source_url, created_at")
        .eq("user_manga_id", entry.id)
        .order("volume", { ascending: false })
        .limit(10);

      if (!alive) return;
      if (error) {
        setReleasesError(error.message);
        setReleases([]);
      } else {
        setReleases(data ?? []);
      }
      setReleasesLoading(false);
    };

    loadReleases();
    return () => {
      alive = false;
    };
  }, [entry?.id]);

  if (!entry) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="text-sm text-ink/60">Manga not found.</p>
        <Link to="/collection" className="btn-ghost mt-4">
          Back to collection
        </Link>
      </div>
    );
  }

  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
    `${entry.title} manga`
  )}`;

  const releaseRows = releases.map((item) => {
    const dateLabel = item.release_date
      ? new Date(item.release_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "TBA";
    return { ...item, dateLabel };
  });

  const loadGooglePlaces = () =>
    new Promise<void>((resolve, reject) => {
      const google = (window as any).google;
      if (google?.maps?.places) {
        resolve();
        return;
      }

      if (!googleKey) {
        reject(new Error("Missing Google Places API key"));
        return;
      }

      const existing = document.getElementById("google-places-script");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
        return;
      }

      const script = document.createElement("script");
      script.id = "google-places-script";
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });

  const handleUseLocation = async () => {
    if (!googleKey) {
      setPlacesStatus("error");
      setPlacesError("Missing Google Places API key.");
      return;
    }

    if (!navigator.geolocation) {
      setPlacesStatus("error");
      setPlacesError("Geolocation is not available in this browser.");
      return;
    }

    setPlacesStatus("loading");
    setPlacesError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await loadGooglePlaces();

      const google = (window as any).google;
      const location = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );

      const mapDiv = document.createElement("div");
      mapDiv.style.width = "1px";
      mapDiv.style.height = "1px";
      mapDiv.style.position = "absolute";
      mapDiv.style.left = "-9999px";
      document.body.appendChild(mapDiv);

      const map = new google.maps.Map(mapDiv, { center: location, zoom: 12 });
      const service = new google.maps.places.PlacesService(map);

      service.nearbySearch(
        {
          location,
          radius: 30000,
          type: "book_store",
          keyword: "manga",
        },
        (results: any, status: string) => {
          document.body.removeChild(mapDiv);
          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
            setPlacesStatus("error");
            setPlacesError("No nearby bookstores found.");
            setPlaces([]);
            return;
          }
          setPlaces(results as PlaceEntry[]);
          setPlacesStatus("ready");
        }
      );
    } catch {
      setPlacesStatus("error");
      setPlacesError("Location access was denied or timed out.");
    }
  };

  return (
    <div className="space-y-8">
      <Link to="/collection" className="text-sm text-ink/60 hover:text-ink">
        ← Back to collection
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card hover-lift reveal rounded-[32px] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <img
              src={entry.image ?? "/placeholder-cover.svg"}
              alt={entry.title}
              className="h-48 w-32 rounded-2xl object-cover shadow-[0_20px_40px_-25px_rgba(25,23,29,0.6)]"
            />
            <div className="flex-1 space-y-4">
              <div>
                <p className="label">Series</p>
                <h2 className="font-display text-3xl">{entry.title}</h2>
                <p className="text-sm text-ink/60">
                  {entry.totalVolumes ? `${entry.totalVolumes} volumes total` : "Volumes unknown"}
                </p>
                {entry.needsNotification && (
                  <span className="mt-3 inline-flex rounded-full bg-accent/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    New release detected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {entry.url && (
                  <a className="btn-ghost" href={entry.url} target="_blank" rel="noreferrer">
                    MAL page
                  </a>
                )}
                <a className="btn-primary" href={amazonUrl} target="_blank" rel="noreferrer">
                  Buy remaining
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-5">
              <p className="label">Progress</p>
              <div className="mt-4 flex items-center gap-6">
                <div className="relative h-24 w-24">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#e85d4a ${progress}%, #efe7df ${progress}% 100%)`,
                    }}
                  />
                  <div className="absolute inset-3 rounded-full bg-white" />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                    {entry.totalVolumes ? `${Math.round(progress)}%` : "--"}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-ink/60">Owned</p>
                  <p className="text-2xl font-semibold text-ink">
                    {entry.ownedVolumes}/{entry.totalVolumes ?? "?"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white/70 p-5">
              <p className="label">Update</p>
              <div className="mt-4 grid gap-3">
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={ownedInput}
                  onChange={(event) => setOwnedInput(event.target.value)}
                />
                <button
                  className="btn-primary"
                  onClick={() => updateOwned(entry.id, Number(ownedInput) || 0)}
                >
                  Save owned volumes
                </button>
                <select
                  className="input-field"
                  value={entry.status}
                  onChange={(event) => updateStatus(entry.id, event.target.value as any)}
                >
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="planned">Planned</option>
                </select>
                <button
                  className="btn-ghost"
                  onClick={() => removeEntry(entry.id)}
                >
                  Remove from collection
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card hover-lift reveal reveal-delay-1 rounded-[32px] p-6 md:p-8">
            <p className="label">Nearby bookstores</p>
            <h3 className="font-display text-2xl">Find a shop within 30km</h3>
            <p className="text-sm text-ink/60">
              Connect the Places API to get live availability near you. We can
              wire this once you have a Google Maps key.
            </p>

          <div className="mt-6 grid gap-3 rounded-3xl border border-dashed border-ink/20 bg-white/70 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">API status</span>
              <span className="chip">
                {googleKey ? "Key detected" : "Key missing"}
              </span>
            </div>
            <button className="btn-ghost" onClick={handleUseLocation}>
              {placesStatus === "loading" ? "Searching nearby..." : "Use my location"}
            </button>
            <a
              className="btn-primary"
              href={`https://www.google.com/maps/search/${encodeURIComponent(
                "bookstore near me"
                )}`}
                target="_blank"
                rel="noreferrer"
            >
              Open Google Maps
            </a>
          </div>
          <div className="mt-6 space-y-3">
            {placesStatus === "error" && placesError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {placesError}
              </div>
            )}
            {placesStatus === "ready" && places.length > 0 && (
              <div className="grid gap-3">
                {places.slice(0, 6).map((place) => (
                  <div
                    key={place.place_id}
                    className="rounded-2xl border border-ink/10 bg-white/80 p-4"
                  >
                    <p className="font-semibold text-ink">{place.name}</p>
                    {place.vicinity && (
                      <p className="text-xs text-ink/50">{place.vicinity}</p>
                    )}
                    {typeof place.rating === "number" && (
                      <p className="text-xs text-ink/50">
                        Rating: {place.rating} ({place.user_ratings_total ?? 0})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {placesStatus === "ready" && places.length === 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/60">
                No nearby bookstores were returned.
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3 text-sm text-ink/60">
            <p>Planned UX:</p>
              <ul className="list-disc pl-5">
                <li>Find stores within 30km radius</li>
                <li>Show distance + open hours</li>
                <li>Quick link to call or reserve</li>
              </ul>
            </div>
          </div>

          <div className="glass-card hover-lift reveal reveal-delay-2 rounded-[32px] p-6 md:p-8">
            <p className="label">Release history</p>
            <h3 className="font-display text-2xl">Latest volumes found</h3>
            <p className="text-sm text-ink/60">
              Pulled from the 3-day scan. We keep the last 10 entries here.
            </p>

            <div className="mt-6 space-y-3">
              {releasesLoading && (
                <div className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/60">
                  Loading release history...
                </div>
              )}
              {releasesError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {releasesError}
                </div>
              )}
              {!releasesLoading && !releasesError && releaseRows.length === 0 && (
                <div className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/60">
                  No releases found yet. The next scan should populate this.
                </div>
              )}
              {releaseRows.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/80 p-4"
                >
                  <div>
                    <p className="font-semibold text-ink">Vol. {item.volume}</p>
                    <p className="text-xs text-ink/50">{item.dateLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.source && (
                      <span className="chip uppercase tracking-[0.2em]">
                        {item.source}
                      </span>
                    )}
                    {item.source_url && (
                      <a
                        className="btn-ghost"
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
