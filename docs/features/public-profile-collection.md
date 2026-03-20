**Public Profile Collection**

**Scope**
- Show a signed-in user a read-only view of another collector’s manga shelf.

**Current State**
- Public profile page displays the user’s collection cards (cover, progress, status).
- Visible only to authenticated users; anonymous visitors see a sign-in prompt.
- Uses `user_mangas` with read-only policy for authenticated users.

**Data / Tables**
- `user_mangas`
- Policy: `user_mangas_select_authenticated`

**Limitations**
- No filtering or sorting on public shelves yet.
- No deep-link to full manga detail pages (read-only view only).

**Next Steps**
- Add filters (status / completion / last updated).
- Add lightweight read-only detail view.
