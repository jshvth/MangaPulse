import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCollection } from "../context/CollectionContext";
import { getJikanMangaStats } from "../lib/jikan";
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
  id: string;
  name: string;
  address?: string;
  lat: number;
  lon: number;
  distanceKm?: number;
  osmUrl?: string;
};

export function MangaDetailPage() {
  const { id } = useParams();
  const { entries, updateOwned, updateStatus, removeEntry } = useCollection();
  const entry = entries.find((item) => String(item.id) === id);
  const [ownedInput, setOwnedInput] = useState(entry?.ownedVolumes.toString() ?? "");
  const [releases, setReleases] = useState<ReleaseEntry[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [upcomingVolume, setUpcomingVolume] = useState("");
  const [upcomingDate, setUpcomingDate] = useState("");
  const [upcomingSaving, setUpcomingSaving] = useState(false);
  const [upcomingNotice, setUpcomingNotice] = useState<string | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [ownedSet, setOwnedSet] = useState<Set<number>>(new Set());
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [volumeError, setVolumeError] = useState<string | null>(null);
  const [malStats, setMalStats] = useState<{
    score: number | null;
    popularity: number | null;
  } | null>(null);
  const [malLoading, setMalLoading] = useState(false);
  const [malError, setMalError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceEntry[]>([]);
  const [placesStatus, setPlacesStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [placesError, setPlacesError] = useState<string | null>(null);
  const amazonDomain = (import.meta as any).env?.VITE_AMAZON_DOMAIN as string | undefined;
  const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

  const progress = useMemo(() => {
    if (!entry) return 0;
    if (!entry.totalVolumes) return 0;
    return Math.min((entry.ownedVolumes / entry.totalVolumes) * 100, 100);
  }, [entry]);

  const volumeMax = useMemo(() => {
    if (!entry) return 0;
    const releaseMax = releases.length
      ? Math.max(...releases.map((item) => item.volume ?? 0))
      : 0;
    return Math.max(entry.totalVolumes ?? 0, entry.ownedVolumes ?? 0, releaseMax);
  }, [entry?.totalVolumes, entry?.ownedVolumes, releases]);

  const fetchReleases = async (mangaId: string) => {
    const { data, error } = await supabase
      .from("manga_releases")
      .select("id, volume, release_date, source, source_url, created_at")
      .eq("user_manga_id", mangaId)
      .order("volume", { ascending: false })
      .limit(10);
    return { data: data ?? [], error };
  };

  useEffect(() => {
    if (!entry) return;
    let alive = true;

    const loadReleases = async () => {
      setReleasesLoading(true);
      setReleasesError(null);
      const { data, error } = await fetchReleases(entry.id);

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

  useEffect(() => {
    if (!entry) return;
    if (upcomingVolume) return;
    const suggested = Math.max(entry.ownedVolumes, entry.totalVolumes ?? 0) + 1;
    if (Number.isFinite(suggested) && suggested > 0) {
      setUpcomingVolume(String(suggested));
    }
  }, [entry?.id, upcomingVolume]);

  useEffect(() => {
    if (!entry) return;
    let alive = true;
    setVolumeLoading(true);
    setVolumeError(null);

    supabase
      .from("user_manga_volumes")
      .select("volume")
      .eq("user_manga_id", entry.id)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setVolumeError(error.message);
          setOwnedSet(new Set());
        } else {
          setOwnedSet(new Set((data ?? []).map((row) => row.volume)));
        }
      })
      .then(() => {
        if (!alive) return;
        setVolumeLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [entry?.id]);

  useEffect(() => {
    if (!entry?.malId) {
      setMalStats(null);
      return;
    }

    let alive = true;
    setMalLoading(true);
    setMalError(null);

    getJikanMangaStats(entry.malId)
      .then((stats) => {
        if (!alive) return;
        setMalStats({ score: stats.score, popularity: stats.popularity });
      })
      .catch(() => {
        if (!alive) return;
        setMalError("Could not load MAL stats.");
        setMalStats(null);
      })
      .finally(() => {
        if (!alive) return;
        setMalLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [entry?.malId]);

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

  const resolvedAmazonDomain = useMemo(() => {
    if (amazonDomain) return amazonDomain.replace(/^https?:\/\//, "");
    if (typeof navigator === "undefined") return "amazon.de";
    const locale = navigator.language?.toLowerCase() ?? "";
    if (locale.startsWith("nl")) return "amazon.nl";
    if (locale.startsWith("de")) return "amazon.de";
    if (locale.startsWith("en-gb")) return "amazon.co.uk";
    if (locale.startsWith("en-us")) return "amazon.com";
    if (locale.startsWith("fr")) return "amazon.fr";
    if (locale.startsWith("it")) return "amazon.it";
    if (locale.startsWith("es")) return "amazon.es";
    return "amazon.de";
  }, [amazonDomain]);

  const amazonUrl = `https://${resolvedAmazonDomain}/s?k=${encodeURIComponent(
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

  const handleSaveUpcoming = async () => {
    if (!entry) return;
    const volumeValue = Number(upcomingVolume);
    if (!volumeValue || volumeValue < 1) {
      setUpcomingError("Please enter a valid volume number.");
      return;
    }
    if (!upcomingDate) {
      setUpcomingError("Please select a release date.");
      return;
    }

    setUpcomingSaving(true);
    setUpcomingError(null);
    setUpcomingNotice(null);

    const { error } = await supabase
      .from("manga_releases")
      .upsert(
        {
          user_manga_id: entry.id,
          volume: volumeValue,
          release_date: upcomingDate,
          source: "manual",
          source_url: entry.url,
        },
        { onConflict: "user_manga_id,volume" }
      );

    if (error) {
      setUpcomingError(error.message);
      setUpcomingSaving(false);
      return;
    }

    const { data, error: reloadError } = await fetchReleases(entry.id);
    if (reloadError) {
      setReleasesError(reloadError.message);
    } else {
      setReleases(data ?? []);
    }

    setUpcomingNotice("Upcoming release saved.");
    setUpcomingSaving(false);
  };

  const syncOwnedCount = async (nextSet: Set<number>) => {
    setOwnedSet(nextSet);
    await updateOwned(entry.id, nextSet.size);
  };

  const toggleVolume = async (volume: number) => {
    if (!entry) return;
    const next = new Set(ownedSet);
    if (next.has(volume)) {
      const { error } = await supabase
        .from("user_manga_volumes")
        .delete()
        .eq("user_manga_id", entry.id)
        .eq("volume", volume);
      if (!error) {
        next.delete(volume);
        await syncOwnedCount(next);
      }
      return;
    }

    const { error } = await supabase
      .from("user_manga_volumes")
      .upsert({ user_manga_id: entry.id, volume }, { onConflict: "user_manga_id,volume" });
    if (!error) {
      next.add(volume);
      await syncOwnedCount(next);
    }
  };

  const markAllOwned = async () => {
    if (!entry || volumeMax === 0) return;
    setVolumeLoading(true);
    const volumes = Array.from({ length: volumeMax }, (_, idx) => idx + 1);
    const payload = volumes.map((volume) => ({ user_manga_id: entry.id, volume }));
    const { error } = await supabase
      .from("user_manga_volumes")
      .upsert(payload, { onConflict: "user_manga_id,volume" });
    if (error) {
      setVolumeError(error.message);
    } else {
      await syncOwnedCount(new Set(volumes));
    }
    setVolumeLoading(false);
  };

  const clearOwned = async () => {
    if (!entry) return;
    setVolumeLoading(true);
    const { error } = await supabase
      .from("user_manga_volumes")
      .delete()
      .eq("user_manga_id", entry.id);
    if (error) {
      setVolumeError(error.message);
    } else {
      await syncOwnedCount(new Set());
    }
    setVolumeLoading(false);
  };

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const radius = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatAddress = (tags: Record<string, string> | undefined) => {
    if (!tags) return null;
    const street = tags["addr:street"];
    const house = tags["addr:housenumber"];
    const city = tags["addr:city"];
    const postcode = tags["addr:postcode"];
    const line1 = [street, house].filter(Boolean).join(" ");
    const line2 = [postcode, city].filter(Boolean).join(" ");
    const full = [line1, line2].filter(Boolean).join(", ");
    return full || null;
  };

  const handleUseLocation = async () => {
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

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const radius = 30000;
      const query = `
        [out:json][timeout:25];
        (
          node["shop"="books"](around:${radius},${lat},${lon});
          node["amenity"="bookstore"](around:${radius},${lat},${lon});
          way["shop"="books"](around:${radius},${lat},${lon});
          way["amenity"="bookstore"](around:${radius},${lat},${lon});
          relation["shop"="books"](around:${radius},${lat},${lon});
          relation["amenity"="bookstore"](around:${radius},${lat},${lon});
        );
        out center 30;
      `;

      const response = await fetch(OVERPASS_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data: query }).toString(),
      });

      if (!response.ok) {
        setPlacesStatus("error");
        setPlacesError("OpenStreetMap request failed.");
        setPlaces([]);
        return;
      }

      const data = await response.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];
      const mapped: PlaceEntry[] = elements
        .map((element: any) => {
          const elementLat = element.lat ?? element.center?.lat;
          const elementLon = element.lon ?? element.center?.lon;
          if (typeof elementLat !== "number" || typeof elementLon !== "number") {
            return null;
          }
          const name = element.tags?.name ?? "Bookstore";
          const address = formatAddress(element.tags);
          const distance = distanceKm(lat, lon, elementLat, elementLon);
          const osmUrl = `https://www.openstreetmap.org/?mlat=${elementLat}&mlon=${elementLon}#map=17/${elementLat}/${elementLon}`;

          return {
            id: `${element.type}-${element.id}`,
            name,
            address: address ?? undefined,
            lat: elementLat,
            lon: elementLon,
            distanceKm: distance,
            osmUrl,
          };
        })
        .filter(Boolean) as PlaceEntry[];

      mapped.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      setPlaces(mapped);
      setPlacesStatus("ready");
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
              <p className="label">MAL stats</p>
              <p className="text-sm text-ink/60">Score and popularity rank.</p>
              <div className="mt-4 grid gap-3">
                {malLoading && (
                  <div className="rounded-2xl border border-ink/10 bg-white/70 px-3 py-2 text-xs text-ink/60">
                    Loading MAL stats...
                  </div>
                )}
                {malError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {malError}
                  </div>
                )}
                {!malLoading && !malError && !entry.malId && (
                  <div className="rounded-2xl border border-ink/10 bg-white/70 px-3 py-2 text-xs text-ink/60">
                    No MAL ID found for this manga.
                  </div>
                )}
                {!malLoading && !malError && entry.malId && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                        Score
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-ink">
                        {malStats?.score ?? "--"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                        Pop.
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-ink">
                        {malStats?.popularity ? `#${malStats.popularity}` : "--"}
                      </p>
                    </div>
                  </div>
                )}
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

            <div className="rounded-3xl border border-ink/10 bg-white/70 p-5">
              <p className="label">Upcoming</p>
              <p className="text-sm text-ink/60">
                Add an announced volume and its release date.
              </p>
              <div className="mt-4 grid gap-3">
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  value={upcomingVolume}
                  onChange={(event) => {
                    setUpcomingVolume(event.target.value);
                    setUpcomingError(null);
                  }}
                  placeholder="Volume #"
                />
                <input
                  className="input-field"
                  type="date"
                  value={upcomingDate}
                  onChange={(event) => {
                    setUpcomingDate(event.target.value);
                    setUpcomingError(null);
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={handleSaveUpcoming}
                  disabled={upcomingSaving}
                >
                  {upcomingSaving ? "Saving..." : "Save upcoming release"}
                </button>
                {upcomingError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {upcomingError}
                  </div>
                )}
                {upcomingNotice && (
                  <div className="rounded-2xl border border-ink/10 bg-white/70 px-3 py-2 text-xs text-ink/70">
                    {upcomingNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card hover-lift reveal reveal-delay-1 rounded-[32px] p-6 md:p-8">
            <p className="label">Nearby bookstores</p>
            <h3 className="font-display text-2xl">Find a shop within 30km</h3>
            <p className="text-sm text-ink/60">
              Powered by OpenStreetMap. No API key required, just allow location access
              to find nearby bookstores.
            </p>

          <div className="mt-6 grid gap-3 rounded-3xl border border-dashed border-ink/20 bg-white/70 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">API status</span>
              <span className="chip">
                OpenStreetMap ready
              </span>
            </div>
            <button className="btn-ghost" onClick={handleUseLocation}>
              {placesStatus === "loading" ? "Searching nearby..." : "Use my location"}
            </button>
            <a
              className="btn-primary"
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                "bookstore near me"
              )}`}
                target="_blank"
                rel="noreferrer"
            >
              Open OpenStreetMap
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
                    key={place.id}
                    className="rounded-2xl border border-ink/10 bg-white/80 p-4"
                  >
                    <p className="font-semibold text-ink">{place.name}</p>
                    {place.address && (
                      <p className="text-xs text-ink/50">{place.address}</p>
                    )}
                    {typeof place.distanceKm === "number" && (
                      <p className="text-xs text-ink/50">
                        Approx. {place.distanceKm.toFixed(1)} km away
                      </p>
                    )}
                    {place.osmUrl && (
                      <a
                        className="btn-ghost mt-2 inline-flex"
                        href={place.osmUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in OSM
                      </a>
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

      <section className="glass-card hover-lift reveal rounded-[32px] p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Volume checklist</p>
            <h3 className="font-display text-2xl">Mark owned volumes</h3>
            <p className="text-sm text-ink/60">
              Track non-sequential volumes (e.g., 1-4 + 8-10).
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink/60">
            <span>
              Owned: {ownedSet.size}/{volumeMax || "?"}
            </span>
            <button className="btn-ghost" onClick={clearOwned} disabled={volumeLoading}>
              Clear
            </button>
            <button className="btn-primary" onClick={markAllOwned} disabled={volumeLoading}>
              Mark all
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {volumeError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {volumeError}
            </div>
          )}
          {volumeMax === 0 && (
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/60">
              Total volumes unknown. Add a total via search or use the upcoming release
              section to build the list.
            </div>
          )}
          {volumeMax > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: volumeMax }, (_, idx) => idx + 1).map((volume) => {
                const owned = ownedSet.has(volume);
                return (
                  <button
                    key={volume}
                    onClick={() => toggleVolume(volume)}
                    className={`min-w-[44px] rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      owned
                        ? "border-ink bg-ink text-white"
                        : "border-ink/15 bg-white/70 text-ink/70 hover:border-ink/40"
                    }`}
                  >
                    {volume}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
