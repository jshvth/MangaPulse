import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import postgres from "postgres";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
const cwd = process.cwd();
const defaultRoot = path.basename(cwd) === "mcp-server" ? path.resolve(cwd, "..") : cwd;
const ROOT = path.resolve(process.env.MCP_WORKSPACE_ROOT ?? defaultRoot);
function resolveWorkspacePath(inputPath) {
    const fullPath = path.resolve(ROOT, inputPath);
    if (!fullPath.startsWith(ROOT + path.sep)) {
        throw new Error("Path is outside workspace root");
    }
    return fullPath;
}
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const sql = SUPABASE_DB_URL ? postgres(SUPABASE_DB_URL, { ssl: "require" }) : null;
const server = new Server({ name: "mcp-server", version: "0.1.0" }, { capabilities: { tools: {} } });
const tools = [
    {
        name: "db_list_tables",
        description: "List all tables in the public schema via direct DB connection.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "db_query",
        description: "Run a SQL query against Supabase (requires SUPABASE_DB_URL).",
        inputSchema: {
            type: "object",
            properties: { sql: { type: "string" } },
            required: ["sql"],
            additionalProperties: false,
        },
    },
    {
        name: "jikan_search",
        description: "Search manga titles via Jikan API.",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string" },
                limit: { type: "number", default: 5 },
            },
            required: ["title"],
            additionalProperties: false,
        },
    },
    {
        name: "read_file",
        description: "Read a file from the workspace.",
        inputSchema: {
            type: "object",
            properties: { path: { type: "string" } },
            required: ["path"],
            additionalProperties: false,
        },
    },
    {
        name: "write_file",
        description: "Write a file to the workspace.",
        inputSchema: {
            type: "object",
            properties: { path: { type: "string" }, content: { type: "string" } },
            required: ["path", "content"],
            additionalProperties: false,
        },
    },
    {
        name: "list_dir",
        description: "List a directory in the workspace.",
        inputSchema: {
            type: "object",
            properties: { path: { type: "string" } },
            required: ["path"],
            additionalProperties: false,
        },
    },
];
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "db_list_tables": {
                if (!sql)
                    throw new Error("Missing SUPABASE_DB_URL env var");
                const rows = await sql `
          select table_name
          from information_schema.tables
          where table_schema = 'public'
          order by table_name
        `;
                return {
                    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
                };
            }
            case "db_query": {
                if (!sql)
                    throw new Error("Missing SUPABASE_DB_URL env var");
                const query = String(args?.sql ?? "");
                if (!query)
                    throw new Error("Missing sql argument");
                const rows = await sql.unsafe(query);
                const limited = Array.isArray(rows) ? rows.slice(0, 200) : rows;
                const note = Array.isArray(rows) && rows.length > 200
                    ? `\n\nNote: truncated to 200 rows (total ${rows.length}).`
                    : "";
                return {
                    content: [{ type: "text", text: JSON.stringify(limited, null, 2) + note }],
                };
            }
            case "jikan_search": {
                const title = String(args?.title ?? "");
                const limit = Number(args?.limit ?? 5);
                if (!title)
                    throw new Error("Missing title argument");
                const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=${Number.isFinite(limit) ? limit : 5}`;
                const res = await fetch(url);
                if (!res.ok)
                    throw new Error(`Jikan request failed: ${res.status}`);
                const body = await res.json();
                return {
                    content: [{ type: "text", text: JSON.stringify(body?.data ?? [], null, 2) }],
                };
            }
            case "read_file": {
                const filePath = resolveWorkspacePath(String(args?.path ?? ""));
                const text = await fs.readFile(filePath, "utf8");
                return { content: [{ type: "text", text }] };
            }
            case "write_file": {
                const filePath = resolveWorkspacePath(String(args?.path ?? ""));
                const content = String(args?.content ?? "");
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content, "utf8");
                return {
                    content: [{ type: "text", text: `Wrote ${filePath}` }],
                };
            }
            case "list_dir": {
                const dirPath = resolveWorkspacePath(String(args?.path ?? ""));
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                const listing = entries.map((entry) => ({
                    name: entry.name,
                    type: entry.isDirectory() ? "dir" : "file",
                }));
                return {
                    content: [{ type: "text", text: JSON.stringify(listing, null, 2) }],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${message}` }] };
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
console.log("MCP server running on stdio");
// Graceful shutdown for db connection
process.on("SIGINT", async () => {
    if (sql)
        await sql.end({ timeout: 5 });
    process.exit(0);
});
