import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NodeDef {
  id: string;
  angle: number;
  label: string;
  sub: string;
  icon: string;
  color: string;
}

interface ScanResponse {
  projectName: string;
  description: string;
  nodes: NodeDef[];
  logs: string[];
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", "__pycache__", ".vercel",
  "dist", "build", ".cache", "venv", ".venv", "env",
]);

const PRIORITY_FILES = [
  "package.json", "requirements.txt", "pyproject.toml",
  "README.md", "README.txt", ".env.example",
  "main.py", "app.py", "agent.py", "pipeline.py", "workflow.py",
  "index.ts", "index.js", "server.ts", "server.js",
  "next.config.js", "next.config.ts",
];

const MAX_FILE_CHARS = 2000;
const MAX_CONTEXT_CHARS = 12000;

// Fixed hexagonal orbital angles for up to 6 nodes
const ORBITAL_ANGLES = [270, 330, 30, 90, 150, 210];

// Neon color palette for dynamic nodes
const NODE_COLORS = [
  "#fbbf24", // amber  (Trigger)
  "#22d3ee", // cyan   (Data)
  "#c084fc", // purple (Memory/RAG)
  "#f472b6", // pink   (LLM)
  "#fb923c", // orange (Tool)
  "#34d399", // emerald(Output)
];

// ─── File System Utilities ────────────────────────────────────────────────────
function buildFileTree(dirPath: string, depth = 0, maxDepth = 2): string {
  if (depth > maxDepth) return "";
  let tree = "";
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const indent = "  ".repeat(depth);
      if (entry.isDirectory()) {
        tree += `${indent}📁 ${entry.name}/\n`;
        tree += buildFileTree(path.join(dirPath, entry.name), depth + 1, maxDepth);
      } else {
        tree += `${indent}📄 ${entry.name}\n`;
      }
    }
  } catch {
    // Skip unreadable directories
  }
  return tree;
}

function readPriorityFiles(dirPath: string): string {
  let content = "";

  // Search recursively for priority files (max 3 levels)
  function search(currentPath: string, level: number) {
    if (level > 3) return;
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          search(fullPath, level + 1);
        } else if (PRIORITY_FILES.includes(entry.name)) {
          try {
            const raw = fs.readFileSync(fullPath, "utf8");
            const snippet = raw.slice(0, MAX_FILE_CHARS);
            content += `\n\n=== ${path.relative(dirPath, fullPath)} ===\n${snippet}`;
            if (content.length > MAX_CONTEXT_CHARS) return;
          } catch {
            // Skip unreadable files
          }
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  search(dirPath, 0);
  return content.slice(0, MAX_CONTEXT_CHARS);
}

// ─── LLM Analysis ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior AI Solutions Architect. Your job is to analyze a software project and identify its agentic/AI workflow components.

Given a project's file tree and key file contents, you will:
1. Identify the main pipeline stages (up to 6 nodes)
2. Return a structured JSON describing the agentic architecture

RULES:
- Return ONLY valid JSON, no markdown, no explanation
- Maximum 6 nodes, minimum 3
- Node IDs must be unique short strings (e.g. "trigger", "fetch", "rag", "llm", "tool", "output")
- Icons must be single emoji characters
- Labels max 20 chars, sub-labels max 30 chars
- Be specific to THIS project (mention real tech found: Next.js, Python, Supabase, etc.)

JSON SCHEMA:
{
  "projectName": "string (max 40 chars)",
  "description": "string (max 100 chars, what this project does)",
  "nodes": [
    {
      "id": "string",
      "label": "string (max 20 chars)",
      "sub": "string (max 30 chars, tech/detail)",
      "icon": "single emoji"
    }
  ]
}`;

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<ScanResponse>> {
  const logs: string[] = [];

  try {
    // 1. Parse request
    const body = await req.json();
    const projectPath: string = body.projectPath?.trim() ?? "";

    if (!projectPath) {
      return NextResponse.json({ projectName: "", description: "", nodes: [], logs, error: "Caminho do projeto não informado." }, { status: 400 });
    }

    // 2. Validate path exists
    logs.push(`📂 Validando caminho: ${projectPath}`);
    if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
      return NextResponse.json({ projectName: "", description: "", nodes: [], logs, error: `Diretório não encontrado: ${projectPath}` }, { status: 404 });
    }

    // 3. Read file tree
    logs.push("🌲 Mapeando estrutura de arquivos...");
    const fileTree = buildFileTree(projectPath);

    // 4. Read priority file contents
    logs.push("📄 Lendo arquivos-chave do projeto...");
    const fileContents = readPriorityFiles(projectPath);

    // 5. Call DeepSeek
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const model  = process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || "deepseek-chat";

    if (!apiKey || apiKey === "sk-your-key-here") {
      return NextResponse.json({
        projectName: "", description: "", nodes: [], logs,
        error: "DEEPSEEK_API_KEY não configurada. Edite o arquivo .env.local e reinicie o servidor.",
      }, { status: 500 });
    }

    logs.push(`🧠 Enviando para DeepSeek (${model})...`);
    const client = new OpenAI({ 
      apiKey,
      baseURL: "https://api.deepseek.com" 
    });

    const userMessage = `PROJECT FILE TREE:\n${fileTree}\n\nKEY FILE CONTENTS:${fileContents}`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const rawJson = completion.choices[0]?.message?.content ?? "{}";
    logs.push(`✅ LLM respondeu. Tokens: ${completion.usage?.total_tokens ?? "?"}`);

    // 6. Parse LLM response
    const parsed = JSON.parse(rawJson) as {
      projectName?: string;
      description?: string;
      nodes?: { id: string; label: string; sub: string; icon: string }[];
    };

    if (!parsed.nodes?.length) {
      return NextResponse.json({ projectName: "", description: "", nodes: [], logs, error: "O LLM não conseguiu identificar nós no projeto." }, { status: 422 });
    }

    // 7. Enrich nodes with angles + colors (hexagonal layout)
    const enrichedNodes: NodeDef[] = parsed.nodes
      .slice(0, 6)
      .map((n, i) => ({
        id:    n.id    ?? `node_${i}`,
        label: n.label ?? `Step ${i + 1}`,
        sub:   n.sub   ?? "",
        icon:  n.icon  ?? "⚙️",
        angle: ORBITAL_ANGLES[i],
        color: NODE_COLORS[i],
      }));

    logs.push(`🚀 ${enrichedNodes.length} nós identificados com sucesso.`);

    return NextResponse.json({
      projectName: parsed.projectName ?? path.basename(projectPath),
      description: parsed.description ?? "Projeto analisado com sucesso.",
      nodes: enrichedNodes,
      logs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    logs.push(`❌ Erro: ${message}`);
    return NextResponse.json({ projectName: "", description: "", nodes: [], logs, error: message }, { status: 500 });
  }
}
