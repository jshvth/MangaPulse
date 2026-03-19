import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

type ProfileState = {
  bio: string;
  avatar_url: string;
  favorite_1: string;
  favorite_2: string;
  favorite_3: string;
};

const emptyProfile: ProfileState = {
  bio: "",
  avatar_url: "",
  favorite_1: "",
  favorite_2: "",
  favorite_3: "",
};

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    setError(null);

    supabase
      .from("user_profiles")
      .select("bio, avatar_url, favorite_1, favorite_2, favorite_3")
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

    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        bio: profile.bio.trim() || null,
        avatar_url: profile.avatar_url.trim() || null,
        favorite_1: profile.favorite_1.trim() || null,
        favorite_2: profile.favorite_2.trim() || null,
        favorite_3: profile.favorite_3.trim() || null,
      });

    if (error) {
      setError(error.message);
    } else {
      setNotice("Profile saved.");
    }
    setSaving(false);
  };

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
          <p className="label">Avatar</p>
          <h3 className="font-display text-2xl">Profile image</h3>
          <p className="text-sm text-ink/60">
            Paste a public image URL to use as your avatar.
          </p>
          <div className="mt-6 grid gap-4">
            <input
              className="input-field"
              placeholder="https://image-url.com/avatar.jpg"
              value={profile.avatar_url}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, avatar_url: event.target.value }))
              }
            />
            <div className="flex items-center gap-4 rounded-3xl border border-ink/10 bg-white/70 p-4">
              <img
                src={profile.avatar_url || "/placeholder-cover.svg"}
                alt="Profile preview"
                className="h-20 w-20 rounded-2xl object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {user?.email ?? "Your avatar"}
                </p>
                <p className="text-xs text-ink/50">Preview</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card hover-lift reveal reveal-delay-1 rounded-[32px] p-6 md:p-8">
          <p className="label">Bio</p>
          <h3 className="font-display text-2xl">About you</h3>
          <p className="text-sm text-ink/60">
            Tell your collection story in a few lines.
          </p>
          <div className="mt-6 grid gap-4">
            <textarea
              className="input-field min-h-[140px]"
              placeholder="Collector of shonen classics and cozy fantasy..."
              value={profile.bio}
              onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
            />
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/60">
              Tip: Keep it short and personal.
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card hover-lift reveal reveal-delay-2 rounded-[32px] p-6 md:p-8">
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

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink/70">
          {notice}
        </div>
      )}
    </div>
  );
}
