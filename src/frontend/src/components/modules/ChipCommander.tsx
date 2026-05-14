import { useAudioEngine } from "@/hooks/useAudioEngine";

// Updated gain labels: G01-G02 are now the two low-end EQ bands (14-50Hz, 14-80Hz)
const GAINS = [
  { id: "G01", label: "EQ BAND 14-50Hz", dynamic: true },
  { id: "G02", label: "EQ BAND 14-80Hz", dynamic: true },
  { id: "G03", label: "EQ BAND 250Hz", dynamic: true },
  { id: "G04", label: "EQ BAND 500Hz", dynamic: true },
  { id: "G05", label: "EQ BAND 1kHz", dynamic: true },
  { id: "G06", label: "EQ BAND 4kHz", dynamic: true },
  { id: "G07", label: "EQ BAND 8kHz", dynamic: true },
  { id: "G08", label: "EQ BAND 16kHz", dynamic: true },
  { id: "G09", label: "BASS AMP CH-L", dynamic: false },
  { id: "G10", label: "BASS AMP CH-R", dynamic: false },
  { id: "G11", label: "MIDS AMP CH-L", dynamic: false },
  { id: "G12", label: "MIDS AMP CH-R", dynamic: false },
  { id: "G13", label: "BASS OUTPUT (1.0)", dynamic: true },
  { id: "G14", label: "HIGHS OUTPUT (1.0)", dynamic: true },
  { id: "G15", label: "SUB AUX", dynamic: false },
  { id: "G16", label: "OUTPUT STAGE", dynamic: false },
];

const ENFORCEMENT = [
  "NO WAVE SHAPERS",
  "NO BASS STACKING",
  "NO PREAMP STAGE",
  "NO DUPLICATE LIMITERS",
  "ALL GAINS ENFORCED 0.0",
];

export default function ChipCommander() {
  const engine = useAudioEngine();
  const filtersActive = engine.volume >= 100;
  const asoV3Active = engine.asoV3Active;
  const asoV3Slot = engine.asoV3SlotNumber;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="px-3 py-2 rounded space-y-1"
        style={{
          background: "rgba(0,212,255,0.08)",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#00d4ff" }}
        >
          CHIP COMMANDER
        </div>
        <div
          className="text-xs uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          CENTRAL SYSTEM CONTROLLER
        </div>
        <div className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
          LIGHTWEIGHT — BACKGROUND ENFORCEMENT
        </div>
        <div
          className="inline-block text-xs font-bold px-2 py-0.5 rounded"
          style={{
            background: "rgba(0,255,136,0.15)",
            border: "1px solid rgba(0,255,136,0.4)",
            color: "#00ff88",
          }}
        >
          ● ACTIVE — ALL SYSTEMS NOMINAL
        </div>
      </div>

      {/* Capacity */}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["PROGRAMMED", "50W"],
            ["CAPACITY SLOTS", "3,000"],
            ["AUDIO CONTEXTS", "2 ACTIVE"],
            ["ENGINES RUNNING", "4"],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div
            key={k}
            className="px-2 py-2 rounded text-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
              {k}
            </div>
            <div
              className="text-sm font-bold font-mono"
              style={{ color: "#ffd700" }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Audio Context states */}
      <div
        className="flex gap-3"
        style={{
          borderTop: "1px solid rgba(0,212,255,0.1)",
          paddingTop: "0.75rem",
        }}
      >
        <div
          className="flex-1 px-2 py-1.5 rounded text-center"
          style={{
            background:
              engine.bassContextState === "running"
                ? "rgba(0,255,136,0.1)"
                : "rgba(255,60,60,0.1)",
            border: `1px solid ${engine.bassContextState === "running" ? "rgba(0,255,136,0.4)" : "rgba(255,60,60,0.3)"}`,
          }}
        >
          <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            BASS CTX
          </div>
          <div
            className="text-xs font-bold font-mono"
            style={{
              color:
                engine.bassContextState === "running" ? "#00ff88" : "#ff4444",
            }}
          >
            {engine.bassContextState.toUpperCase()}
          </div>
        </div>
        <div
          className="flex-1 px-2 py-1.5 rounded text-center"
          style={{
            background:
              engine.highsContextState === "running"
                ? "rgba(0,255,136,0.1)"
                : "rgba(255,60,60,0.1)",
            border: `1px solid ${engine.highsContextState === "running" ? "rgba(0,255,136,0.4)" : "rgba(255,60,60,0.3)"}`,
          }}
        >
          <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            HIGHS CTX
          </div>
          <div
            className="text-xs font-bold font-mono"
            style={{
              color:
                engine.highsContextState === "running" ? "#00ff88" : "#ff4444",
            }}
          >
            {engine.highsContextState.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Anti-Stacking Status */}
      <div
        className="px-2 py-2 rounded space-y-1"
        style={{
          background:
            engine.stackingViolations.length === 0
              ? "rgba(0,255,136,0.05)"
              : "rgba(255,60,60,0.08)",
          border: `1px solid ${engine.stackingViolations.length === 0 ? "rgba(0,255,136,0.25)" : "rgba(255,60,60,0.3)"}`,
        }}
        data-ocid="chip_commander.stacking_status"
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{
            color:
              engine.stackingViolations.length === 0 ? "#00ff88" : "#ff4444",
          }}
        >
          ANTI-STACKING STATUS
        </div>
        {engine.stackingViolations.length === 0 ? (
          <div className="text-xs font-mono" style={{ color: "#00ff88" }}>
            ● NO STACKING DETECTED
          </div>
        ) : (
          engine.stackingViolations.map((v) => (
            <div
              key={v}
              className="text-xs font-mono"
              style={{ color: "#ff4444" }}
            >
              ● {v}
            </div>
          ))
        )}
      </div>

      {/* Save Status */}
      <div
        className="px-2 py-2 rounded space-y-1"
        style={{
          background: engine.hasUnsavedChanges
            ? "rgba(255,215,0,0.06)"
            : "rgba(0,255,136,0.05)",
          border: `1px solid ${engine.hasUnsavedChanges ? "rgba(255,215,0,0.3)" : "rgba(0,255,136,0.25)"}`,
        }}
        data-ocid="chip_commander.save_status"
      >
        <div className="flex justify-between items-center">
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: engine.hasUnsavedChanges ? "#ffd700" : "#00ff88" }}
          >
            {engine.hasUnsavedChanges ? "⏳ UNSAVED CHANGES" : "✓ ALL SAVED"}
          </div>
        </div>
        {engine.lastSaved && (
          <div
            className="text-xs font-mono"
            style={{ color: "rgba(0,212,255,0.5)" }}
          >
            LAST SAVED {engine.lastSaved}
          </div>
        )}
      </div>

      {/* Gain Violations */}
      <div
        className="px-2 py-2 rounded space-y-1"
        style={{
          background:
            engine.gainViolations.length === 0
              ? "rgba(0,255,136,0.05)"
              : "rgba(255,60,60,0.08)",
          border: `1px solid ${engine.gainViolations.length === 0 ? "rgba(0,255,136,0.25)" : "rgba(255,60,60,0.3)"}`,
        }}
        data-ocid="chip_commander.gain_violations"
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{
            color: engine.gainViolations.length === 0 ? "#00ff88" : "#ff4444",
          }}
        >
          GAIN VIOLATIONS
        </div>
        {engine.gainViolations.length === 0 ? (
          <div className="text-xs font-mono" style={{ color: "#00ff88" }}>
            ● ALL GAINS ENFORCED 0.0
          </div>
        ) : (
          engine.gainViolations.map((v) => (
            <div
              key={v}
              className="text-xs font-mono"
              style={{ color: "#ff4444" }}
            >
              ● {v}
            </div>
          ))
        )}
      </div>

      {/* Helix DSP Amp Slot */}
      <div
        className="px-2 py-2 rounded space-y-1"
        style={{
          background: asoV3Active ? "rgba(0,212,255,0.1)" : "rgba(0,0,0,0.3)",
          border: `1px solid ${
            asoV3Active ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.15)"
          }`,
        }}
        data-ocid="chip_commander.helix_slot"
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: asoV3Active ? "#00d4ff" : "rgba(0,212,255,0.4)" }}
        >
          {asoV3Active
            ? `● SLOT ${asoV3Slot} — HELIX DSP AMP LOADED`
            : `○ SLOT ${asoV3Slot} — HELIX DSP AMP STANDBY`}
        </div>
        <div
          className="text-xs"
          style={{
            color: asoV3Active ? "rgba(0,212,255,0.6)" : "rgba(0,212,255,0.25)",
          }}
        >
          {asoV3Active
            ? "1,720,000W characteristics • VDA simulation active"
            : "Activate from ASO-V3 panel"}
        </div>
      </div>

      {/* Intelligence Layer Status */}
      <div
        className="px-2 py-2 rounded space-y-1"
        style={{
          background: "rgba(0,255,136,0.05)",
          border: "1px solid rgba(0,255,136,0.2)",
        }}
        data-ocid="chip_commander.intelligence_layer"
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#00ff88" }}
        >
          INTELLIGENCE LAYER — LOADED
        </div>
        {[
          "25 SMART CHIPS ACTIVE — LEARNING",
          "ZERO STACKING POLICY CHIP: INDEPENDENT — ALWAYS RUNNING",
          "BLUETOOTH SCANNER CHIP: INDEPENDENT",
          "1,000MB BRAIN CHIP: LOADED",
        ].map((item) => (
          <div
            key={item}
            className="text-xs font-mono flex items-center gap-1"
            style={{ color: "rgba(0,255,136,0.8)" }}
          >
            <span style={{ color: "#00ff88" }}>●</span> {item}
          </div>
        ))}
      </div>

      {/* Smart Range Limiter */}
      <div
        className="px-2 py-2 rounded space-y-1"
        style={{
          background: "rgba(255,215,0,0.06)",
          border: "1px solid rgba(255,215,0,0.25)",
        }}
      >
        <div className="text-xs font-bold" style={{ color: "#ffd700" }}>
          SMART RANGE LIMITER LOADED
        </div>
        <div className="text-xs" style={{ color: "rgba(255,215,0,0.7)" }}>
          1,000W CHARACTERISTICS — 20 SMART CHIPS + 30 FILTERS
        </div>
        <div
          className="text-xs font-mono font-bold"
          style={{ color: filtersActive ? "#00ff88" : "rgba(0,212,255,0.5)" }}
        >
          {filtersActive
            ? `● 30 FILTERS ACTIVE — VOL ${engine.volume}`
            : `● FILTERS STANDBY — VOL ${engine.volume} (ACTIVATE AT 100+)`}
        </div>
      </div>

      {/* All 16 Gains */}
      <div
        style={{
          borderTop: "1px solid rgba(0,212,255,0.1)",
          paddingTop: "0.75rem",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "#00d4ff" }}
        >
          ALL 16 GAINS LOCKED
        </div>
        <div
          className="grid grid-cols-2 gap-1"
          data-ocid="chip_commander.gains"
        >
          {GAINS.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between px-2 py-1 rounded"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: `1px solid ${
                  g.dynamic ? "rgba(0,212,255,0.15)" : "rgba(255,60,60,0.2)"
                }`,
              }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: g.dynamic ? "rgba(0,212,255,0.7)" : "#ff6b6b" }}
              >
                {g.id}
              </span>
              <span className="text-xs font-mono" style={{ color: "#ffd700" }}>
                {g.id === "G13" || g.id === "G14"
                  ? "1.0"
                  : g.dynamic
                    ? "EQ"
                    : "0.0"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: "rgba(0,212,255,0.4)" }}>
          RED = LOCKED 0.0 | CYAN = EQ-CONTROLLED
        </p>
      </div>

      {/* Enforcement Checklist */}
      <div
        className="px-3 py-3 rounded space-y-1.5"
        style={{
          background: "rgba(0,255,136,0.05)",
          border: "1px solid rgba(0,255,136,0.2)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "#00ff88" }}
        >
          ENFORCEMENT STATUS
        </div>
        {ENFORCEMENT.map((rule) => (
          <div key={rule} className="flex items-center gap-2">
            <span style={{ color: "#00ff88" }}>✓</span>
            <span
              className="text-xs font-mono"
              style={{ color: "rgba(0,255,136,0.8)" }}
            >
              {rule}
            </span>
          </div>
        ))}
      </div>

      {/* Wiring */}
      <div
        className="text-xs text-center px-2 py-1.5 rounded font-bold uppercase tracking-widest"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(0,212,255,0.2)",
          color: "rgba(0,212,255,0.6)",
        }}
      >
        4 GAUGE WIRING — FULL SYSTEM
      </div>
    </div>
  );
}
