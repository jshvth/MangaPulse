**Volume Checklist**

**Scope**
- Track exactly which volumes the user owns

**Current State**
- Per-volume ownership stored in `user_manga_volumes`.
- Detail page shows a selectable grid of volumes.
- Supports “select all” and clear actions.

**Data / Tables**
- `user_manga_volumes` (user_manga_id + volume)

**Limitations**
- No bulk import (e.g. list of volumes) yet.

**Next Steps**
- Add quick input for ranges (e.g. 1-4, 8-10).
- Add “mark missing gaps” UX.
