import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function Ultra() {
  const engine = useAudioEngine();
  const isActive = engine.ultraActive;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: isActive
            ? "rgba(255,215,0,0.12)"
            : "rgba(255,165,0,0.08)",
          border: `1px solid ${isActive ? "rgba(255,215,0,0.5)" : "rgba(255,165,0,0.3)"}`,
        }}
      >
        <div
          className="text-sm font-bold uppercase tracking-widest"
          style={{
            color: isActive ? "#ffd700" : "#ffa500",
            textShadow: isActive ? "0 0 12px rgba(255,215,0,0.5)" : "none",
          }}
        >
          ULTRA
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "rgba(255,215,0,0.5)" }}
        >
          SYSTEM AUTHORITY
        </div>
      </div>

      {/* Power Indicator */}
      <div className="flex items-center justify-center gap-3 py-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{
            background: isActive ? "#ffd700" : "rgba(255,215,0,0.15)",
            boxShadow: isActive
              ? "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)"
              : "none",
            animation: isActive ? "pulse 1s ease-in-out infinite" : "none",
          }}
          data-ocid="ultra.power_indicator"
        />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: isActive ? "#ffd700" : "rgba(255,165,0,0.5)" }}
        >
          {isActive ? "ULTRA ACTIVE" : "ULTRA BYPASSED"}
        </span>
      </div>

      {/* Command Chain Display */}
      <div
        className="px-3 py-3 rounded space-y-2"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,215,0,0.15)",
        }}
        data-ocid="ultra.command_chain"
      >
        <div
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(255,215,0,0.6)" }}
        >
          COMMAND CHAIN
        </div>
        {[
          { label: "ULTRA", active: isActive, isTop: true },
          { label: "SRL", active: isActive },
          { label: "VOLUME + CROSSOVER", active: isActive },
          { label: "EPICENTER", active: isActive },
        ].map((node, i) => (
          <div key={node.label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className="w-4 flex-shrink-0 text-center"
                style={{
                  color: isActive
                    ? "rgba(255,215,0,0.4)"
                    : "rgba(255,165,0,0.2)",
                }}
              >
                ↓
              </div>
            )}
            {i === 0 && <div className="w-4 flex-shrink-0" />}
            <div
              className="flex-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest"
              style={{
                background: node.isTop
                  ? isActive
                    ? "rgba(255,215,0,0.2)"
                    : "rgba(255,165,0,0.1)"
                  : isActive
                    ? "rgba(0,212,255,0.08)"
                    : "rgba(0,0,0,0.2)",
                border: `1px solid ${
                  node.isTop
                    ? isActive
                      ? "rgba(255,215,0,0.5)"
                      : "rgba(255,165,0,0.3)"
                    : isActive
                      ? "rgba(0,212,255,0.3)"
                      : "rgba(0,212,255,0.1)"
                }`,
                color: node.isTop
                  ? isActive
                    ? "#ffd700"
                    : "#ffa500"
                  : isActive
                    ? "#00d4ff"
                    : "rgba(0,212,255,0.4)",
              }}
            >
              {node.label}
            </div>
          </div>
        ))}
      </div>

      {/* Characteristics */}
      <div
        className="px-3 py-2 rounded text-center"
        style={{
          background: "rgba(255,215,0,0.05)",
          border: "1px solid rgba(255,215,0,0.1)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,215,0,0.5)" }}
        >
          OVERALL SYSTEM AUTHORITY
        </div>
      </div>

      {/* Warning when bypassed */}
      {!isActive && (
        <div
          className="px-3 py-3 rounded text-center"
          style={{
            background: "rgba(255,165,0,0.1)",
            border: "1px solid rgba(255,165,0,0.5)",
            boxShadow: "0 0 12px rgba(255,165,0,0.2)",
          }}
          data-ocid="ultra.bypass_warning"
        >
          <div
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "#ffa500" }}
          >
            ⚠ ALL OUTPUT MUTED
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: "rgba(255,165,0,0.7)" }}
          >
            ULTRA BYPASSED
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => engine.setUltraActive(!isActive)}
        className="w-full py-3 rounded font-bold uppercase tracking-widest text-sm transition-smooth"
        style={{
          background: isActive
            ? "rgba(255,215,0,0.15)"
            : "rgba(255,165,0,0.08)",
          border: `1px solid ${isActive ? "rgba(255,215,0,0.6)" : "rgba(255,165,0,0.4)"}`,
          color: isActive ? "#ffd700" : "#ffa500",
          boxShadow: isActive ? "0 0 15px rgba(255,215,0,0.3)" : "none",
        }}
        data-ocid="ultra.toggle_button"
        aria-label={
          isActive ? "Bypass Ultra authority" : "Enable Ultra authority"
        }
      >
        {isActive
          ? "⬛ ULTRA ACTIVE — CLICK TO BYPASS"
          : "▶ ENABLE ULTRA AUTHORITY"}
      </button>
    </div>
  );
}
