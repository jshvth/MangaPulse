import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

type PublicProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  location_city: string | null;
  location_country: string | null;
  bio: string | null;
  favorite_1: string | null;
  favorite_2: string | null;
  favorite_3: string | null;
};

type PublicCollectionItem = {
  id: string;
  title: string;
  image_url: string | null;
  total_volumes: number | null;
  current_volume: number | null;
  status: string | null;
  updated_at: string | null;
};

export function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [collection, setCollection] = useState<PublicCollectionItem[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const isSelf = useMemo(() => user?.id === id, [user?.id, id]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setError(null);

    supabase
      .from("user_profiles")
      .select(
        "user_id, display_name, avatar_url, location_city, location_country, bio, favorite_1, favorite_2, favorite_3"
      )
      .eq("user_id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setError(error.message);
          return;
        }
        setProfile(data ?? null);
      })
      .then(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    let alive = true;

    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", id)
      .then(({ count }) => {
        if (!alive) return;
        setFollowersCount(count ?? 0);
      });

    supabase
      .from("user_follows")
      .select("id")
      .eq("following_id", id)
      .eq("follower_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setFollowing(!!data);
      });

    return () => {
      alive = false;
    };
  }, [id, user?.id]);

  useEffect(() => {
    if (!id || !user) {
      setCollection([]);
      return;
    }

    let alive = true;
    setCollectionLoading(true);
    setCollectionError(null);

    supabase
      .from("user_mangas")
      .select("id, title, image_url, total_volumes, current_volume, status, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false })
      .limit(24)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setCollectionError(error.message);
          setCollection([]);
          return;
        }
        setCollection((data ?? []) as PublicCollectionItem[]);
      })
      .then(() => {
        if (!alive) return;
        setCollectionLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, user?.id]);

  const favorites = useMemo(() => {
    if (!profile) return [];
    return [profile.favorite_1, profile.favorite_2, profile.favorite_3].filter(Boolean);
  }, [profile]);

  const totalOwned = useMemo(
    () => collection.reduce((sum, item) => sum + (item.current_volume ?? 0), 0),
    [collection]
  );

  const formatStatus = (status: string | null) => {
    if (!status) return "Reading";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleToggleFollow = async () => {
    if (!id || !user) return;
    if (isSelf) return;
    setFollowLoading(true);

    if (following) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("following_id", id)
        .eq("follower_id", user.id);
      setFollowing(false);
      setFollowersCount((prev) => Math.max(prev - 1, 0));
      setFollowLoading(false);
      return;
    }

    await supabase.from("user_follows").insert({
      follower_id: user.id,
      following_id: id,
    });
    setFollowing(true);
    setFollowersCount((prev) => prev + 1);
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center text-sm text-ink/60">
        Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center text-sm text-ink/60">
        {error ?? "Profile not found."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="glass-card hover-lift reveal rounded-[32px] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-white">
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
              <p className="font-display text-2xl">
                {profile.display_name ?? "Unnamed"}
              </p>
              <p className="text-sm text-ink/60">
                {profile.location_city
                  ? `${profile.location_city}${profile.location_country ? `, ${profile.location_country}` : ""}`
                  : "Location hidden"}
              </p>
              <p className="mt-2 text-xs text-ink/50">
                {followersCount} follower{followersCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            className={following ? "btn-ghost" : "btn-primary"}
            onClick={handleToggleFollow}
            disabled={followLoading || isSelf}
          >
            {isSelf ? "This is you" : following ? "Unfollow" : "Follow"}
          </button>
        </div>
      </section>

      {profile.bio && (
        <section className="glass-card hover-lift reveal reveal-delay-1 rounded-[32px] p-6 md:p-8">
          <p className="label">Bio</p>
          <h3 className="font-display text-2xl">About</h3>
          <p className="mt-4 text-sm text-ink/70">{profile.bio}</p>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="glass-card hover-lift reveal reveal-delay-2 rounded-[32px] p-6 md:p-8">
          <p className="label">Favorites</p>
          <h3 className="font-display text-2xl">Top titles</h3>
          <div className="mt-6 flex flex-wrap gap-2">
            {favorites.map((fav) => (
              <span key={fav} className="chip">
                {fav}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="glass-card hover-lift reveal reveal-delay-3 rounded-[32px] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">Collection</p>
            <h3 className="font-display text-2xl">Shelf overview</h3>
            <p className="text-sm text-ink/60">
              Browse the manga this collector is tracking.
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="chip">{collection.length} series</span>
              <span className="chip">{totalOwned} volumes</span>
            </div>
          )}
        </div>

        {!user && (
          <div className="neo-panel mt-6 rounded-2xl p-4 text-sm text-ink/70">
            Sign in to view their collection.
          </div>
        )}

        {user && collectionError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {collectionError}
          </div>
        )}

        {user && collectionLoading && (
          <div className="neo-panel mt-6 rounded-2xl p-4 text-sm text-ink/70">
            Loading collection...
          </div>
        )}

        {user && !collectionLoading && collection.length === 0 && (
          <div className="neo-panel mt-6 rounded-2xl p-4 text-sm text-ink/70">
            No titles added yet.
          </div>
        )}

        {user && collection.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collection.map((item) => {
              const progress = item.total_volumes
                ? `${item.current_volume ?? 0}/${item.total_volumes}`
                : `${item.current_volume ?? 0}/?`;
              const progressPct = item.total_volumes
                ? Math.min(
                    ((item.current_volume ?? 0) / item.total_volumes) * 100,
                    100
                  )
                : 0;

              return (
                <div key={item.id} className="neo-panel rounded-3xl p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image_url ?? "/placeholder-cover.svg"}
                      alt={item.title}
                      className="h-20 w-14 rounded-xl object-cover shadow-sm"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="text-xs text-ink/60">{progress} volumes</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="chip text-[10px]">{formatStatus(item.status)}</span>
                        {item.total_volumes && (
                          <span className="text-[11px] text-ink/50">
                            {item.total_volumes} total
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/60">
                    <div
                      className="h-full rounded-full bg-accent/70"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
