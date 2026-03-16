// Supabase Edge Function: release-check
// Triggered by pg_cron (every 5 days) to compare DB titles with Jikan + AniList.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    ...init,
  });

const SUPABASE_URL = Deno.env.get("MP_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("MP_SUPABASE_SERVICE_ROLE_KEY");
const JIKAN_BASE_URL = Deno.env.get("JIKAN_BASE_URL") ?? "https://api.jikan.moe/v4";
const JIKAN_DELAY_MS = Number(Deno.env.get("JIKAN_DELAY_MS") ?? 500);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const RESEND_BASE_URL = Deno.env.get("RESEND_BASE_URL") ?? "https://api.resend.com";
const NOTIFICATION_BATCH_LIMIT = Number(
  Deno.env.get("NOTIFICATION_BATCH_LIMIT") ?? 200
);
const MIN_DAYS_BETWEEN_CHECKS = Number(Deno.env.get("MIN_DAYS_BETWEEN_CHECKS") ?? 3);

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing MP_SUPABASE_URL or MP_SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type JikanManga = {
  mal_id: number;
  title: string;
  volumes: number | null;
  url?: string | null;
};

type AniListManga = {
  id: number;
  idMal: number | null;
  title: string;
  volumes: number | null;
  url?: string | null;
};

const ANILIST_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      idMal
      title {
        romaji
        english
      }
      siteUrl
      volumes
    }
  }
`;

const ANILIST_SEARCH_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: MANGA, sort: [SEARCH_MATCH]) {
        id
        idMal
        title {
          romaji
          english
        }
        siteUrl
        volumes
      }
    }
  }
`;

async function fetchByMalId(malId: number): Promise<JikanManga | null> {
  const res = await fetch(`${JIKAN_BASE_URL}/manga/${malId}`);
  if (!res.ok) return null;
  const body = await res.json();
  if (!body?.data) return null;
  return {
    mal_id: body.data.mal_id,
    title: body.data.title,
    volumes: body.data.volumes ?? null,
    url: body.data.url ?? null,
  };
}

async function searchByTitle(title: string): Promise<JikanManga | null> {
  const url = `${JIKAN_BASE_URL}/manga?q=${encodeURIComponent(title)}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.json();
  const hit = body?.data?.[0];
  if (!hit) return null;
  return {
    mal_id: hit.mal_id,
    title: hit.title,
    volumes: hit.volumes ?? null,
    url: hit.url ?? null,
  };
}

async function fetchAniListById(id: number): Promise<AniListManga | null> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query: ANILIST_ID_QUERY, variables: { id } }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const media = body?.data?.Media;
  if (!media) return null;
  return {
    id: media.id,
    idMal: media.idMal ?? null,
    title: media.title?.english ?? media.title?.romaji ?? "Untitled",
    volumes: media.volumes ?? null,
    url: media.siteUrl ?? null,
  };
}

async function searchAniListByTitle(title: string): Promise<AniListManga | null> {
  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      query: ANILIST_SEARCH_QUERY,
      variables: { search: title, perPage: 1 },
    }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const hit = body?.data?.Page?.media?.[0];
  if (!hit) return null;
  return {
    id: hit.id,
    idMal: hit.idMal ?? null,
    title: hit.title?.english ?? hit.title?.romaji ?? "Untitled",
    volumes: hit.volumes ?? null,
    url: hit.siteUrl ?? null,
  };
}

async function enqueueNotifications(
  rows: Array<{ user_manga_id: string; release_id: string }>
) {
  if (!rows.length) return;
  const payload = rows.map((row) => ({
    user_manga_id: row.user_manga_id,
    release_id: row.release_id,
    channel: "email",
  }));

  await supabase
    .from("notification_queue")
    .upsert(payload, { onConflict: "user_manga_id,release_id,channel" });
}

async function sendPendingNotifications() {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const { data: pending, error } = await supabase
    .from("notification_queue")
    .select(
      "id, user_manga_id, release_id, manga_releases(volume), user_mangas(user_id, title)"
    )
    .eq("status", "pending")
    .limit(NOTIFICATION_BATCH_LIMIT);

  if (error || !pending?.length) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  let attempted = 0;
  let sent = 0;
  let failed = 0;
  const successfulUserMangaIds = new Set<string>();

  for (const item of pending) {
    attempted += 1;

    const userId = item.user_mangas?.user_id as string | undefined;
    const title = item.user_mangas?.title as string | undefined;
    const volume = item.manga_releases?.volume as number | undefined;

    if (!userId || !title) {
      failed += 1;
      await supabase
        .from("notification_queue")
        .update({ status: "failed", error: "Missing user or title" })
        .eq("id", item.id);
      continue;
    }

    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    const email = userData?.user?.email ?? null;

    if (userError || !email) {
      failed += 1;
      await supabase
        .from("notification_queue")
        .update({ status: "failed", error: "Missing user email" })
        .eq("id", item.id);
      continue;
    }

    const subject = volume
      ? `Neue Manga-Veroeffentlichung: ${title} Band ${volume}`
      : `Neue Manga-Veroeffentlichung: ${title}`;

    const bodyText = volume
      ? `Gute Nachrichten! Ein neuer Band von ${title} ist verfuegbar: Band ${volume}.`
      : `Gute Nachrichten! Es gibt ein neues Update zu ${title}.`;

    const res = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject,
        text: bodyText,
      }),
    });

    if (!res.ok) {
      failed += 1;
      const errText = await res.text();
      await supabase
        .from("notification_queue")
        .update({ status: "failed", error: errText.slice(0, 500) })
        .eq("id", item.id);
      continue;
    }

    sent += 1;
    successfulUserMangaIds.add(item.user_manga_id as string);

    await supabase
      .from("notification_queue")
      .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
      .eq("id", item.id);
  }

  for (const userMangaId of successfulUserMangaIds) {
    await supabase
      .from("user_mangas")
      .update({ needs_notification: false, last_notified_at: new Date().toISOString() })
      .eq("id", userMangaId);
  }

  return { attempted, sent, failed };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Use POST" }, { status: 405 });
  }

  const { data: mangas, error } = await supabase
    .from("user_mangas")
    .select("id, user_id, title, mal_id, source, source_id, latest_volume, last_checked_at");

  if (error) {
    console.error("DB error:", error);
    return json({ ok: false, error: "DB error" }, { status: 500 });
  }

  let updated = 0;
  let checked = 0;
  let skipped = 0;
  let releasesCreated = 0;

  for (const manga of mangas ?? []) {
    const lastCheckedAt = manga.last_checked_at
      ? Date.parse(manga.last_checked_at)
      : null;
    const minIntervalMs = MIN_DAYS_BETWEEN_CHECKS * 24 * 60 * 60 * 1000;
    if (lastCheckedAt && Date.now() - lastCheckedAt < minIntervalMs) {
      skipped += 1;
      continue;
    }

    checked += 1;
    let jikan: JikanManga | null = null;
    let anilist: AniListManga | null = null;

    if (manga.mal_id) {
      jikan = await fetchByMalId(manga.mal_id);
    }

    if (!jikan && manga.title) {
      jikan = await searchByTitle(manga.title);
    }

    if (manga.source === "anilist" && manga.source_id) {
      const id = Number(manga.source_id);
      if (Number.isFinite(id)) {
        anilist = await fetchAniListById(id);
      }
    }

    if (!anilist && manga.title) {
      anilist = await searchAniListByTitle(manga.title);
    }

    const volumeCandidates = [jikan?.volumes, anilist?.volumes].filter(
      (value): value is number => typeof value === "number" && !Number.isNaN(value)
    );
    const latestVolume = volumeCandidates.length
      ? Math.max(...volumeCandidates)
      : null;

    const resolvedMalId = jikan?.mal_id ?? anilist?.idMal ?? manga.mal_id ?? null;
    const resolvedSource = manga.source ?? (anilist ? "anilist" : "jikan");
    const resolvedSourceId =
      manga.source_id ??
      (anilist ? String(anilist.id) : resolvedMalId ? String(resolvedMalId) : null);

    const hasNew =
      latestVolume !== null &&
      (manga.latest_volume === null || latestVolume > manga.latest_volume);

    if (hasNew && latestVolume !== null) {
      const start = (manga.latest_volume ?? 0) + 1;
      const end = latestVolume;
      const releaseRows = [] as Array<{
        user_manga_id: string;
        volume: number;
        release_date: string | null;
        source: string;
        source_url: string | null;
      }>;

      for (let volume = start; volume <= end; volume += 1) {
        releaseRows.push({
          user_manga_id: manga.id,
          volume,
          release_date: null,
          source: jikan ? "jikan" : anilist ? "anilist" : "unknown",
          source_url: jikan?.url ?? anilist?.url ?? null,
        });
      }

      const { data: inserted, error: insertError } = await supabase
        .from("manga_releases")
        .upsert(releaseRows, {
          onConflict: "user_manga_id,volume",
          ignoreDuplicates: true,
        })
        .select("id, user_manga_id");

      if (!insertError && inserted?.length) {
        releasesCreated += inserted.length;
        await enqueueNotifications(
          inserted.map((row) => ({
            user_manga_id: row.user_manga_id,
            release_id: row.id,
          }))
        );
      }
    }

    const { error: updateError } = await supabase
      .from("user_mangas")
      .update({
        latest_volume: latestVolume,
        needs_notification: hasNew,
        last_checked_at: new Date().toISOString(),
        mal_id: resolvedMalId,
        source: resolvedSource,
        source_id: resolvedSourceId,
        source_url: jikan?.url ?? anilist?.url ?? null,
      })
      .eq("id", manga.id);

    if (!updateError && hasNew) {
      updated += 1;
    }

    // Be nice to rate limits
    await sleep(JIKAN_DELAY_MS);
  }

  const notificationResult = await sendPendingNotifications();

  return json({
    ok: true,
    checked,
    skipped,
    updated,
    releasesCreated,
    notifications: notificationResult,
  });
});
