import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

type ProfileResult = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  location_city: string | null;
  location_country: string | null;
  favorite_1: string | null;
  favorite_2: string | null;
  favorite_3: string | null;
  bio: string | null;
};

export function ProfilesPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"name" | "city">("name");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);

  const favorites = (profile: ProfileResult) =>
    [profile.favorite_1, profile.favorite_2, profile.favorite_3].filter(Boolean) as string[];

  const normalizeQuery = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const sortedResults = useMemo(() => {
    if (mode !== "name") return results;
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return results;
    const exact = results.filter(
      (item) => normalizeQuery(item.display_name ?? "") === normalizedQuery
    );
    const rest = results.filter(
      (item) => normalizeQuery(item.display_name ?? "") !== normalizedQuery
    );
    return [...exact, ...rest];
  }, [results, mode, query]);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        if (!alive) return;
        setFollowingIds((data ?? []).map((row) => row.following_id));
      });

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const normalized = normalizeQuery(trimmed);
    setLoading(true);
    setError(null);

    let request = supabase
      .from("user_profiles")
      .select(
        "user_id, display_name, avatar_url, location_city, location_country, favorite_1, favorite_2, favorite_3, bio"
      )
      .limit(30);

    if (mode === "name") {
      request = request.or(
        `display_name_search.ilike.%${normalized}%,display_name.ilike.%${trimmed}%`
      );
    } else {
      request = request.or(
        `location_city_search.ilike.%${normalized}%,location_city.ilike.%${trimmed}%`
      );
    }

    const { data, error } = await request;
    if (error) {
      setError(error.message);
      setResults([]);
    } else {
      setResults(data ?? []);
    }
    setLoading(false);
  };

  const handleToggleFollow = async (
    event: MouseEvent<HTMLButtonElement>,
    targetId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      setError("Sign in to follow profiles.");
      return;
    }

    if (followBusyId) return;
    setFollowBusyId(targetId);
    setError(null);

    const isFollowing = followingIds.includes(targetId);

    if (isFollowing) {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetId);

      if (!error) {
        setFollowingIds((prev) => prev.filter((id) => id !== targetId));
      } else {
        setError(error.message);
      }
    } else {
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: targetId });

      if (!error) {
        setFollowingIds((prev) => [...prev, targetId]);
      } else {
        setError(error.message);
      }
    }

    setFollowBusyId(null);
  };

  return (
    <div className="space-y-8">
      <section className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Community</p>
          <h2 className="font-display text-3xl">Find collectors</h2>
          <p className="text-sm text-ink/60">
            Search by name for direct matches or by city to find nearby readers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={mode === "name" ? "btn-primary" : "btn-ghost"}
            onClick={() => setMode("name")}
          >
            Name
          </button>
          <button
            className={mode === "city" ? "btn-primary" : "btn-ghost"}
            onClick={() => setMode("city")}
          >
            City
          </button>
        </div>
      </section>

      <section className="glass-card hover-lift reveal rounded-[32px] p-6 md:p-8">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="input-field"
            placeholder={mode === "name" ? "Search by name" : "Search by city"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="btn-primary" onClick={handleSearch}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <section className="reveal reveal-delay-1">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedResults.map((profile) => (
            <Link
              key={profile.user_id}
              to={`/profiles/${profile.user_id}`}
              className="glass-card neo-panel hover-lift rounded-3xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-mist/80">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name ?? "Profile"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-ink/40">No image</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      {profile.display_name ?? "Unnamed"}
                    </p>
                    <p className="text-xs text-ink/50">
                      {profile.location_city
                        ? `${profile.location_city}${profile.location_country ? `, ${profile.location_country}` : ""}`
                        : "Location hidden"}
                    </p>
                    {followingIds.includes(profile.user_id) && (
                      <span className="mt-2 inline-flex rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                        Following
                      </span>
                    )}
                  </div>
                </div>
                {user?.id !== profile.user_id && (
                  <button
                    className="btn-ghost text-xs uppercase tracking-[0.2em]"
                    onClick={(event) => handleToggleFollow(event, profile.user_id)}
                    disabled={followBusyId === profile.user_id}
                  >
                    {followBusyId === profile.user_id
                      ? "..."
                      : followingIds.includes(profile.user_id)
                        ? "Unfollow"
                        : "Follow"}
                  </button>
                )}
              </div>
              {profile.bio && (
                <p className="mt-4 text-sm text-ink/60 line-clamp-3">{profile.bio}</p>
              )}
              {favorites(profile).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {favorites(profile).map((fav) => (
                    <span key={fav} className="chip text-[10px]">
                      {fav}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
        {!loading && sortedResults.length === 0 && query.trim() && (
          <div className="neo-panel mt-6 rounded-2xl p-4 text-sm text-ink/70">
            No profiles found. Try another search.
          </div>
        )}
      </section>
    </div>
  );
}
