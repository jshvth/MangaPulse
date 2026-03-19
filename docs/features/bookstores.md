**Nearby Bookstores**

**Scope**
- Find bookstores near the user’s location

**Current State**
- Uses **OpenStreetMap + Overpass API** (no API key required).
- Search radius: **15km**.
- Displays name, address (when available), and distance.
- Includes a direct OpenStreetMap link.

**Key UI**
- “Use my location” button on Manga Detail.

**Limitations**
- Overpass instances can rate-limit or be temporarily unavailable.
- No live stock availability; it only finds store locations.

**Alternatives**
- Google Maps Places API (requires paid key + billing).

**Next Steps**
- Add caching to reduce Overpass calls.
- Add store type filters or search by keyword.
