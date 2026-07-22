"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Play, RotateCcw, BrainCircuit } from "lucide-react";
import TerminalLog, { type LogEntry } from "@/components/console/TerminalLog";
import { type NodeStatus, type NodeDef } from "@/components/neural/NeuralScanner";

const NeuralScanner = dynamic(
  () => import("@/components/neural/NeuralScanner"),
  { ssr: false }
);

// ─── Showcase Script (Trilha dos Juros - AI Analyzed) ─────────────────────────
type ScanStep = {
  nodeId: string;
  relDelay: number;
  processingMs: number;
  logs: Omit<LogEntry, "id">[];
};

function buildShowcaseScript(): ScanStep[] {
  // Using the exact IDs defined in NeuralScanner.tsx DEFAULT_NODES
  const nodes = ["trigger", "fetch", "process", "store", "api", "ui"];
  
  const templates: Record<string, Omit<LogEntry, "id" | "timestamp">[]> = {
    "trigger": [
      { level: "INFO",    message: "Agentic Scanner iniciado. Analisando arquitetura..." },
      { level: "INFO",    message: `Gatilho detectado (AWS EventBridge) → Request_ID #${Date.now().toString(36).toUpperCase()}` },
    ],
    "fetch": [
      { level: "FETCH",   message: "Instanciando Python Scrapers..." },
      { level: "FETCH",   message: "Conectando ao Tesouro Direto e BCB... OK (14.2 kb)" },
    ],
    "process": [
      { level: "RAG",     message: "Enviando dados para Python Processing Engines..." },
      { level: "RAG",     message: "Calculando curva de juros e indicadores..." },
    ],
    "store": [
      { level: "TOOL",    message: "Conectando ao AWS DynamoDB (NoSQL)..." },
      { level: "TOOL",    message: "Persistindo time-series data... ✓" },
    ],
    "api": [
      { level: "LLM",     message: "AWS Lambda function invocada..." },
      { level: "LLM",     message: "Formatando payload JSON para distribuição... ✓" },
    ],
    "ui": [
      { level: "SUCCESS", message: "Vercel Frontend atualizado com sucesso ✅" },
      { level: "INFO",    message: "Pipeline completo. Infraestrutura pronta." },
    ],
  };

  const delays = [300, 900, 1100, 1200, 1000, 800];
  const processing = [700, 950, 1000, 1100, 800, 700];

  return nodes.map((id, i) => ({
    nodeId: id,
    relDelay: delays[i] ?? 800,
    processingMs: processing[i] ?? 800,
    logs: templates[id].map((l) => ({ ...l, timestamp: "" })) as Omit<LogEntry, "id">[],
  }));
}
// ─────────────────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toLocaleTimeString("pt-BR", { hour12: false });
}

export default function HomePage() {
  const [statuses,   setStatuses]   = useState<Record<string, NodeStatus>>({});
  const [logs,       setLogs]       = useState<LogEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDone,     setIsDone]     = useState(false);

  const appendLogs = useCallback((newLogs: Omit<LogEntry, "id">[], baseId: number) => {
    const stamped = newLogs.map((l, i) => ({ ...l, id: baseId + i, timestamp: ts() }));
    setLogs((prev) => [...prev, ...stamped]);
    return baseId + newLogs.length;
  }, []);

  const runScan = useCallback(async () => {
    if (isScanning) return;
    const script = buildShowcaseScript();

    setIsScanning(true);
    setIsDone(false);
    setStatuses({});
    
    // Initial intro log
    setLogs([{
      id: 0, timestamp: ts(), level: "INFO", 
      message: "Análise IA carregada: Trilha dos Juros (AWS + Python + Vercel)" 
    }]);
    let id = 1;

    for (const step of script) {
      await new Promise((r) => setTimeout(r, step.relDelay));
      setStatuses((prev) => ({ ...prev, [step.nodeId]: "running" }));
      id = appendLogs(step.logs, id);
      await new Promise((r) => setTimeout(r, step.processingMs));
      setStatuses((prev) => ({ ...prev, [step.nodeId]: "done" }));
    }

    setIsScanning(false);
    setIsDone(true);
  }, [isScanning, appendLogs]);

  const reset = useCallback(() => {
    setStatuses({});
    setLogs([]);
    setIsDone(false);
    setIsScanning(false);
  }, []);

  const completedCount = Object.values(statuses).filter((s) => s === "done").length;
  const totalNodes = 6;
  const progress = Math.round((completedCount / totalNodes) * 100);

  return (
    <main
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: "#000208", color: "#f8fafc" }}
    >
      {/* ── Header ── */}
      <header
        className="flex flex-col md:flex-row shrink-0 items-center justify-between px-5 py-3 gap-3 md:gap-0"
        style={{
          background: "rgba(5,4,20,0.85)",
          borderBottom: "1px solid rgba(139,92,246,0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.6)" }}
          >
            <BrainCircuit size={18} className="text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-xs sm:text-sm font-bold tracking-wide" style={{ color: "#e2e8f0" }}>
              Agentic Workflow Scanner
              <span className="hidden sm:inline" style={{ color: "#a78bfa", fontWeight: 400 }}> · Trilha dos Juros</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] tracking-widest uppercase" style={{ color: "rgba(139,92,246,0.7)" }}>
              AI-Analyzed Architecture Showcase
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
          {/* Progress */}
          {(isScanning || isDone) && (
            <div className="flex items-center gap-2 mr-1">
              <div className="h-1 w-24 rounded-full overflow-hidden" style={{ background: "rgba(148,163,184,0.12)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #7c3aed, #22d3ee)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-xs" style={{ color: "rgba(148,163,184,0.6)" }}>{progress}%</span>
            </div>
          )}

          {/* Reset */}
          {(isDone || logs.length > 0) && (
            <button
              onClick={reset}
              disabled={isScanning}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all disabled:opacity-30"
              style={{ border: "1px solid rgba(148,163,184,0.15)", color: "rgba(148,163,184,0.6)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.4)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; e.currentTarget.style.color = "rgba(148,163,184,0.6)"; }}
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}

          {/* Demo Scan */}
          <motion.button
            onClick={runScan}
            disabled={isScanning}
            whileHover={{ scale: isScanning ? 1 : 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: isScanning ? "none" : "0 0 18px rgba(124,58,237,0.5)",
            }}
          >
            {isScanning ? (
              <>
                <motion.div
                  className="h-4 w-4 rounded-full border-2"
                  style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                />
                Scanning...
              </>
            ) : (
              <>
                <Play size={13} />
                Scan Trilha dos Juros
              </>
            )}
          </motion.button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Neural Scanner Container */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <NeuralScanner
            activeStatuses={statuses}
            isScanning={isScanning}
            projectName="Trilha dos Juros"
          />
        </div>

        {/* Console Container */}
        <div className="w-full h-[220px] md:h-auto md:w-80 flex-1 md:flex-none min-h-0 shrink-0 p-3 overflow-hidden border-t md:border-t-0 md:border-l border-purple-500/20">
          <TerminalLog logs={logs} isScanning={isScanning} />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer
        className="shrink-0 flex flex-col sm:flex-row items-center justify-between px-5 py-2 gap-1 sm:gap-0 text-center sm:text-left"
        style={{
          borderTop: "1px solid rgba(139,92,246,0.12)",
          background: "rgba(5,4,20,0.7)",
          fontSize: 10,
          color: "rgba(100,100,140,0.7)",
        }}
      >
        <span>
          Nodes: {completedCount}/{totalNodes} concluídos
          {isDone && <span style={{ marginLeft: 8, color: "#34d399", fontWeight: 700 }}>· Pipeline OK ✓</span>}
        </span>
        <span className="hidden sm:inline">
          🤖 AI-Analyzed Architecture · Next.js · TypeScript · Framer Motion
        </span>
      </footer>
    </main>
  );
}
