"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type NodeStatus = "idle" | "running" | "done" | "error";

export interface AgentNodeData {
  label: string;
  description: string;
  icon: string;
  status: NodeStatus;
  step: number;
}

const statusStyles: Record<NodeStatus, string> = {
  idle: "border-slate-600/50 bg-slate-900/60 text-slate-400",
  running: "border-blue-500 bg-blue-950/60 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]",
  done: "border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
  error: "border-red-500 bg-red-950/60 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
};

const statusDotStyles: Record<NodeStatus, string> = {
  idle: "bg-slate-600",
  running: "bg-blue-400 animate-pulse",
  done: "bg-emerald-400",
  error: "bg-red-400",
};

const AgentNode = ({ data }: NodeProps<AgentNodeData>) => {
  const isRunning = data.status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: data.step * 0.1 }}
      className={cn(
        "relative w-52 rounded-xl border-2 p-4 backdrop-blur-md transition-all duration-500",
        statusStyles[data.status]
      )}
    >
      {/* Glow ring when running */}
      {isRunning && (
        <motion.div
          className="absolute -inset-0.5 rounded-xl border-2 border-blue-400 opacity-60"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Step badge */}
      <div className="absolute -top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-xs font-bold text-slate-300">
        {data.step}
      </div>

      {/* Status dot */}
      <div className={cn("absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-slate-900", statusDotStyles[data.status])} />

      {/* Content */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{data.icon}</span>
        <span className="font-semibold text-sm leading-tight">{data.label}</span>
      </div>
      <p className="text-xs opacity-70 leading-snug">{data.description}</p>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-600 !border-slate-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-600 !border-slate-500 !w-3 !h-3"
      />
    </motion.div>
  );
};

export default memo(AgentNode);
