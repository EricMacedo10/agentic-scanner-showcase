"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

export type NodeStatus = "idle" | "running" | "done" | "error";

// ─── SVG ViewBox Constants ────────────────────────────────────────────────────
const VW = 800;
const VH = 500;
const CX = VW / 2;   // 400
const CY = VH / 2;   // 250
const R  = 178;       // orbital radius

// ─── Node Definitions ─────────────────────────────────────────────────────────
export interface NodeDef {
  id: string;
  angle: number; // SVG degrees (0=right, 90=down, 270=top)
  label: string;
  sub: string;
  icon: string;
  step?: number; // auto-assigned if missing
  color: string;
}

const DEFAULT_NODES: NodeDef[] = [
  { id: "trigger", angle: 270, label: "AWS EventBridge",  sub: "Cron Trigger",       icon: "🔔", color: "#fbbf24" },
  { id: "fetch",   angle: 330, label: "Python Scrapers",  sub: "Data Extraction",    icon: "📥", color: "#22d3ee" },
  { id: "process", angle: 30,  label: "Python Engines",   sub: "Data Processing",    icon: "⚙️", color: "#c084fc" },
  { id: "store",   angle: 90,  label: "DynamoDB",         sub: "NoSQL Storage",      icon: "💾", color: "#f472b6" },
  { id: "api",     angle: 150, label: "AWS Lambda",       sub: "Serverless API",     icon: "🌐", color: "#fb923c" },
  { id: "ui",      angle: 210, label: "Vercel Frontend",  sub: "User Interface",     icon: "📊", color: "#34d399" },
];

// ─── Deterministic Starfield (no hydration mismatch) ─────────────────────────
function makeStars(count: number) {
  let s = 98765;
  const r = () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
  return Array.from({ length: count }, () => ({
    x: r() * VW, y: r() * VH,
    radius: r() * 1.3 + 0.2,
    opacity: r() * 0.55 + 0.1,
    dur: r() * 4 + 2,
    delay: r() * 6,
  }));
}
const STARS = makeStars(80);

// ─── Math Helpers ─────────────────────────────────────────────────────────────
function polar(angleDeg: number, r = R) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

/** Quadratic bezier with perpendicular curve offset for elegance */
function curvePath(nx: number, ny: number): string {
  const dx = CX - nx;
  const dy = CY - ny;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const mx = (nx + CX) / 2;
  const my = (ny + CY) / 2;
  const qx = mx + (-dy / len) * len * 0.22;
  const qy = my + (dx  / len) * len * 0.22;
  return `M ${nx.toFixed(1)} ${ny.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${CX} ${CY}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  activeStatuses: Record<string, NodeStatus>;
  isScanning: boolean;
  nodes?: NodeDef[];        // dynamic nodes from LLM (overrides defaults)
  projectName?: string;     // shown in the idle hint
}

export default function NeuralScanner({ activeStatuses, isScanning, nodes: propNodes, projectName }: Props) {
  const anyActive = Object.keys(activeStatuses).length > 0;
  // Use LLM-provided nodes if available, otherwise fall back to hardcoded demo nodes
  const NODES: NodeDef[] = (propNodes && propNodes.length > 0 ? propNodes : DEFAULT_NODES).map((n, i) => ({ ...n, step: n.step ?? i + 1 }));

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 45%, #0f0c35 0%, #05040f 55%, #000208 100%)" }}
    >
      {/* Fixed-aspect inner canvas (guarantees SVG ↔ HTML alignment) */}
      <div
        className="relative"
        style={{
          width: "min(100%, calc((100dvh - 100px) * 8 / 5))",
          aspectRatio: `${VW} / ${VH}`,
        }}
      >

        {/* ── SVG Layer: Stars · Rings · Connections · Particles ── */}
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          {/* Stars */}
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.radius} fill="white" opacity={s.opacity}>
              <animate
                attributeName="opacity"
                values={`${s.opacity};${s.opacity * 0.15};${s.opacity}`}
                dur={`${s.dur}s`}
                begin={`${s.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* Decorative orbital rings */}
          <circle cx={CX} cy={CY} r={R + 30} fill="none" stroke="rgba(99,102,241,0.05)" strokeWidth="1.5" strokeDasharray="4 12" />
          <circle cx={CX} cy={CY} r={R}      fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="0.8" strokeDasharray="8 14" />

          {/* Brain aura rings */}
          <circle cx={CX} cy={CY} r={52} fill="rgba(139,92,246,0.07)" stroke="rgba(167,139,250,0.22)" strokeWidth="0.8" />
          <circle cx={CX} cy={CY} r={36} fill="rgba(139,92,246,0.12)" stroke="rgba(167,139,250,0.35)" strokeWidth="0.5" />

          {/* Hex node markers on the orbital ring */}
          {NODES.map((node) => {
            const { x, y } = polar(node.angle, R);
            return (
              <circle
                key={node.id + "-marker"}
                cx={x} cy={y} r={6}
                fill="rgba(15,12,40,0.9)"
                stroke={activeStatuses[node.id] && activeStatuses[node.id] !== "idle"
                  ? node.color : "rgba(99,102,241,0.3)"}
                strokeWidth="1.2"
                style={{ transition: "stroke 0.5s ease" }}
              />
            );
          })}

          {/* Connection paths */}
          {NODES.map((node) => {
            const { x, y } = polar(node.angle);
            const path = curvePath(x, y);
            const status = activeStatuses[node.id] ?? "idle";
            const isRunning = status === "running";
            const isDone    = status === "done";
            const isActive  = isRunning || isDone;

            return (
              <g key={node.id}>
                {/* Dim base line */}
                <path d={path} fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="1.5" />

                {/* Glowing active line */}
                {isActive && (
                  <path
                    d={path}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={isRunning ? 2.5 : 1.4}
                    opacity={isDone ? 0.5 : 1}
                    style={{ filter: `drop-shadow(0 0 6px ${node.color}) drop-shadow(0 0 2px ${node.color})` }}
                  />
                )}

                {/* Running: double particle stream (node → brain) */}
                {isRunning && (
                  <>
                    <circle r="5" fill={node.color} style={{ filter: `drop-shadow(0 0 8px ${node.color})` }}>
                      <animateMotion dur="0.7s" repeatCount="indefinite" path={path} />
                    </circle>
                    <circle r="2.5" fill="white" opacity="0.95">
                      <animateMotion dur="0.7s" repeatCount="indefinite" path={path} begin="0.22s" />
                    </circle>
                    <circle r="4" fill={node.color} opacity="0.5" style={{ filter: `drop-shadow(0 0 5px ${node.color})` }}>
                      <animateMotion dur="0.7s" repeatCount="indefinite" path={path} begin="0.44s" />
                    </circle>
                  </>
                )}

                {/* Done: gentle reverse pulse (brain → node) */}
                {isDone && (
                  <circle r="3" fill={node.color} opacity="0.55">
                    <animateMotion
                      dur="2.2s"
                      repeatCount="indefinite"
                      path={path}
                      keyPoints="1;0"
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Scanning radar sweep */}
          {isScanning && (
            <>
              {/* Sweep line */}
              <line
                x1={CX} y1={CY}
                x2={CX} y2={CY - R - 35}
                stroke="rgba(99,102,241,0.45)"
                strokeWidth="1.5"
              >
                <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="3s" repeatCount="indefinite" />
              </line>
              {/* Sweep arc fill */}
              <path
                d={`M ${CX} ${CY} L ${CX} ${CY - R - 35} A ${R + 35} ${R + 35} 0 0 1 ${CX + (R + 35) * Math.sin(Math.PI / 6)} ${CY - (R + 35) * Math.cos(Math.PI / 6)} Z`}
                fill="rgba(99,102,241,0.04)"
              >
                <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="3s" repeatCount="indefinite" />
              </path>
            </>
          )}
        </svg>

        {/* ── Brain Core (HTML, centered) ── */}
        <div
          className="absolute"
          style={{
            left: `${(CX / VW) * 100}%`,
            top:  `${(CY / VH) * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <motion.div
            className="relative flex flex-col items-center justify-center"
            animate={isScanning ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 1.1, repeat: isScanning ? Infinity : 0, ease: "easeInOut" }}
          >
            {/* Outermost glow halo */}
            <div className="absolute rounded-full" style={{ width: 180, height: 180, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)", filter: "blur(20px)" }} />
            {/* Mid glow */}
            <div className="absolute rounded-full" style={{ width: 110, height: 110, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)", filter: "blur(10px)" }} />

            {/* Rotating outer border */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 100, height: 100,
                border: "1px dashed rgba(139,92,246,0.35)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            {/* Static inner ring */}
            <motion.div
              className="absolute rounded-full"
              style={{ width: 76, height: 76, border: "1px solid rgba(167,139,250,0.5)" }}
              animate={isScanning ? { borderColor: ["rgba(139,92,246,0.3)", "rgba(167,139,250,1)", "rgba(139,92,246,0.3)"] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />

            {/* Brain emoji */}
            <span
              className="text-6xl select-none relative"
              style={{
                filter: isScanning
                  ? "drop-shadow(0 0 22px rgba(167,139,250,1)) drop-shadow(0 0 44px rgba(139,92,246,0.8)) drop-shadow(0 0 66px rgba(99,102,241,0.4))"
                  : "drop-shadow(0 0 10px rgba(167,139,250,0.7))",
                transition: "filter 0.6s ease",
                zIndex: 2,
              }}
            >
              🧠
            </span>

            {/* Label */}
            <p className="relative text-[9px] mt-1.5 tracking-[0.3em] text-purple-400/75 uppercase font-semibold whitespace-nowrap" style={{ zIndex: 2 }}>
              Neural Core
            </p>
          </motion.div>
        </div>

        {/* ── Orbital Node Cards ── */}
        {NODES.map((node) => {
          const { x, y } = polar(node.angle);
          const leftPct = (x / VW) * 100;
          const topPct  = (y / VH) * 100;
          const status    = activeStatuses[node.id] ?? "idle";
          const isRunning = status === "running";
          const isDone    = status === "done";
          const isActive  = isRunning || isDone;

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (node.step ?? (i + 1)) * 0.1, type: "spring", stiffness: 160, damping: 14 }}
              className="absolute"
              style={{
                left: `${leftPct}%`,
                top:  `${topPct}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 20,
              }}
            >
              {/* Expanding sonar ring when running */}
              {isRunning && (
                <>
                  <motion.div
                    className="absolute rounded-full"
                    style={{ inset: -10, border: `2px solid ${node.color}` }}
                    animate={{ scale: [1, 2.2], opacity: [0.9, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute rounded-full"
                    style={{ inset: -10, border: `1px solid ${node.color}` }}
                    animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: 0.4 }}
                  />
                </>
              )}

              {/* Card */}
              <motion.div
                animate={isRunning ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={{ duration: 0.9, repeat: isRunning ? Infinity : 0 }}
                className="relative rounded-xl border text-center cursor-default"
                style={{
                  width: "clamp(110px, 19%, 148px)",
                  padding: "10px 12px",
                  borderColor: isActive ? `${node.color}90` : "rgba(148,163,184,0.1)",
                  background: isActive
                    ? `linear-gradient(135deg, ${node.color}20 0%, rgba(5,4,15,0.96) 100%)`
                    : "rgba(5,4,15,0.82)",
                  boxShadow: isActive
                    ? `0 0 32px ${node.color}35, 0 0 8px ${node.color}20, inset 0 0 16px ${node.color}08`
                    : "none",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.55s ease",
                }}
              >
                {/* Step badge */}
                <div
                  className="absolute -top-2.5 -left-2.5 h-5 w-5 rounded-full border flex items-center justify-center font-bold"
                  style={{
                    fontSize: 9,
                    borderColor: isActive ? `${node.color}` : "rgba(148,163,184,0.2)",
                    background: "rgba(5,4,15,0.98)",
                    color: isActive ? node.color : "#475569",
                    boxShadow: isActive ? `0 0 10px ${node.color}70` : "none",
                    transition: "all 0.5s ease",
                  }}
                >
                  {node.step}
                </div>

                {/* Live status dot */}
                <motion.div
                  className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full"
                  style={{
                    background: isRunning ? "#3b82f6" : isDone ? node.color : "#1e293b",
                    boxShadow: isRunning ? "0 0 10px #60a5fa" : isDone ? `0 0 10px ${node.color}` : "none",
                    border: "2px solid rgba(5,4,15,0.9)",
                    transition: "background 0.5s, box-shadow 0.5s",
                  }}
                  animate={isRunning ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.6, repeat: isRunning ? Infinity : 0 }}
                />

                {/* Icon */}
                <div className="text-2xl mb-1 leading-none">{node.icon}</div>

                {/* Label */}
                <p
                  className="font-bold leading-tight"
                  style={{
                    fontSize: 10,
                    color: isActive ? node.color : "#475569",
                    transition: "color 0.5s",
                  }}
                >
                  {node.label}
                </p>

                {/* Sub */}
                <p style={{ fontSize: 8.5, marginTop: 2, color: "rgba(148,163,184,0.4)", lineHeight: 1.3 }}>
                  {node.sub}
                </p>
              </motion.div>
            </motion.div>
          );
        })}

        {/* Idle hint */}
        {!isScanning && !anyActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute left-0 right-0 text-center uppercase tracking-widest pointer-events-none"
            style={{ bottom: "4%", fontSize: 9, color: "rgba(100,100,130,0.7)", zIndex: 5 }}
          >
            Pressione{" "}
            <span style={{ color: "rgba(139,92,246,0.9)" }}>Scan Architecture</span>{" "}
            para iniciar o pipeline
          </motion.p>
        )}
      </div>
    </div>
  );
}
