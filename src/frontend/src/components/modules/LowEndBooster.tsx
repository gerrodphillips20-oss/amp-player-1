import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function LowEndBooster() {
  const engine = useAudioEngine();
  const { canisterActive, canisterBottomBoost, canisterPunchBoost } = engine;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#ffd700" }}
        >
          SYSTEM HEALTH
        </div>
        <div
          className="text-xs mt-0.5 font-mono"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          CANISTER STATUS &bull; LOW-END COVERAGE CONFIRMED
        </div>
      </div>

      {/* Canister Coverage Badge */}
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
        style={{
          background: "rgba(0,255,136,0.12)",
          border: "1px solid rgba(0,255,136,0.4)",
          color: "#00ff88",
        }}
        data-ocid="system_health.canister_badge"
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#00ff88" }}
        />
        CANISTER ACTIVE — HANDLING ALL LOW-END LANES
      </div>

      {/* Lane Coverage */}
      <div className="space-y-2">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded"
          style={{
            background: canisterActive
              ? "rgba(0,255,136,0.08)"
              : "rgba(0,0,0,0.3)",
            border: `1px solid ${canisterActive ? "rgba(0,255,136,0.4)" : "rgba(0,212,255,0.15)"}`,
          }}
          data-ocid="system_health.lane1"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: canisterActive ? "#00ff88" : "rgba(0,255,136,0.2)",
              boxShadow: canisterActive ? "0 0 8px #00ff88" : "none",
            }}
          />
          <div className="flex-1">
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{
                color: canisterActive ? "#00ff88" : "rgba(0,212,255,0.5)",
              }}
            >
              14–40Hz BOTTOM NOTE — CANISTER SLIDER 1
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="flex-1 h-1.5 rounded overflow-hidden"
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                <div
                  className="h-full rounded"
                  style={{
                    width: `${canisterBottomBoost}%`,
                    background: "#00ff88",
                  }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: "#00ff88" }}>
                {canisterBottomBoost}%
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded"
          style={{
            background: canisterActive
              ? "rgba(0,212,255,0.08)"
              : "rgba(0,0,0,0.3)",
            border: `1px solid ${canisterActive ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.15)"}`,
          }}
          data-ocid="system_health.lane2"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: canisterActive ? "#00d4ff" : "rgba(0,212,255,0.2)",
              boxShadow: canisterActive ? "0 0 8px #00d4ff" : "none",
            }}
          />
          <div className="flex-1">
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{
                color: canisterActive ? "#00d4ff" : "rgba(0,212,255,0.5)",
              }}
            >
              14–80Hz PUNCH — CANISTER SLIDER 2
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="flex-1 h-1.5 rounded overflow-hidden"
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                <div
                  className="h-full rounded"
                  style={{
                    width: `${canisterPunchBoost}%`,
                    background: "#00d4ff",
                  }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: "#00d4ff" }}>
                {canisterPunchBoost}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rule Book Status */}
      <div
        className="p-2 rounded"
        style={{
          background: "rgba(0,212,255,0.04)",
          border: "1px solid rgba(0,212,255,0.12)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest mb-1.5"
          style={{ color: "rgba(0,212,255,0.7)" }}
        >
          RULE BOOK STATUS
        </div>
        {[
          { label: "GAINS AT 0.0 OR UNITY", ok: true },
          { label: "NO WAVE SHAPERS", ok: true },
          { label: "NO STACKING", ok: true },
          { label: "OLD LIMITER DELETED", ok: true },
          { label: "CANISTER COVERS LOW-END", ok: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 py-0.5">
            <span
              style={{
                color: item.ok ? "#00ff88" : "#ff4444",
                fontSize: "0.7rem",
              }}
            >
              {item.ok ? "✓" : "✗"}
            </span>
            <span
              className="text-xs"
              style={{
                color: item.ok ? "rgba(0,255,136,0.7)" : "rgba(255,68,68,0.8)",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
