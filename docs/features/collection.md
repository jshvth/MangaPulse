**Collection**

**Scope**
- Store a user’s manga series
- Track progress, status, total volumes

**Current State**
- Persisted in `user_mangas` (Supabase Postgres).
- UI shows cards, progress, and status.
- Entries are user-owned and filtered by RLS policies.

**Key UI**
- Collection grid with add/remove actions.
- Status updates (reading, planning, completed, etc.).

**Data / Tables**
- `user_mangas` (core collection state)

**Limitations**
- Bulk import/export not implemented.
- No advanced filtering/sorting yet.

**Next Steps**
- Add filters (status, completion, last updated).
- Add CSV export/import.
