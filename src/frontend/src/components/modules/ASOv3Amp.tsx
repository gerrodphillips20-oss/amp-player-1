import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

const CHANNELS = [
  { label: "BASS", watts: "7,000W", color: "#ff6b35", note: "Primary driver" },
  { label: "MIDS", watts: "2,000W", color: "#ffd700", note: "Vocals + body" },
  {
    label: "HIGHS",
    watts: "2,000W",
    color: "#00d4ff",
    note: "Isolated standalone amp",
  },
  {
    label: "TWEETERS",
    watts: "2,000W",
    color: "#00ff88",
    note: "Air + sparkle",
  },
];

const FEATURES = [
  { id: "hd", label: "HIDDEN DEPT", desc: "20-30 smart chips" },
  { id: "lerl", label: "LOW-END RESOLUTION LOGIC", desc: "Bass note fill" },
  { id: "mr", label: "MOLECULAR RECTIFICATION", desc: "100% precision" },
  { id: "sf", label: "SPEAKER FINGERPRINT", desc: "Auto Ohm scan" },
  { id: "ti", label: "THERMAL IMMORTALITY", desc: "Freq-shift cooling" },
  { id: "sqe", label: "SONG QUALITY ENGINE", desc: "100% quality auto" },
  { id: "86k", label: "86K FEATURE SET", desc: "All internal" },
];

export default function ASOv3Amp() {
  const engine = useAudioEngine();
  const isActive = engine.asoV3Active;
  const slotNum = engine.asoV3SlotNumber;
  const [confirm, setConfirm] = useState(false);

  const handleToggle = () => {
    if (isActive) {
      setConfirm(true);
      return;
    }
    engine.setASOv3Active(true);
  };

  const handleConfirmOff = () => {
    engine.setASOv3Active(false);
    setConfirm(false);
  };

  return (
    <div className="space-y-4">
      {/* ── ASO-V3 POWER SWITCH — prominent, top position ── */}
      <div
        className="px-3 py-3 rounded"
        style={{
          background: isActive ? "rgba(0,255,136,0.1)" : "rgba(20,20,40,0.85)",
          border: `2px solid ${
            isActive ? "rgba(0,255,136,0.7)" : "rgba(255,180,0,0.5)"
          }`,
          boxShadow: isActive
            ? "0 0 24px rgba(0,255,136,0.25), inset 0 0 12px rgba(0,255,136,0.04)"
            : "0 0 14px rgba(255,180,0,0.12)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: isActive ? "#00ff88" : "#ffb400" }}
            >
              ASO-V3 POWER
            </div>
            <div
              className="text-xs uppercase tracking-widest mt-0.5"
              style={{
                color: isActive ? "rgba(0,255,136,0.6)" : "rgba(255,180,0,0.5)",
              }}
            >
              {isActive
                ? "● LIVE — AMP RUNNING"
                : "○ STANDBY — MANUAL ACTIVATION ONLY"}
            </div>
          </div>
          <div
            className="w-5 h-5 rounded-full flex-shrink-0"
            style={{
              background: isActive ? "#00ff88" : "rgba(255,150,0,0.3)",
              boxShadow: isActive
                ? "0 0 12px #00ff88, 0 0 24px rgba(0,255,136,0.4)"
                : "0 0 6px rgba(255,150,0,0.3)",
              animation: isActive ? "pulse 1s ease-in-out infinite" : "none",
            }}
          />
        </div>

        {!confirm && (
          <button
            type="button"
            onClick={handleToggle}
            className="w-full py-3 rounded font-bold uppercase tracking-widest text-sm transition-smooth"
            style={{
              background: isActive
                ? "rgba(255,60,60,0.18)"
                : "rgba(255,180,0,0.18)",
              border: `2px solid ${
                isActive ? "rgba(255,60,60,0.7)" : "rgba(255,180,0,0.7)"
              }`,
              color: isActive ? "#ff6b6b" : "#ffb400",
              boxShadow: isActive
                ? "0 0 20px rgba(255,60,60,0.3)"
                : "0 0 16px rgba(255,180,0,0.25)",
              letterSpacing: "0.12em",
            }}
            data-ocid="aso_v3.power_button"
          >
            {isActive ? "■  DEACTIVATE ASO-V3" : "▶  ACTIVATE ASO-V3"}
          </button>
        )}

        {confirm && (
          <div className="space-y-2" data-ocid="aso_v3.confirm_dialog">
            <div
              className="text-xs font-bold uppercase text-center py-1"
              style={{ color: "#ff6b6b" }}
            >
              Cut ASO-V3? Old amps will resume.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmOff}
                className="flex-1 py-2 rounded text-xs font-bold uppercase"
                style={{
                  background: "rgba(255,60,60,0.2)",
                  border: "1px solid rgba(255,60,60,0.6)",
                  color: "#ff6b6b",
                }}
                data-ocid="aso_v3.confirm_button"
              >
                CONFIRM CUT
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="flex-1 py-2 rounded text-xs font-bold uppercase"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.6)",
                }}
                data-ocid="aso_v3.cancel_button"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {isActive && (
          <div
            className="mt-2 text-center text-xs font-mono font-bold"
            style={{ color: "rgba(0,255,136,0.5)" }}
          >
            SLOT {slotNum} LOADED
          </div>
        )}
      </div>

      {/* Blueprint label */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: isActive
            ? "rgba(255,180,0,0.08)"
            : "rgba(255,150,0,0.04)",
          border: `1px solid ${
            isActive ? "rgba(255,180,0,0.4)" : "rgba(255,150,0,0.2)"
          }`,
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,180,0,0.8)" }}
        >
          ASO-V3 SOVEREIGN MASTER BLUEPRINT — GERROD'S DESIGN
        </div>
      </div>

      {/* Power specs */}
      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            ["TOTAL POWER SUPPLY", "20,000W", "#ffb400"],
            ["FUSE PROTECTION", "12,000W", "#ff6b35"],
            ["AI TRAINING", "500M+ pts", "#00d4ff"],
            ["CHIP SLOTS", "3,000", "#00ff88"],
          ] as [string, string, string][]
        ).map(([k, v, c]) => (
          <div
            key={k}
            className="px-2 py-2 rounded text-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: `1px solid ${c}22`,
            }}
          >
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {k}
            </div>
            <div
              className="text-sm font-bold font-mono mt-0.5"
              style={{ color: c }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* 4-Channel power display */}
      <div>
        <div
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(255,180,0,0.7)" }}
        >
          4-CHANNEL POWER
        </div>
        <div className="space-y-1.5">
          {CHANNELS.map((ch) => (
            <div
              key={ch.label}
              className="flex items-center gap-3 px-3 py-2 rounded"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: `1px solid ${
                  isActive ? `${ch.color}44` : `${ch.color}18`
                }`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: isActive ? ch.color : "rgba(255,255,255,0.15)",
                  boxShadow: isActive ? `0 0 6px ${ch.color}` : "none",
                }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{
                    color: isActive ? ch.color : "rgba(255,255,255,0.4)",
                  }}
                >
                  {ch.label}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {ch.note}
                </div>
              </div>
              <div
                className="text-xs font-mono font-bold"
                style={{
                  color: isActive ? ch.color : "rgba(255,255,255,0.4)",
                }}
              >
                {ch.watts}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dual-power characteristic training */}
      {isActive && (
        <div
          className="px-3 py-2 rounded space-y-1"
          style={{
            background: "rgba(0,255,136,0.06)",
            border: "1px solid rgba(0,255,136,0.25)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: "#00ff88" }}>
              ★ POWER MIMIC: ACTIVE
            </span>
            <span className="text-xs" style={{ color: "rgba(0,255,136,0.5)" }}>
              real amp push behavior
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: "#00d4ff" }}>
              ★ AUDIO BEHAVIOR: ACTIVE
            </span>
            <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
              punch + depth + clarity
            </span>
          </div>
        </div>
      )}

      {/* Internal features */}
      <div>
        <div
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(255,180,0,0.7)" }}
        >
          INTERNAL FEATURES
        </div>
        <div className="grid grid-cols-2 gap-1">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              className="px-2 py-1.5 rounded"
              style={{
                background: isActive
                  ? "rgba(255,180,0,0.08)"
                  : "rgba(0,0,0,0.3)",
                border: `1px solid ${
                  isActive ? "rgba(255,180,0,0.3)" : "rgba(255,180,0,0.1)"
                }`,
              }}
            >
              <div
                className="text-xs font-bold uppercase"
                style={{
                  color: isActive ? "#ffb400" : "rgba(255,180,0,0.35)",
                  fontSize: "0.6rem",
                }}
              >
                {isActive ? "● " : "○ "}
                {f.label}
              </div>
              <div
                className="text-xs"
                style={{
                  color: isActive
                    ? "rgba(255,180,0,0.5)"
                    : "rgba(255,255,255,0.2)",
                  fontSize: "0.6rem",
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signal chain */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,180,0,0.15)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: "rgba(255,180,0,0.6)" }}
        >
          SIGNAL CHAIN
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {["HEAD UNIT", "PREAMP", "PROCESSOR", "ASO-V3", "SPEAKERS"].map(
            (step) => (
              <span
                key={step}
                className="text-xs font-bold"
                style={{
                  color: step === "ASO-V3" ? "#ffb400" : "rgba(0,212,255,0.6)",
                }}
              >
                {step === "PREAMP" ||
                step === "PROCESSOR" ||
                step === "ASO-V3" ||
                step === "SPEAKERS"
                  ? " → "
                  : ""}
                {step}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-xs" style={{ color: "rgba(255,180,0,0.3)" }}>
        ● Amp does NOT auto-start. Manual activation only.
        <br />● Switching CUTS old amps completely. One amp runs at a time.
      </div>
    </div>
  );
}
