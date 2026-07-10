"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import AgentNode, { type AgentNodeData, type NodeStatus } from "./nodes/AgentNode";

// Defined outside component to prevent recreation on every render (React Flow best practice)
const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
};

export interface FlowStep {
  nodeId: string;
  status: NodeStatus;
}

interface AgenticFlowProps {
  activeStatuses: Record<string, NodeStatus>;
}

const INITIAL_NODES: Node<AgentNodeData>[] = [
  {
    id: "trigger",
    type: "agentNode",
    position: { x: 20, y: 160 },
    data: {
      step: 1,
      label: "Trigger",
      description: "Nova solicitação detectada. Iniciando pipeline agêntico.",
      icon: "⚡",
      status: "idle",
    },
  },
  {
    id: "fetch",
    type: "agentNode",
    position: { x: 280, y: 40 },
    data: {
      step: 2,
      label: "Data Retrieval",
      description: "Consumindo APIs externas: BCB, Tesouro, RSS Feeds.",
      icon: "🌐",
      status: "idle",
    },
  },
  {
    id: "rag",
    type: "agentNode",
    position: { x: 280, y: 280 },
    data: {
      step: 3,
      label: "Vector DB (RAG)",
      description: "Buscando embeddings relevantes. Supabase pgvector.",
      icon: "🗄️",
      status: "idle",
    },
  },
  {
    id: "llm",
    type: "agentNode",
    position: { x: 560, y: 160 },
    data: {
      step: 4,
      label: "LLM Engine",
      description: "Processando contexto injetado. GPT-4o / Gemini.",
      icon: "🧠",
      status: "idle",
    },
  },
  {
    id: "tool",
    type: "agentNode",
    position: { x: 820, y: 160 },
    data: {
      step: 5,
      label: "Tool Execution",
      description: "Executando ações: gerar JSON, postar, notificar.",
      icon: "⚙️",
      status: "idle",
    },
  },
  {
    id: "output",
    type: "agentNode",
    position: { x: 1080, y: 160 },
    data: {
      step: 6,
      label: "Output",
      description: "Pipeline concluído. Resultado entregue ao cliente.",
      icon: "✅",
      status: "idle",
    },
  },
];

const EDGES: Edge[] = [
  {
    id: "e-trigger-fetch",
    source: "trigger",
    target: "fetch",
    animated: true,
    style: { stroke: "#475569", strokeWidth: 2 },
  },
  {
    id: "e-trigger-rag",
    source: "trigger",
    target: "rag",
    animated: true,
    style: { stroke: "#475569", strokeWidth: 2 },
  },
  {
    id: "e-fetch-llm",
    source: "fetch",
    target: "llm",
    animated: true,
    style: { stroke: "#475569", strokeWidth: 2 },
  },
  {
    id: "e-rag-llm",
    source: "rag",
    target: "llm",
    animated: true,
    style: { stroke: "#475569", strokeWidth: 2 },
  },
  {
    id: "e-llm-tool",
    source: "llm",
    target: "tool",
    animated: true,
    style: { stroke: "#475569", strokeWidth: 2 },
  },
  {
    id: "e-tool-output",
    source: "tool",
    target: "output",
    animated: true,
    style: { stroke: "#475569", strokeWidth: 2 },
  },
];

export default function AgenticFlow({ activeStatuses }: AgenticFlowProps) {
  const nodes = useMemo<Node<AgentNodeData>[]>(
    () =>
      INITIAL_NODES.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: activeStatuses[n.id] ?? "idle",
        },
      })),
    [activeStatuses]
  );

  const getEdgeStyle = useCallback(
    (edgeId: string) => {
      const activeEdges: Record<string, string> = {
        "e-trigger-fetch": "trigger",
        "e-trigger-rag": "trigger",
        "e-fetch-llm": "fetch",
        "e-rag-llm": "rag",
        "e-llm-tool": "llm",
        "e-tool-output": "tool",
      };
      const sourceNode = activeEdges[edgeId];
      const status = sourceNode ? (activeStatuses[sourceNode] ?? "idle") : "idle";
      if (status === "running")
        return { stroke: "#3b82f6", strokeWidth: 3 };
      if (status === "done")
        return { stroke: "#10b981", strokeWidth: 2 };
      return { stroke: "#475569", strokeWidth: 2 };
    },
    [activeStatuses]
  );

  const styledEdges = useMemo<Edge[]>(
    () =>
      EDGES.map((e) => ({
        ...e,
        style: getEdgeStyle(e.id),
        animated: activeStatuses[e.source ?? ""] === "running" || activeStatuses[e.source ?? ""] === "done",
      })),
    [activeStatuses, getEdgeStyle]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      attributionPosition="bottom-left"
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="#334155"
      />
      <Controls className="!bg-slate-900 !border-slate-700 !text-slate-300" />
    </ReactFlow>
  );
}
