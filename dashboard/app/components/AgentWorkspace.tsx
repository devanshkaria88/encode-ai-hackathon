"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDashboardStore, AgentRun } from "@/lib/store";

// ─── Graph Data ────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  icon: string;
  color: string;
  group: "governance" | "treasury" | "security" | "comms" | "knowledge" | "utility";
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

const NODES: GraphNode[] = [
  // Governance cluster (left-center)
  { id: "get_active_proposals",    label: "Active Proposals",    icon: "📋", color: "#3b82f6", group: "governance", x: 160, y: 120 },
  { id: "get_proposal_detail",     label: "Proposal Detail",     icon: "📄", color: "#3b82f6", group: "governance", x: 80,  y: 260 },
  { id: "get_voting_status",       label: "Voting Status",       icon: "🗳", color: "#06b6d4", group: "governance", x: 240, y: 280 },
  { id: "get_member_vote_history", label: "Vote History",        icon: "👤", color: "#06b6d4", group: "governance", x: 140, y: 400 },

  // Treasury cluster (top-right)
  { id: "get_treasury_summary",       label: "Treasury Summary",  icon: "💰", color: "#10b981", group: "treasury", x: 500, y: 80  },
  { id: "get_treasury_transactions",  label: "Transactions",      icon: "📊", color: "#10b981", group: "treasury", x: 640, y: 180 },

  // Security cluster (right-center)
  { id: "get_token_transfers", label: "Token Transfers", icon: "🔗", color: "#f59e0b", group: "security", x: 680, y: 340 },
  { id: "get_wallet_profile",  label: "Wallet Profile",  icon: "🔍", color: "#f59e0b", group: "security", x: 540, y: 420 },

  // Communications (bottom-center)
  { id: "send_group_message",  label: "Group Message",  icon: "💬", color: "#10b981", group: "comms", x: 340, y: 520 },
  { id: "send_direct_message", label: "Direct Message", icon: "✉️", color: "#10b981", group: "comms", x: 500, y: 560 },

  // Knowledge (bottom-left)
  { id: "get_knowledge",   label: "Get Knowledge",   icon: "🧠", color: "#a78bfa", group: "knowledge", x: 100, y: 540 },
  { id: "store_knowledge", label: "Store Knowledge", icon: "💾", color: "#a78bfa", group: "knowledge", x: 200, y: 620 },

  // Utility (center / bottom-right)
  { id: "query_data",     label: "Query Data",     icon: "⚡", color: "#06b6d4", group: "utility", x: 400, y: 300 },
  { id: "generate_chart", label: "Generate Chart", icon: "📈", color: "#3b82f6", group: "utility", x: 620, y: 520 },
  { id: "log_action",     label: "Log Action",     icon: "📝", color: "#555568", group: "utility", x: 400, y: 680 },
];

const EDGES: GraphEdge[] = [
  // Governance flow
  { from: "get_active_proposals", to: "get_proposal_detail" },
  { from: "get_active_proposals", to: "get_voting_status" },
  { from: "get_proposal_detail", to: "get_voting_status" },
  { from: "get_voting_status", to: "get_member_vote_history" },
  // Governance -> comms
  { from: "get_member_vote_history", to: "send_direct_message" },
  { from: "get_voting_status", to: "send_group_message" },
  { from: "get_active_proposals", to: "send_group_message" },
  // Treasury flow
  { from: "get_treasury_summary", to: "get_treasury_transactions" },
  { from: "get_treasury_summary", to: "generate_chart" },
  { from: "get_treasury_transactions", to: "generate_chart" },
  { from: "get_treasury_summary", to: "send_group_message" },
  // Security flow
  { from: "get_token_transfers", to: "get_wallet_profile" },
  { from: "get_treasury_transactions", to: "get_token_transfers" },
  { from: "get_wallet_profile", to: "send_group_message" },
  { from: "get_token_transfers", to: "send_group_message" },
  // Knowledge flow
  { from: "get_knowledge", to: "store_knowledge" },
  { from: "get_knowledge", to: "send_group_message" },
  { from: "store_knowledge", to: "log_action" },
  // Cross-domain
  { from: "query_data", to: "send_group_message" },
  { from: "query_data", to: "generate_chart" },
  { from: "get_active_proposals", to: "query_data" },
  { from: "get_treasury_summary", to: "query_data" },
  // Comms -> log
  { from: "send_group_message", to: "log_action" },
  { from: "send_direct_message", to: "log_action" },
  { from: "generate_chart", to: "send_group_message" },
  // Knowledge -> comms
  { from: "get_member_vote_history", to: "send_group_message" },
  { from: "get_proposal_detail", to: "send_group_message" },
];

const NODE_RADIUS = 26;

// ─── Pan / Zoom Canvas ─────────────────────────────────────────────

function useCanvas() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const pinchDist = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.003;
      setScale((prev) => Math.min(3, Math.max(0.2, prev + delta)));
    } else {
      setOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (dist - pinchDist.current) * 0.005;
      pinchDist.current = dist;
      setScale((prev) => Math.min(3, Math.max(0.2, prev + delta)));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    pinchDist.current = null;
  }, []);

  const resetView = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  }, []);

  return {
    offset, scale,
    onPointerDown, onPointerMove, onPointerUp,
    onWheel,
    onTouchStart, onTouchMove, onTouchEnd,
    resetView, setScale,
  };
}

// ─── Tooltip ────────────────────────────────────────────────────────

function Tooltip({ node, run, x, y }: { node: GraphNode; run?: AgentRun; x: number; y: number }) {
  const steps = run?.steps.filter((s) => s.tool === node.id) ?? [];
  const lastStep = steps[steps.length - 1];

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{ left: x + 36, top: y - 10 }}
    >
      <div
        className="rounded-lg px-3 py-2 text-[10px] max-w-[220px] shadow-xl"
        style={{
          background: "#14141eee",
          border: `1px solid ${node.color}40`,
          boxShadow: `0 0 20px ${node.color}15`,
        }}
      >
        <div className="font-bold uppercase tracking-widest mb-1" style={{ color: node.color }}>
          {node.label}
        </div>
        {lastStep ? (
          <>
            <p className="text-[#8888a0] leading-relaxed">{lastStep.description}</p>
            {lastStep.status === "complete" && lastStep.result && (
              <pre className="text-[#555568] mt-1 max-h-16 overflow-hidden text-[8px] leading-relaxed">
                {truncate(lastStep.result)}
              </pre>
            )}
          </>
        ) : (
          <p className="text-[#555568]">Not visited in this run</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function AgentWorkspace() {
  const runs = useDashboardStore((s) => s.runs);
  const activeRunId = useDashboardStore((s) => s.activeRunId);
  const canvas = useCanvas();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const displayRun = runs.find((r) => r.id === activeRunId) || runs[runs.length - 1];

  const visitedSet = useMemo(() => {
    if (!displayRun) return new Set<string>();
    return new Set(displayRun.steps.map((s) => s.tool));
  }, [displayRun]);

  const activeNode = useMemo(() => {
    if (!displayRun || displayRun.status !== "running") return null;
    const running = displayRun.steps.find((s) => s.status === "running");
    return running?.tool ?? null;
  }, [displayRun]);

  const traversalPath = useMemo(() => {
    if (!displayRun) return [] as string[];
    return displayRun.steps.map((s) => s.tool);
  }, [displayRun]);

  // Build set of lit-up edges based on the traversal order
  const litEdges = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < traversalPath.length - 1; i++) {
      const from = traversalPath[i];
      const to = traversalPath[i + 1];
      // Check if a direct edge exists
      const direct = EDGES.find(
        (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      if (direct) {
        set.add(`${from}->${to}`);
      } else {
        set.add(`${from}~>${to}`);
      }
    }
    return set;
  }, [traversalPath]);

  const nodeMap = useMemo(() => {
    const m: Record<string, GraphNode> = {};
    NODES.forEach((n) => (m[n.id] = n));
    return m;
  }, []);

  const hoveredGraphNode = hoveredNode ? nodeMap[hoveredNode] : null;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-sm shrink-0 z-20 relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-semibold text-[#555568] uppercase tracking-widest">
              Agent Neural Graph
            </h2>
            <p className="text-[10px] text-[#555568] mt-0.5">
              {displayRun
                ? `${visitedSet.size}/${NODES.length} nodes visited · ${displayRun.steps.length} steps`
                : "All tool nodes shown · path lights up on agent run"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {displayRun && (
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                  displayRun.status === "running"
                    ? "bg-cyan-500/15 text-cyan-400"
                    : displayRun.status === "complete"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {displayRun.status}
              </span>
            )}
            <div className="flex items-center gap-1 bg-[#111118] rounded-md border border-[#1e1e2e] overflow-hidden">
              <button
                onClick={() => canvas.setScale((s) => Math.min(3, s + 0.15))}
                className="px-2 py-1 text-[10px] text-[#8888a0] hover:text-white hover:bg-[#1a1a24] transition-colors"
              >+</button>
              <span className="text-[9px] text-[#555568] px-1 min-w-[36px] text-center">
                {Math.round(canvas.scale * 100)}%
              </span>
              <button
                onClick={() => canvas.setScale((s) => Math.max(0.2, s - 0.15))}
                className="px-2 py-1 text-[10px] text-[#8888a0] hover:text-white hover:bg-[#1a1a24] transition-colors"
              >-</button>
            </div>
          </div>
        </div>

        {runs.length > 1 && (
          <div className="flex gap-1 mt-2 overflow-x-auto">
            {runs.map((r, i) => (
              <button
                key={r.id}
                onClick={() => useDashboardStore.setState({ activeRunId: r.id })}
                className={`text-[9px] px-2 py-0.5 rounded-md border transition-colors shrink-0 cursor-pointer ${
                  r.id === displayRun?.id
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-[#1e1e2e] text-[#555568] hover:border-[#2d2d42]"
                }`}
              >
                Run {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        style={{ background: "#08080d", touchAction: "none" }}
        onPointerDown={canvas.onPointerDown}
        onPointerMove={canvas.onPointerMove}
        onPointerUp={canvas.onPointerUp}
        onWheel={canvas.onWheel}
        onTouchStart={canvas.onTouchStart}
        onTouchMove={canvas.onTouchMove}
        onTouchEnd={canvas.onTouchEnd}
        onDoubleClick={canvas.resetView}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${canvas.offset.x}px, ${canvas.offset.y}px) scale(${canvas.scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            width="800"
            height="780"
            className="overflow-visible"
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <defs>
              <filter id="glow-edge">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-node">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background edges (all connections, dim) */}
            {EDGES.map((edge, i) => {
              const fromNode = nodeMap[edge.from];
              const toNode = nodeMap[edge.to];
              if (!fromNode || !toNode) return null;

              const edgeKey = `${edge.from}->${edge.to}`;
              const reverseKey = `${edge.to}->${edge.from}`;
              const isLit = litEdges.has(edgeKey) || litEdges.has(reverseKey);

              return (
                <line
                  key={i}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isLit ? "#ffffff" : "#1e1e2e"}
                  strokeWidth={isLit ? 2 : 0.5}
                  opacity={isLit ? 0.6 : 0.4}
                  filter={isLit ? "url(#glow-edge)" : undefined}
                />
              );
            })}

            {/* Traversal path: animated dashed line following the agent's sequence */}
            {traversalPath.length > 1 &&
              traversalPath.slice(0, -1).map((fromId, i) => {
                const toId = traversalPath[i + 1];
                const fromN = nodeMap[fromId];
                const toN = nodeMap[toId];
                if (!fromN || !toN) return null;

                const isActive =
                  displayRun?.status === "running" &&
                  i === traversalPath.length - 2;

                return (
                  <g key={`path-${i}`}>
                    <line
                      x1={fromN.x}
                      y1={fromN.y}
                      x2={toN.x}
                      y2={toN.y}
                      stroke={toN.color}
                      strokeWidth={2.5}
                      opacity={0.7}
                      strokeDasharray={isActive ? "6 4" : "none"}
                      filter="url(#glow-edge)"
                    >
                      {isActive && (
                        <animate
                          attributeName="stroke-dashoffset"
                          values="20;0"
                          dur="0.6s"
                          repeatCount="indefinite"
                        />
                      )}
                    </line>
                    {isActive && (
                      <circle r="3" fill={toN.color} opacity="0.9">
                        <animateMotion
                          dur="0.8s"
                          repeatCount="indefinite"
                          path={`M${fromN.x},${fromN.y} L${toN.x},${toN.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
          </svg>

          {/* Nodes rendered as HTML over the SVG */}
          {NODES.map((node) => {
            const isVisited = visitedSet.has(node.id);
            const isActive = activeNode === node.id;
            const stepIndex = traversalPath.indexOf(node.id);
            const isDim = !isVisited && !isActive;

            return (
              <div
                key={node.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: node.x - NODE_RADIUS,
                  top: node.y - NODE_RADIUS,
                  width: NODE_RADIUS * 2,
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node circle */}
                <div
                  className="flex items-center justify-center rounded-full relative select-none"
                  style={{
                    width: NODE_RADIUS * 2,
                    height: NODE_RADIUS * 2,
                    background: isActive
                      ? `radial-gradient(circle at 40% 35%, ${node.color}60, ${node.color}20)`
                      : isVisited
                      ? `radial-gradient(circle at 40% 35%, ${node.color}40, ${node.color}10)`
                      : `radial-gradient(circle at 40% 35%, #1a1a2480, #11111840)`,
                    border: `2px solid ${
                      isActive
                        ? node.color
                        : isVisited
                        ? node.color + "80"
                        : "#1e1e2e"
                    }`,
                    boxShadow: isActive
                      ? `0 0 30px ${node.color}50, 0 0 60px ${node.color}20, inset 0 0 20px ${node.color}15`
                      : isVisited
                      ? `0 0 16px ${node.color}25`
                      : "none",
                    transition: "all 0.4s ease",
                  }}
                >
                  <span
                    className="text-sm relative z-10"
                    style={{ filter: isDim ? "grayscale(1) opacity(0.3)" : "none" }}
                  >
                    {node.icon}
                  </span>

                  {/* Active ping */}
                  {isActive && (
                    <span
                      className="absolute inset-[-4px] rounded-full animate-ping"
                      style={{
                        border: `1.5px solid ${node.color}`,
                        opacity: 0.3,
                      }}
                    />
                  )}

                  {/* Step order badge */}
                  {isVisited && stepIndex >= 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{
                        backgroundColor: node.color,
                        color: "#000",
                        boxShadow: `0 0 8px ${node.color}60`,
                      }}
                    >
                      {stepIndex + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-[8px] mt-1 text-center leading-tight uppercase tracking-wider font-semibold whitespace-nowrap"
                  style={{
                    color: isActive
                      ? node.color
                      : isVisited
                      ? node.color + "cc"
                      : "#333344",
                    transition: "color 0.4s ease",
                  }}
                >
                  {node.label}
                </span>
              </div>
            );
          })}

          {/* Tooltip */}
          {hoveredGraphNode && (
            <Tooltip
              node={hoveredGraphNode}
              run={displayRun}
              x={hoveredGraphNode.x}
              y={hoveredGraphNode.y}
            />
          )}
        </div>

        {/* Legend (fixed position) */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 bg-[#0a0a0f]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#1e1e2e] z-30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "radial-gradient(circle, #ffffff60, #ffffff20)", border: "1.5px solid #ffffff" }} />
            <span className="text-[8px] text-[#8888a0] uppercase tracking-wider">Currently Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "radial-gradient(circle, #10b98140, #10b98110)", border: "1.5px solid #10b98180" }} />
            <span className="text-[8px] text-[#8888a0] uppercase tracking-wider">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "radial-gradient(circle, #1a1a2480, #11111840)", border: "1.5px solid #1e1e2e" }} />
            <span className="text-[8px] text-[#8888a0] uppercase tracking-wider">Unvisited</span>
          </div>
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#1e1e2e]">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#ffffff" strokeWidth="2" opacity="0.5" /></svg>
            <span className="text-[8px] text-[#8888a0] uppercase tracking-wider">Traversal Path</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#1e1e2e" strokeWidth="1" /></svg>
            <span className="text-[8px] text-[#8888a0] uppercase tracking-wider">Possible Edge</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function truncate(result: unknown): string {
  const str = typeof result === "string" ? result : JSON.stringify(result, null, 1);
  return str.length > 200 ? str.slice(0, 200) + "..." : str;
}
