**Auth**

**Scope**
- Sign up, sign in, sign out
- Session management and protected routes

**Current State**
- Implemented with Supabase Auth.
- Frontend blocks access to Collection/Community/Profile when not authed.
- Email confirmation can be required before sign-in.
- Remember me toggle uses localStorage vs sessionStorage.

**Key UI**
- `AuthPage` for email/password login.
- Top nav shows the signed-in email.

**Data / Services**
- Supabase Auth users table (managed by Supabase).

**Limitations**
- No magic-link or OAuth yet.
- Email confirmations depend on Supabase Auth settings and redirect URLs.

**Next Steps**
- Add password reset flow.
- Consider OAuth providers (GitHub/Google) for easier demo access.
- Add a resend-confirmation CTA on the confirm page.
