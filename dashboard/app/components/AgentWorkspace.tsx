"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDashboardStore, AgentRun, ToolStep } from "@/lib/store";

const TOOL_ICONS: Record<string, string> = {
  get_active_proposals: "📋",
  get_proposal_detail: "📄",
  get_voting_status: "🗳",
  get_member_vote_history: "👤",
  get_treasury_summary: "💰",
  get_treasury_transactions: "📊",
  get_token_transfers: "🔗",
  get_wallet_profile: "🔍",
  query_data: "⚡",
  send_group_message: "💬",
  send_direct_message: "✉️",
  generate_chart: "📈",
  get_knowledge: "🧠",
  store_knowledge: "💾",
  log_action: "📝",
};

const TOOL_COLORS: Record<string, string> = {
  get_active_proposals: "#3b82f6",
  get_proposal_detail: "#3b82f6",
  get_voting_status: "#06b6d4",
  get_member_vote_history: "#06b6d4",
  get_treasury_summary: "#10b981",
  get_treasury_transactions: "#10b981",
  get_token_transfers: "#f59e0b",
  get_wallet_profile: "#f59e0b",
  query_data: "#06b6d4",
  send_group_message: "#10b981",
  send_direct_message: "#10b981",
  generate_chart: "#3b82f6",
  get_knowledge: "#a78bfa",
  store_knowledge: "#a78bfa",
  log_action: "#555568",
};

// ─── Pan / Zoom Canvas ──────────────────────────────────────────────

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
    offset,
    scale,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    resetView,
    setScale,
  };
}

// ─── Neuron Nodes ───────────────────────────────────────────────────

function NeuronNode({ step, index }: { step: ToolStep; index: number }) {
  const color = TOOL_COLORS[step.tool] || "#555568";
  const icon = TOOL_ICONS[step.tool] || "⚙️";
  const isRunning = step.status === "running";
  const isComplete = step.status === "complete";

  return (
    <div
      className="animate-slide-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Soma (cell body) */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-base relative"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color}30, ${color}08)`,
              border: `2px solid ${color}${isRunning ? "80" : "40"}`,
              boxShadow: isRunning
                ? `0 0 24px ${color}30, 0 0 48px ${color}10, inset 0 0 16px ${color}10`
                : isComplete
                ? `0 0 12px ${color}15`
                : "none",
            }}
          >
            <span className="relative z-10">{icon}</span>
            {isRunning && (
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ borderColor: color, border: `1px solid ${color}` }}
              />
            )}
          </div>
        </div>

        {/* Dendrite body */}
        <div
          className="flex-1 min-w-0 rounded-xl px-4 py-3 relative"
          style={{
            background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
            border: `1px solid ${color}${isRunning ? "35" : "18"}`,
            boxShadow: isRunning
              ? `0 4px 24px ${color}12`
              : "none",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color }}
            >
              {step.tool.replace(/_/g, " ")}
            </span>
            {isRunning && (
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full animate-pulse-dot" style={{ backgroundColor: color, animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full animate-pulse-dot" style={{ backgroundColor: color, animationDelay: "200ms" }} />
                <span className="w-1 h-1 rounded-full animate-pulse-dot" style={{ backgroundColor: color, animationDelay: "400ms" }} />
              </span>
            )}
            {isComplete && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-[11px] text-[#8888a0] mt-1 leading-relaxed">
            {step.description}
          </p>

          {isComplete && step.result && (
            <div
              className="mt-2 pt-2 text-[9px] text-[#555568] max-h-20 overflow-hidden leading-relaxed font-light"
              style={{ borderTop: `1px solid ${color}15` }}
            >
              {truncateResult(step.result)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Axon({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="flex items-center pl-[22px] h-8">
      <svg width="4" height="32" viewBox="0 0 4 32" className="overflow-visible">
        <line
          x1="2" y1="0" x2="2" y2="32"
          stroke={color}
          strokeWidth={active ? 2 : 1}
          strokeDasharray={active ? "none" : "3 4"}
          opacity={active ? 0.5 : 0.2}
        />
        {active && (
          <circle r="2" fill={color} opacity="0.8">
            <animateMotion
              dur="0.8s"
              repeatCount="indefinite"
              path="M2,0 L2,32"
            />
          </circle>
        )}
      </svg>
    </div>
  );
}

function TriggerNeuron({ trigger }: { trigger: string }) {
  const short = trigger.length > 80 ? trigger.slice(0, 80) + "..." : trigger;
  return (
    <div className="animate-slide-in flex items-start gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center relative"
          style={{
            background: "radial-gradient(circle at 35% 35%, #10b98130, #10b98108)",
            border: "2px solid #10b98150",
            boxShadow: "0 0 20px #10b98120, 0 0 40px #10b98108, inset 0 0 12px #10b98110",
          }}
        >
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <div
        className="flex-1 min-w-0 rounded-xl px-4 py-3"
        style={{
          background: "linear-gradient(135deg, #10b98108 0%, #10b98103 100%)",
          border: "1px solid #10b98125",
          boxShadow: "0 4px 24px #10b98108",
        }}
      >
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
          Signal Input
        </span>
        <p className="text-[11px] text-[#8888a0] mt-1 leading-relaxed">
          {short}
        </p>
      </div>
    </div>
  );
}

function ResponseNeuron({ response, status }: { response?: string; status: string }) {
  if (status === "running") {
    return (
      <div className="animate-slide-in flex items-start gap-4">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#2d2d42] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse-dot" />
          </div>
        </div>
        <div className="flex-1 rounded-xl px-4 py-4 border border-dashed border-[#2d2d42] bg-[#14141e] flex items-center gap-2">
          <span className="text-[11px] text-[#555568]">
            Processing signal...
          </span>
        </div>
      </div>
    );
  }

  const isError = status === "error";
  const c = isError ? "#ef4444" : "#10b981";

  return (
    <div className="animate-slide-in flex items-start gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${c}30, ${c}08)`,
            border: `2px solid ${c}50`,
            boxShadow: `0 0 20px ${c}20, 0 0 40px ${c}08`,
          }}
        >
          {isError ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div
        className="flex-1 min-w-0 rounded-xl px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${c}08 0%, ${c}03 100%)`,
          border: `1px solid ${c}25`,
        }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c }}>
          {isError ? "Signal Error" : "Output Signal"}
        </span>
        <p className="text-[11px] text-[#8888a0] mt-1 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin">
          {response && response.length > 600 ? response.slice(0, 600) + "..." : response}
        </p>
      </div>
    </div>
  );
}

function RunView({ run }: { run: AgentRun }) {
  const lastStepIdx = run.steps.length - 1;
  return (
    <div className="w-[520px]">
      <TriggerNeuron trigger={run.trigger} />

      {run.steps.map((step, i) => {
        const nextColor = TOOL_COLORS[step.tool] || "#555568";
        const isLast = i === lastStepIdx && run.status === "running";
        return (
          <div key={step.id}>
            <Axon color={nextColor} active={step.status === "running"} />
            <NeuronNode step={step} index={i} />
          </div>
        );
      })}

      {(run.status !== "running" || run.steps.length > 0) && (
        <>
          <Axon
            color={run.status === "error" ? "#ef4444" : "#10b981"}
            active={run.status === "running"}
          />
          <ResponseNeuron response={run.response} status={run.status} />
        </>
      )}

      {run.status === "running" && run.steps.length === 0 && (
        <>
          <Axon color="#06b6d4" active={true} />
          <ResponseNeuron status="running" />
        </>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function AgentWorkspace() {
  const runs = useDashboardStore((s) => s.runs);
  const activeRunId = useDashboardStore((s) => s.activeRunId);
  const canvas = useCanvas();
  const containerRef = useRef<HTMLDivElement>(null);

  const displayRun =
    runs.find((r) => r.id === activeRunId) || runs[runs.length - 1];

  // Auto-scroll the canvas down when new steps arrive
  useEffect(() => {
    if (displayRun?.status === "running" && displayRun.steps.length > 0) {
      const stepHeight = 100;
      const targetY = -(displayRun.steps.length * stepHeight - 200);
      // Only auto-pan if user hasn't dragged far
    }
  }, [displayRun?.steps.length, displayRun?.status]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header bar */}
      <div className="px-5 py-3 border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-sm shrink-0 z-20 relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-semibold text-[#555568] uppercase tracking-widest">
              Neural Workspace
            </h2>
            <p className="text-[10px] text-[#555568] mt-0.5">
              Pan: drag &middot; Zoom: scroll/pinch &middot; Reset: double-click
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
              >
                +
              </button>
              <span className="text-[9px] text-[#555568] px-1 min-w-[36px] text-center">
                {Math.round(canvas.scale * 100)}%
              </span>
              <button
                onClick={() => canvas.setScale((s) => Math.max(0.2, s - 0.15))}
                className="px-2 py-1 text-[10px] text-[#8888a0] hover:text-white hover:bg-[#1a1a24] transition-colors"
              >
                -
              </button>
            </div>
          </div>
        </div>

        {runs.length > 1 && (
          <div className="flex gap-1 mt-2 overflow-x-auto">
            {runs.map((r, i) => (
              <button
                key={r.id}
                onClick={() =>
                  useDashboardStore.setState({ activeRunId: r.id })
                }
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

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing dot-grid relative"
        onPointerDown={canvas.onPointerDown}
        onPointerMove={canvas.onPointerMove}
        onPointerUp={canvas.onPointerUp}
        onWheel={canvas.onWheel}
        onTouchStart={canvas.onTouchStart}
        onTouchMove={canvas.onTouchMove}
        onTouchEnd={canvas.onTouchEnd}
        onDoubleClick={canvas.resetView}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${canvas.offset.x}px, ${canvas.offset.y}px) scale(${canvas.scale})`,
            transformOrigin: "0 0",
            transition: "none",
          }}
        >
          <div className="p-10">
            {!displayRun ? (
              <div className="flex flex-col items-center justify-center gap-4 pt-40 pl-40">
                <div
                  className="w-20 h-20 rounded-full border-2 border-dashed border-[#2d2d42] flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-[#555568]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[13px] text-[#8888a0]">
                    Neural network idle
                  </p>
                  <p className="text-[10px] text-[#555568] mt-1">
                    Trigger an action to see the agent think
                  </p>
                </div>
              </div>
            ) : (
              <RunView run={displayRun} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function truncateResult(result: unknown): string {
  const str =
    typeof result === "string" ? result : JSON.stringify(result, null, 1);
  return str.length > 200 ? str.slice(0, 200) + "..." : str;
}
