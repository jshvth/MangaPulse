**Community**

**Scope**
- Discover other collectors and follow them

**Current State**
- Search profiles by **name** or **city**.
- Follow/unfollow from search results.
- Public profile view with followers count + follow button.
- When signed in, you can preview another collector’s shelf.
- Profile page shows followers + following lists.
- Profiles are auto-created on signup (display name seeded).
- Search uses normalized fields (accent-insensitive) for better matches.
- Search falls back to raw display names if normalized fields are missing.

**Data / Tables**
- `user_profiles`
- `user_follows`
- `user_mangas` (read-only for public shelf previews)

**Limitations**
- No mutual/friends view yet.
- No privacy controls for follower visibility.

**Next Steps**
- Add “Mutuals” badge.
- Add pagination for large result sets.
