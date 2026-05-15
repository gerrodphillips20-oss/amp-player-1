import { useAudioEngine } from "@/hooks/useAudioEngine";

function Led({ on, color = "#00ff88" }: { on: boolean; color?: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{
        background: on ? color : "rgba(255,255,255,0.1)",
        boxShadow: on ? `0 0 6px ${color}` : "none",
      }}
    />
  );
}

export default function BassAmp() {
  const engine = useAudioEngine();
  const {
    helixActive,
    setHelixActive,
    gainKillActive,
    setGainKillActive,
    intelligenceLayer,
    speakerProfile,
    scanResult,
    bassContextState,
  } = engine;

  const scanClean = scanResult === "clean" || helixActive;
  const threadBOn = intelligenceLayer.threadBActive;

  return (
    <div
      className="rounded-lg overflow-hidden space-y-0"
      style={{
        background: "linear-gradient(180deg, #0a0f1a 0%, #060b14 100%)",
        border: "1px solid rgba(0,212,255,0.35)",
        boxShadow: helixActive
          ? "0 0 30px rgba(0,212,255,0.18), inset 0 0 40px rgba(0,0,0,0.4)"
          : "none",
      }}
    >
      {/* ── HEADER STRIP ── */}
      <div
        className="px-4 pt-4 pb-3"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,212,255,0.12) 0%, rgba(0,5,20,0.6) 100%)",
          borderBottom: "1px solid rgba(0,212,255,0.25)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className="text-2xl font-black uppercase tracking-widest leading-none"
              style={{
                color: "#00d4ff",
                textShadow: "0 0 25px rgba(0,212,255,0.7)",
              }}
            >
              HELIX DSP AMP
            </div>
            <div
              className="text-xs font-bold uppercase tracking-widest mt-1"
              style={{ color: "rgba(0,212,255,0.55)" }}
            >
              VIRTUAL DIGITAL ANALOG SIMULATION
            </div>
          </div>
          {/* Status badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs uppercase tracking-widest flex-shrink-0"
            style={{
              background: helixActive
                ? "rgba(0,212,255,0.15)"
                : "rgba(100,100,120,0.15)",
              border: `1px solid ${helixActive ? "rgba(0,212,255,0.55)" : "rgba(100,100,120,0.35)"}`,
              color: helixActive ? "#00d4ff" : "rgba(160,160,180,0.8)",
            }}
            data-ocid="helix.status_badge"
          >
            <Led on={helixActive} color="#00d4ff" />
            {helixActive ? "ACTIVE" : "STANDBY"}
          </div>
        </div>

        {/* Pre-play scanner */}
        <div
          className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded"
          style={{
            background: scanClean
              ? "rgba(0,255,136,0.08)"
              : "rgba(255,60,60,0.1)",
            border: `1px solid ${scanClean ? "rgba(0,255,136,0.3)" : "rgba(255,60,60,0.4)"}`,
          }}
        >
          <Led on={scanClean} color={scanClean ? "#00ff88" : "#ff4444"} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: scanClean ? "#00ff88" : "#ff4444" }}
          >
            {scanClean ? "SYSTEM CLEAN" : "FAULT DETECTED"}
          </span>
          <span
            className="ml-auto text-xs"
            style={{ color: "rgba(0,212,255,0.4)" }}
          >
            PRE-PLAY SCANNER
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Power + channel */}
        <div
          className="px-3 py-2.5 rounded"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(0,212,255,0.15)",
          }}
        >
          <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            SYSTEM POWER — DUAL CHAIN
          </div>
          <div
            className="text-lg font-black font-mono uppercase tracking-widest mt-0.5"
            style={{
              color: "#ffd700",
              textShadow: "0 0 15px rgba(255,215,0,0.5)",
            }}
          >
            3,440,000W CHARACTERISTICS
          </div>
          <div
            className="text-xs font-mono font-bold mt-0.5"
            style={{ color: "rgba(255,215,0,0.8)" }}
          >
            DUAL THUNDER BATTERY CHAIN
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#00d4ff" }}
            >
              Chain 1: 1,720,000W
            </span>
            <span className="text-xs" style={{ color: "rgba(0,212,255,0.35)" }}>
              |
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#00d4ff" }}
            >
              Chain 2: 1,720,000W
            </span>
          </div>
        </div>

        {/* Smart chips + threads */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="px-2 py-2 rounded"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
              SMART CHIPS
            </div>
            <div
              className="text-sm font-bold font-mono"
              style={{ color: "#00ff88" }}
            >
              {intelligenceLayer.smartChips || 25} — LEARNING
            </div>
          </div>
          <div
            className="px-2 py-2 rounded"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
              1,000MB CHIP
            </div>
            <div
              className="text-sm font-bold font-mono"
              style={{ color: "#ffd700" }}
            >
              LOADED
            </div>
          </div>
        </div>

        {/* Thread status */}
        <div className="space-y-1.5">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: "rgba(0,255,136,0.07)",
              border: "1px solid rgba(0,255,136,0.25)",
            }}
          >
            <Led on={true} color="#00ff88" />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#00ff88" }}
            >
              THREAD A: PLAYBACK ISOLATED
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: threadBOn
                ? "rgba(0,255,136,0.07)"
                : "rgba(255,215,0,0.07)",
              border: `1px solid ${threadBOn ? "rgba(0,255,136,0.25)" : "rgba(255,215,0,0.25)"}`,
            }}
          >
            <Led on={threadBOn} color={threadBOn ? "#00ff88" : "#ffd700"} />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: threadBOn ? "#00ff88" : "#ffd700" }}
            >
              THREAD B: {threadBOn ? "INTELLIGENCE RUNNING" : "STARTING"}
            </span>
          </div>
        </div>

        {/* Helix DSP features */}
        <div
          className="px-3 py-1.5 rounded"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(0,212,255,0.1)",
          }}
        >
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
            HELIX DSP FEATURES: 10% — FOUNDATION ACTIVE
          </span>
        </div>

        {/* Bluetooth speaker */}
        <div
          className="px-3 py-2 rounded"
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(0,212,255,0.18)",
          }}
        >
          <div
            className="text-xs mb-1"
            style={{ color: "rgba(0,212,255,0.5)" }}
          >
            BLUETOOTH SCANNER CHIP
          </div>
          {speakerProfile.profileApplied ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold" style={{ color: "#00d4ff" }}>
                {speakerProfile.detectedName}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "rgba(0,212,255,0.6)" }}
              >
                {speakerProfile.ohms}Ω
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "rgba(0,212,255,0.6)" }}
              >
                {speakerProfile.powerHandling}
              </span>
              <span className="text-xs font-bold" style={{ color: "#00ff88" }}>
                ● PROFILE MATCHED
              </span>
            </div>
          ) : (
            <span
              className="text-xs font-bold uppercase"
              style={{ color: "rgba(0,212,255,0.4)" }}
            >
              BLUETOOTH: STANDBY
            </span>
          )}
        </div>

        {/* Thunder Battery */}
        <div
          className="px-3 py-2 rounded"
          style={{
            background: "rgba(255,215,0,0.06)",
            border: "1px solid rgba(255,215,0,0.2)",
          }}
        >
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#ffd700" }}
          >
            THUNDER BATTERY
          </div>
          <div
            className="text-xs font-mono mt-0.5"
            style={{ color: "rgba(255,215,0,0.7)" }}
          >
            CHAIN 1: 1,720,000W | 688 RUNS | 2 FUSES
          </div>
          <div
            className="text-xs font-mono"
            style={{ color: "rgba(255,215,0,0.7)" }}
          >
            CHAIN 2: 1,720,000W | 688 RUNS | 2 FUSES
          </div>
          <div
            className="text-xs font-mono"
            style={{ color: "rgba(255,215,0,0.5)" }}
          >
            344,000 BATTERIES × 9V × 5W × 2 CHAINS → HELIX
          </div>
        </div>

        {/* HELIX POWER toggle */}
        <div
          className="px-3 py-3 rounded"
          style={{
            background: helixActive ? "rgba(0,212,255,0.1)" : "rgba(0,0,0,0.4)",
            border: `2px solid ${helixActive ? "rgba(0,212,255,0.55)" : "rgba(0,212,255,0.2)"}`,
            boxShadow: helixActive ? "0 0 20px rgba(0,212,255,0.2)" : "none",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <div
                className="text-sm font-black uppercase tracking-widest"
                style={{
                  color: helixActive ? "#00d4ff" : "rgba(0,212,255,0.5)",
                }}
              >
                HELIX POWER
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "rgba(0,212,255,0.4)" }}
              >
                VIRTUAL DIGITAL ANALOG SIMULATION AMP
              </div>
            </div>
            <button
              type="button"
              data-ocid="helix.power_toggle"
              onClick={() => setHelixActive(!helixActive)}
              className="relative w-14 h-7 rounded-full transition-all duration-300 flex-shrink-0"
              style={{
                background: helixActive
                  ? "rgba(0,212,255,0.4)"
                  : "rgba(60,60,80,0.5)",
                border: `1px solid ${helixActive ? "rgba(0,212,255,0.8)" : "rgba(100,100,120,0.5)"}`,
                boxShadow: helixActive
                  ? "0 0 12px rgba(0,212,255,0.5)"
                  : "none",
              }}
              aria-label="Toggle Helix power"
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full transition-all duration-300"
                style={{
                  background: helixActive ? "#00d4ff" : "rgba(160,160,180,0.6)",
                  left: helixActive ? "calc(100% - 22px)" : "3px",
                  boxShadow: helixActive ? "0 0 8px #00d4ff" : "none",
                }}
              />
            </button>
          </div>
          <div
            className="text-xs font-bold uppercase tracking-wider text-center py-1 rounded"
            style={{
              background: helixActive
                ? "rgba(0,212,255,0.1)"
                : "rgba(0,0,0,0.3)",
              color: helixActive ? "#00d4ff" : "rgba(100,100,120,0.8)",
            }}
          >
            {bassContextState.toUpperCase()} —{" "}
            {helixActive ? "HELIX ENGAGED" : "STANDBY"}
          </div>
        </div>

        {/* Gain Kill Switch */}
        <div
          className="px-3 py-3 rounded"
          style={{
            background: gainKillActive
              ? "rgba(255,60,60,0.12)"
              : "rgba(0,0,0,0.4)",
            border: `2px solid ${gainKillActive ? "rgba(255,60,60,0.7)" : "rgba(255,60,60,0.25)"}`,
            boxShadow: gainKillActive
              ? "0 0 20px rgba(255,60,60,0.25)"
              : "none",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <div
                className="text-sm font-black uppercase tracking-widest"
                style={{
                  color: gainKillActive ? "#ff4444" : "rgba(255,100,100,0.6)",
                }}
              >
                GAIN KILL SWITCH
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "rgba(255,100,100,0.4)" }}
              >
                ALL GAINS 0.0 SIMULTANEOUSLY
              </div>
            </div>
            <button
              type="button"
              data-ocid="helix.gain_kill_toggle"
              onClick={() => setGainKillActive(!gainKillActive)}
              className="relative w-14 h-7 rounded-full transition-all duration-200 flex-shrink-0"
              style={{
                background: gainKillActive
                  ? "rgba(255,60,60,0.5)"
                  : "rgba(60,60,80,0.5)",
                border: `1px solid ${gainKillActive ? "rgba(255,60,60,0.9)" : "rgba(100,100,120,0.5)"}`,
                boxShadow: gainKillActive
                  ? "0 0 12px rgba(255,60,60,0.6)"
                  : "none",
              }}
              aria-label="Toggle gain kill switch"
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full transition-all duration-200"
                style={{
                  background: gainKillActive
                    ? "#ff4444"
                    : "rgba(160,160,180,0.6)",
                  left: gainKillActive ? "calc(100% - 22px)" : "3px",
                  boxShadow: gainKillActive ? "0 0 8px #ff4444" : "none",
                }}
              />
            </button>
          </div>
          <div
            className="text-xs font-bold uppercase tracking-wider text-center py-1.5 rounded"
            style={{
              background: gainKillActive
                ? "rgba(255,60,60,0.15)"
                : "rgba(0,255,136,0.06)",
              color: gainKillActive ? "#ff4444" : "#00ff88",
              border: `1px solid ${gainKillActive ? "rgba(255,60,60,0.4)" : "rgba(0,255,136,0.2)"}`,
            }}
            data-ocid="helix.gain_kill_status"
          >
            {gainKillActive
              ? "ZERO STACKING POLICY CHIP: ALL GAINS CONFIRMED 0.0"
              : "GAINS: NOMINAL"}
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div
        className="px-4 py-2 flex items-center gap-4 flex-wrap"
        style={{
          background: "rgba(0,0,0,0.5)",
          borderTop: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <span className="text-xs" style={{ color: "rgba(0,212,255,0.35)" }}>
          NO TUBE SIMULATION
        </span>
        <span className="text-xs" style={{ color: "rgba(0,212,255,0.2)" }}>
          |
        </span>
        <span className="text-xs" style={{ color: "rgba(0,212,255,0.35)" }}>
          VDA SIMULATION ONLY
        </span>
        <span className="text-xs" style={{ color: "rgba(0,212,255,0.2)" }}>
          |
        </span>
        <span className="text-xs" style={{ color: "rgba(0,212,255,0.35)" }}>
          TITANIUM WALL ACTIVE
        </span>
      </div>
    </div>
  );
}
