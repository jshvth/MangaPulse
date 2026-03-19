import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    storage: {
      getItem: (key) => {
        if (typeof window === "undefined") return null;
        const remember = window.localStorage.getItem("mp_remember") !== "0";
        const storage = remember ? window.localStorage : window.sessionStorage;
        return storage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === "undefined") return;
        const remember = window.localStorage.getItem("mp_remember") !== "0";
        const storage = remember ? window.localStorage : window.sessionStorage;
        storage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      },
    },
    persistSession: true,
    autoRefreshToken: true,
  },
});
