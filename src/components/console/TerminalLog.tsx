"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface LogEntry {
  id: number;
  timestamp: string;
  level: "INFO" | "FETCH" | "RAG" | "LLM" | "TOOL" | "SUCCESS" | "ERROR";
  message: string;
}

const levelStyles: Record<LogEntry["level"], string> = {
  INFO: "text-slate-400",
  FETCH: "text-cyan-400",
  RAG: "text-purple-400",
  LLM: "text-yellow-400",
  TOOL: "text-orange-400",
  SUCCESS: "text-emerald-400",
  ERROR: "text-red-400",
};

const levelBadge: Record<LogEntry["level"], string> = {
  INFO: "bg-slate-800 text-slate-300",
  FETCH: "bg-cyan-950 text-cyan-300",
  RAG: "bg-purple-950 text-purple-300",
  LLM: "bg-yellow-950 text-yellow-300",
  TOOL: "bg-orange-950 text-orange-300",
  SUCCESS: "bg-emerald-950 text-emerald-300",
  ERROR: "bg-red-950 text-red-300",
};

interface TerminalLogProps {
  logs: LogEntry[];
  isScanning: boolean;
}

export default function TerminalLog({ logs, isScanning }: TerminalLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 font-mono text-sm text-slate-400">
            agentic_scanner — console
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isScanning && (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="font-mono text-xs text-emerald-400">LIVE</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Log body */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {logs.length === 0 && (
          <div className="text-slate-600 text-center mt-8">
            <p>▶ Aguardando início do scan...</p>
            <p className="mt-1 text-slate-700">Pressione &quot;Scan Architecture&quot; para iniciar</p>
          </div>
        )}
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 leading-relaxed"
            >
              <span className="shrink-0 text-slate-600">[{log.timestamp}]</span>
              <span className={`shrink-0 rounded px-1 text-[10px] font-bold uppercase ${levelBadge[log.level]}`}>
                {log.level}
              </span>
              <span className={levelStyles[log.level]}>{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Blinking cursor */}
        {isScanning && (
          <motion.span
            className="inline-block h-4 w-2 bg-emerald-400 ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
