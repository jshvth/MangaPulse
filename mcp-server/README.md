# MCP Server

Lokaler MCP-Server mit Tools fuer Datenbankzugriff, Jikan API und Dateisystem.

## Voraussetzungen

Setze diese Umgebungsvariablen:

- `SUPABASE_DB_URL` (Postgres Connection String)
- `MCP_WORKSPACE_ROOT` (optional, Standard: Repo-Root)

Beispiel: `mcp-server/.env.example`

## Build & Start

```bash
npm install
npm run build
node dist/index.js
```

## VS Code MCP Config (Template)

Es gibt ein Template unter `.vscode/mcp.json`.
Passe `SUPABASE_DB_URL` und `MCP_WORKSPACE_ROOT` an.

## Tools (Kurzuebersicht)

- `db_list_tables`
- `db_query`
- `jikan_search`
- `read_file`
- `write_file`
- `list_dir`
