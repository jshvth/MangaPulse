**Notifications**

**Scope**
- Notify users when new releases are detected or due

**Current State**
- In-app notifications via **Pulse** badge and dropdown.
- Queue stored in `notification_queue`.
- Edge Function can send via Resend if a verified domain exists.
- Ethereal test sender available locally for demo/testing.

**Data / Tables**
- `notification_queue`
- `user_mangas.needs_notification`

**Limitations**
- **Resend email** requires a verified domain for reliable sending.
- Ethereal emails are test-only (not real inbox delivery).

**Alternatives**
- Use Ethereal for demo/testing (`mcp-server/src/send-ethereal.ts`).

**Next Steps**
- Verify a domain and enable Resend in production.
- Add “mark as read” or notification history.
 - Expose Ethereal preview URLs in a dev-only UI panel.
