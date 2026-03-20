"use client";

import { useEffect, useRef } from "react";
import { useDashboardStore, LuffaMessage } from "@/lib/store";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function MessageBubble({ msg }: { msg: LuffaMessage }) {
  const isOutgoing = msg.type === "outgoing";

  return (
    <div className="animate-slide-in px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        {isOutgoing ? (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase tracking-wider">
            GovMind
          </span>
        ) : (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 uppercase tracking-wider">
            {msg.channel === "dm" ? "DM" : "Group"}
          </span>
        )}
        <span className="text-[9px] text-[var(--text-dim)]">
          {formatTime(msg.timestamp)}
        </span>
      </div>
      <p
        className={`text-[11px] leading-relaxed ${
          isOutgoing ? "text-emerald-300/90" : "text-[var(--text-secondary)]"
        }`}
      >
        {msg.text.length > 200 ? msg.text.slice(0, 200) + "..." : msg.text}
      </p>
    </div>
  );
}

export function LiveFeed() {
  const messages = useDashboardStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <div className="px-4 py-3 border-b border-[var(--border-dim)] shrink-0">
        <h2 className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-widest">
          Live Feed
        </h2>
        <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
          Luffa group messages
        </p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[var(--border-dim)]/50">
        {messages.length === 0 && (
          <div className="px-4 py-8 text-center">
            <div className="text-[var(--text-dim)] text-[11px]">
              Waiting for messages...
            </div>
            <div className="text-[var(--text-dim)] text-[9px] mt-1">
              Send a message in the Luffa group or trigger an action
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
