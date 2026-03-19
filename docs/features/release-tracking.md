**Release Tracking**

**Scope**
- Track new volumes and upcoming release dates
- Show latest releases and upcoming announcements

**Current State**
- `manga_releases` stores detected releases (volume + date + source).
- Detail page shows last 10 releases and upcoming entries.
- Manual upcoming release entry supported.

**Data / Tables**
- `manga_releases`
- `user_mangas.needs_notification` + `last_notified_at`

**Limitations**
- Some series lack reliable release dates from public APIs.

**Next Steps**
- Add “Upcoming Releases” section in collection list.
- Add per-volume calendar view.
