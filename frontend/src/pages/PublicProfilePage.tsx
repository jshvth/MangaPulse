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

export function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

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

  const favorites = useMemo(() => {
    if (!profile) return [];
    return [profile.favorite_1, profile.favorite_2, profile.favorite_3].filter(Boolean);
  }, [profile]);

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
    </div>
  );
}
