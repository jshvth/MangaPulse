import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

type ProfileState = {
  display_name: string;
  location_city: string;
  location_country: string;
  bio: string;
  avatar_url: string;
  favorite_1: string;
  favorite_2: string;
  favorite_3: string;
};

const emptyProfile: ProfileState = {
  display_name: "",
  location_city: "",
  location_country: "",
  bio: "",
  avatar_url: "",
  favorite_1: "",
  favorite_2: "",
  favorite_3: "",
};

type MiniProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  location_city: string | null;
  location_country: string | null;
};

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [following, setFollowing] = useState<MiniProfile[]>([]);
  const [followers, setFollowers] = useState<MiniProfile[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    setError(null);

    supabase
      .from("user_profiles")
      .select(
        "display_name, location_city, location_country, bio, avatar_url, favorite_1, favorite_2, favorite_3"
      )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setError(error.message);
          return;
        }
        if (data) {
          setProfile({
            display_name: data.display_name ?? "",
            location_city: data.location_city ?? "",
            location_country: data.location_country ?? "",
            bio: data.bio ?? "",
            avatar_url: data.avatar_url ?? "",
            favorite_1: data.favorite_1 ?? "",
            favorite_2: data.favorite_2 ?? "",
            favorite_3: data.favorite_3 ?? "",
          });
        }
      })
      .then(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        display_name: profile.display_name.trim() || null,
        location_city: profile.location_city.trim() || null,
        location_country: profile.location_country.trim() || null,
        bio: profile.bio.trim() || null,
        avatar_url: profile.avatar_url.trim() || null,
        favorite_1: profile.favorite_1.trim() || null,
        favorite_2: profile.favorite_2.trim() || null,
        favorite_3: profile.favorite_3.trim() || null,
      })
      .select(
        "display_name, location_city, location_country, bio, avatar_url, favorite_1, favorite_2, favorite_3"
      )
      .maybeSingle();

    if (error) {
      setError(error.message);
    } else {
      if (data) {
        setProfile({
          display_name: data.display_name ?? "",
          location_city: data.location_city ?? "",
          location_country: data.location_country ?? "",
          bio: data.bio ?? "",
          avatar_url: data.avatar_url ?? "",
          favorite_1: data.favorite_1 ?? "",
          favorite_2: data.favorite_2 ?? "",
          favorite_3: data.favorite_3 ?? "",
        });
      }
      setNotice("Profile saved.");
    }
    setSaving(false);
  };

  const handleUploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError(null);
    setNotice(null);

    const fileExt = file.name.split(".").pop() ?? "png";
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatar_url = data?.publicUrl ?? "";

    const { error: updateError } = await supabase
      .from("user_profiles")
      .upsert({ user_id: user.id, avatar_url });

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfile((prev) => ({ ...prev, avatar_url }));
      setNotice("Profile image updated.");
    }
    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploading(true);
    setError(null);
    setNotice(null);

    const filename = profile.avatar_url
      ? profile.avatar_url.split("/").slice(-1)[0]
      : "avatar.png";
    const filePath = `${user.id}/${filename}`;

    await supabase.storage.from("avatars").remove([filePath]);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .upsert({ user_id: user.id, avatar_url: null });

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfile((prev) => ({ ...prev, avatar_url: "" }));
      setNotice("Profile image removed.");
    }
    setUploading(false);
  };

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setSocialLoading(true);

    const loadSocial = async () => {
      const { data: followingRows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = (followingRows ?? []).map((row) => row.following_id);

      const { data: followerRows } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", user.id);

      const followerIds = (followerRows ?? []).map((row) => row.follower_id);

      const { data: followingProfiles } = followingIds.length
        ? await supabase
            .from("user_profiles")
            .select("user_id, display_name, avatar_url, location_city, location_country")
            .in("user_id", followingIds)
        : { data: [] };

      const { data: followerProfiles } = followerIds.length
        ? await supabase
            .from("user_profiles")
            .select("user_id, display_name, avatar_url, location_city, location_country")
            .in("user_id", followerIds)
        : { data: [] };

      if (!alive) return;
      setFollowing((followingProfiles ?? []) as MiniProfile[]);
      setFollowers((followerProfiles ?? []) as MiniProfile[]);
      setSocialLoading(false);
    };

    loadSocial();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <section className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Profile</p>
          <h2 className="font-display text-3xl">Your manga identity</h2>
          <p className="text-sm text-ink/60">
            Add a short bio, photo, and your top three titles.
          </p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card hover-lift reveal rounded-[32px] p-6 md:p-8">
          <p className="label">Profile</p>
          <h3 className="font-display text-2xl">Identity</h3>
          <p className="text-sm text-ink/60">
            Add your name and a photo to personalize your profile.
          </p>
          <div className="mt-6 grid gap-4">
            <input
              className="input-field"
              placeholder="Display name"
              value={profile.display_name}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, display_name: event.target.value }))
              }
            />
            <div className="neo-panel flex items-center gap-4 rounded-3xl p-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-mist/80">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-ink/40">No image</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {user?.email ?? "Your avatar"}
                </p>
                <p className="text-xs text-ink/50">Preview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="btn-primary cursor-pointer">
                {uploading ? "Uploading..." : "Upload picture"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUploadAvatar(file);
                  }}
                  disabled={uploading}
                />
              </label>
              {profile.avatar_url && (
                <button
                  className="btn-ghost"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card hover-lift reveal reveal-delay-1 rounded-[32px] p-6 md:p-8">
          <p className="label">About</p>
          <h3 className="font-display text-2xl">About you</h3>
          <p className="text-sm text-ink/60">
            Tell your collection story in a few lines.
          </p>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="input-field"
                placeholder="City"
                value={profile.location_city}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, location_city: event.target.value }))
                }
              />
              <input
                className="input-field"
                placeholder="Country"
                value={profile.location_country}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, location_country: event.target.value }))
                }
              />
            </div>
            <textarea
              className="input-field min-h-[140px]"
              placeholder="Collector of shonen classics and cozy fantasy..."
              value={profile.bio}
              onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
            />
            <div className="neo-panel rounded-2xl p-4 text-sm text-ink/70">
              Tip: Keep it short and personal.
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card hover-lift reveal reveal-delay-3 rounded-[32px] p-6 md:p-8">
        <p className="label">Favorites</p>
        <h3 className="font-display text-2xl">Top 3 manga/anime</h3>
        <p className="text-sm text-ink/60">
          Add the titles that define your shelf.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            className="input-field"
            placeholder="Favorite #1"
            value={profile.favorite_1}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, favorite_1: event.target.value }))
            }
          />
          <input
            className="input-field"
            placeholder="Favorite #2"
            value={profile.favorite_2}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, favorite_2: event.target.value }))
            }
          />
          <input
            className="input-field"
            placeholder="Favorite #3"
            value={profile.favorite_3}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, favorite_3: event.target.value }))
            }
          />
        </div>
      </section>

      <section className="glass-card hover-lift reveal reveal-delay-3 rounded-[32px] p-6 md:p-8">
        <p className="label">Connections</p>
        <h3 className="font-display text-2xl">Following & followers</h3>
        <p className="text-sm text-ink/60">
          See who you follow and who follows you.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
              Following ({following.length})
            </p>
            {socialLoading && (
              <div className="neo-panel rounded-2xl p-3 text-sm text-ink/70">
                Loading...
              </div>
            )}
            {!socialLoading && following.length === 0 && (
              <div className="neo-panel rounded-2xl p-3 text-sm text-ink/70">
                You are not following anyone yet.
              </div>
            )}
            {following.map((item) => (
              <Link
                key={item.user_id}
                to={`/profiles/${item.user_id}`}
                className="neo-panel flex items-center gap-3 rounded-2xl p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-mist/80">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.display_name ?? "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-ink/40">No image</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {item.display_name ?? "Unnamed"}
                  </p>
                  <p className="text-xs text-ink/50">
                    {item.location_city
                      ? `${item.location_city}${item.location_country ? `, ${item.location_country}` : ""}`
                      : "Location hidden"}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
              Followers ({followers.length})
            </p>
            {socialLoading && (
              <div className="neo-panel rounded-2xl p-3 text-sm text-ink/70">
                Loading...
              </div>
            )}
            {!socialLoading && followers.length === 0 && (
              <div className="neo-panel rounded-2xl p-3 text-sm text-ink/70">
                No followers yet.
              </div>
            )}
            {followers.map((item) => (
              <Link
                key={item.user_id}
                to={`/profiles/${item.user_id}`}
                className="neo-panel flex items-center gap-3 rounded-2xl p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-mist/80">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.display_name ?? "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-ink/40">No image</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {item.display_name ?? "Unnamed"}
                  </p>
                  <p className="text-xs text-ink/50">
                    {item.location_city
                      ? `${item.location_city}${item.location_country ? `, ${item.location_country}` : ""}`
                      : "Location hidden"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="neo-panel rounded-2xl px-4 py-3 text-sm text-ink/70">
          {notice}
        </div>
      )}
    </div>
  );
}
