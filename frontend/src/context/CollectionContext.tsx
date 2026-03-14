import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MangaEntry, SearchResult } from "../lib/types";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

type CollectionContextValue = {
  entries: MangaEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (entry: SearchResult, ownedVolumes: number) => Promise<void>;
  updateOwned: (id: string, ownedVolumes: number) => Promise<void>;
  updateStatus: (id: string, status: MangaEntry["status"]) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
};

const CollectionContext = createContext<CollectionContextValue | null>(null);

function mapRow(row: any): MangaEntry {
  return {
    id: row.id,
    malId: row.mal_id ?? null,
    source: (row.source ?? "jikan") as MangaEntry["source"],
    sourceId: row.source_id ?? String(row.mal_id ?? row.id),
    title: row.title,
    image: row.image_url ?? null,
    url: row.source_url ?? null,
    totalVolumes: row.total_volumes ?? null,
    ownedVolumes: row.current_volume ?? 0,
    needsNotification: row.needs_notification ?? false,
    status: row.status ?? "reading",
    lastUpdated: row.updated_at ?? new Date().toISOString(),
  };
}

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthed, user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<MangaEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("user_mangas")
      .select(
        "id, title, mal_id, source, source_id, image_url, source_url, total_volumes, current_volume, needs_notification, status, updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setEntries((data ?? []).map(mapRow));
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed || !user) {
      setEntries([]);
      return;
    }
    loadEntries();
  }, [authLoading, isAuthed, user?.id]);

  const addEntry = async (entry: SearchResult, ownedVolumes: number) => {
    if (!user) return;
    setError(null);

    let existing: any = null;
    let findError: any = null;

    if (entry.malId) {
      const { data, error } = await supabase
        .from("user_mangas")
        .select(
          "id, title, mal_id, source, source_id, image_url, source_url, total_volumes, current_volume, needs_notification, status, updated_at"
        )
        .eq("user_id", user.id)
        .eq("mal_id", entry.malId)
        .maybeSingle();
      existing = data;
      findError = error;
    } else {
      const { data, error } = await supabase
        .from("user_mangas")
        .select(
          "id, title, mal_id, source, source_id, image_url, source_url, total_volumes, current_volume, needs_notification, status, updated_at"
        )
        .eq("user_id", user.id)
        .eq("source", entry.source)
        .eq("source_id", entry.sourceId)
        .maybeSingle();
      existing = data;
      findError = error;
    }

    if (findError) {
      setError(findError.message);
      return;
    }

    if (existing) {
      const newOwned = Math.max(ownedVolumes, existing.current_volume ?? 0);
      const { data: updated, error: updateError } = await supabase
        .from("user_mangas")
        .update({
          current_volume: newOwned,
          total_volumes: entry.totalVolumes ?? existing.total_volumes,
          image_url: entry.image ?? existing.image_url,
          source_url: entry.url ?? existing.source_url,
          source: entry.source ?? existing.source,
          source_id: entry.sourceId ?? existing.source_id,
          mal_id: entry.malId ?? existing.mal_id,
        })
        .eq("id", existing.id)
        .select()
        .maybeSingle();

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setEntries((prev) =>
        prev.map((item) => (item.id === existing.id ? mapRow(updated) : item))
      );
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("user_mangas")
      .insert({
        user_id: user.id,
        title: entry.title,
        mal_id: entry.malId,
        source: entry.source,
        source_id: entry.sourceId,
        image_url: entry.image,
        source_url: entry.url,
        total_volumes: entry.totalVolumes,
        current_volume: Math.max(0, ownedVolumes),
        status: "reading",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setEntries((prev) => [mapRow(inserted), ...prev]);
  };

  const updateOwned = async (id: string, ownedVolumes: number) => {
    setError(null);
    const { data: updated, error: updateError } = await supabase
      .from("user_mangas")
      .update({ current_volume: Math.max(0, ownedVolumes) })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (updated) {
      setEntries((prev) => prev.map((item) => (item.id === id ? mapRow(updated) : item)));
    }
  };

  const updateStatus = async (id: string, status: MangaEntry["status"]) => {
    setError(null);
    const { data: updated, error: updateError } = await supabase
      .from("user_mangas")
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (updated) {
      setEntries((prev) => prev.map((item) => (item.id === id ? mapRow(updated) : item)));
    }
  };

  const removeEntry = async (id: string) => {
    setError(null);
    const { error: deleteError } = await supabase.from("user_mangas").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const value = useMemo(
    () => ({ entries, loading, error, addEntry, updateOwned, updateStatus, removeEntry }),
    [entries, loading, error]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error("useCollection must be used within CollectionProvider");
  return ctx;
}
