**Profile**

**Scope**
- Personal identity settings and favorites

**Current State**
- Profile fields: display name, city, country, bio, top 3 favorites.
- Avatar upload stored in Supabase Storage (`avatars` bucket).
- Public profile view available.

**Data / Tables**
- `user_profiles`
- Storage bucket: `avatars`

**Limitations**
- No profile cover image.
- No visibility controls (public/private per field).

**Next Steps**
- Add privacy settings.
- Add profile links (website, socials).
