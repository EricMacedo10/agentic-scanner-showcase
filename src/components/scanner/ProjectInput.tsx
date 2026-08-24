"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderSearch, X, Zap, AlertCircle } from "lucide-react";
import { type NodeStatus } from "@/components/neural/NeuralScanner";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DynamicNode {
  id: string;
  angle: number;
  label: string;
  sub: string;
  icon: string;
  color: string;
}

export interface ScanResult {
  projectName: string;
  description: string;
  nodes: DynamicNode[];
}

interface ProjectInputProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (result: ScanResult, logs: string[]) => void;
}

// ─── Loading Messages ─────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Validando caminho do projeto...",
  "Mapeando estrutura de arquivos...",
  "Lendo package.json, requirements.txt...",
  "Analisando arquivos de configuração...",
  "Enviando contexto para o LLM...",
  "DeepSeek V3 analisando a arquitetura...",
  "Identificando nós do pipeline agêntico...",
  "Enriquecendo nós com cores e posições orbitais...",
  "Finalizando análise...",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProjectInput({ isOpen, onClose, onScanComplete }: ProjectInputProps) {
  const [projectPath, setProjectPath] = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [error, setError]             = useState<string | null>(null);

  // Cycle through loading messages while waiting for the API
  function cycleMessages() {
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[i % LOADING_MESSAGES.length]);
      i++;
    }, 1800);
    return interval;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectPath.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setLoadingMsg(LOADING_MESSAGES[0]);
    const timer = cycleMessages();

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: projectPath.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Erro desconhecido ao escanear o projeto.");
        return;
      }

      onScanComplete(
        {
          projectName: data.projectName,
          description: data.description,
          nodes: data.nodes,
        },
        data.logs ?? []
      );
      onClose();
    } catch {
      setError("Não foi possível conectar à API. Verifique se o servidor está rodando.");
    } finally {
      clearInterval(timer);
      setIsLoading(false);
      setLoadingMsg("");
    }
  }

  // Quick-fill example paths
  const EXAMPLES = [
    {
      label: "Trilha dos Juros",
      path: String.raw`c:\Users\ericm\OneDrive\Área de Trabalho\PESSOAL\RH CVs\Trilha dos Juros`,
    },
    {
      label: "Titanium Bot",
      path: String.raw`c:\Users\ericm\OneDrive\Área de Trabalho\PESSOAL\Titanium`,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,2,8,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative w-full max-w-lg rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, rgba(15,12,40,0.98) 0%, rgba(5,4,20,0.98) 100%)",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 0 60px rgba(124,58,237,0.2), 0 0 20px rgba(0,0,0,0.8)",
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all disabled:opacity-30"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}>
                <FolderSearch size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Scan Real Project</h2>
                <p className="text-xs" style={{ color: "rgba(139,92,246,0.8)" }}>
                  Análise de arquitetura com IA · DeepSeek
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wider uppercase">
                  Caminho do Projeto
                </label>
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => { setProjectPath(e.target.value); setError(null); }}
                  placeholder={String.raw`C:\Users\ericm\...\MeuProjeto`}
                  disabled={isLoading}
                  className="w-full rounded-lg px-4 py-3 text-sm font-mono text-slate-200 outline-none transition-all disabled:opacity-50"
                  style={{
                    background: "rgba(0,2,8,0.7)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    caretColor: "#a78bfa",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.15)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";  e.currentTarget.style.boxShadow = "none"; }}
                />

                {/* Quick-fill buttons */}
                <div className="flex gap-2 mt-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      type="button"
                      onClick={() => { setProjectPath(ex.path); setError(null); }}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] transition-all disabled:opacity-30"
                      style={{
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        color: "rgba(165,180,252,0.8)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                    >
                      <Zap size={9} />
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
                  >
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading state */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
                  >
                    <motion.div
                      className="h-4 w-4 shrink-0 rounded-full border-2"
                      style={{ borderColor: "rgba(167,139,250,0.3)", borderTopColor: "#a78bfa" }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-xs" style={{ color: "#a78bfa" }}>{loadingMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info box */}
              {!isLoading && !error && (
                <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", color: "rgba(165,180,252,0.6)" }}>
                  💡 O scanner irá ler os arquivos do projeto localmente e usar IA para identificar a arquitetura agêntica. Sua chave DeepSeek é usada apenas nesta máquina.
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading || !projectPath.trim()}
                whileHover={{ scale: (!isLoading && projectPath.trim()) ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: (!isLoading && projectPath.trim()) ? "0 0 24px rgba(124,58,237,0.45)" : "none",
                }}
              >
                {isLoading ? "Analisando com IA..." : "🧠 Analyze with AI"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
