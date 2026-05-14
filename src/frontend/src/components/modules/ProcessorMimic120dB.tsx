import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function ProcessorMimic120dB() {
  const engine = useAudioEngine();
  const {
    processorMimic120dB,
    srlControlling120dB,
    setProcessorMimic120dB,
    srlGrade,
  } = engine;

  const srlBlocking = srlControlling120dB;
  const ceilPercent = processorMimic120dB;
  const ceilDb = (ceilPercent / 100) * 120;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#ffd700" }}
        >
          120dB PROCESSOR MIMIC
        </div>
        <div
          className="text-xs mt-0.5 font-mono"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          SILENT BACKGROUND MODULE
        </div>
      </div>

      {/* Status Badge */}
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
        style={{
          background: "rgba(0,255,136,0.12)",
          border: "1px solid rgba(0,255,136,0.4)",
          color: "#00ff88",
        }}
        data-ocid="mimic120.status_badge"
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#00ff88" }}
        />
        BACKGROUND ACTIVE &mdash; NOT IN SIGNAL CHAIN
      </div>

      {/* Description */}
      <div
        className="p-2 rounded text-xs"
        style={{
          background: "rgba(0,212,255,0.04)",
          border: "1px solid rgba(0,212,255,0.12)",
          color: "rgba(0,212,255,0.55)",
        }}
      >
        Trained to mimic the behavior of a real 120dB processor. Runs in
        background — not in signal chain. Reference layer gives the system a
        ceiling to push toward.
      </div>

      {/* Chip Commander Slot + Power */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="p-2 rounded text-center"
          style={{
            background: "rgba(255,215,0,0.06)",
            border: "1px solid rgba(255,215,0,0.2)",
          }}
        >
          <div
            className="text-xs font-bold"
            style={{ color: "rgba(255,215,0,0.5)" }}
          >
            SLOT
          </div>
          <div
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            2848
          </div>
        </div>
        <div
          className="p-2 rounded text-center"
          style={{
            background: "rgba(0,255,136,0.06)",
            border: "1px solid rgba(0,255,136,0.2)",
          }}
        >
          <div
            className="text-xs font-bold"
            style={{ color: "rgba(0,255,136,0.5)" }}
          >
            DRAW
          </div>
          <div
            className="text-xs font-mono font-bold"
            style={{ color: "#00ff88" }}
          >
            0W
          </div>
        </div>
      </div>

      {/* Decibel Ceiling Meter */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            DECIBEL CEILING
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {ceilDb.toFixed(1)} dB
          </span>
        </div>
        <div
          className="w-full h-6 rounded overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${ceilPercent}%`,
              background:
                "linear-gradient(90deg, rgba(0,212,255,0.4), rgba(255,215,0,0.6))",
              boxShadow: "0 0 8px rgba(255,215,0,0.4)",
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.3)" }}>
            0 dB
          </span>
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.3)" }}>
            120 dB
          </span>
        </div>
      </div>

      {/* SRL Warning */}
      {srlBlocking && (
        <div
          className="px-3 py-2 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            background: "rgba(255,68,68,0.12)",
            border: "1px solid rgba(255,68,68,0.4)",
            color: "#ff4444",
          }}
          data-ocid="mimic120.srl_warning"
        >
          ⚠ SRL ACTIVE &mdash; MANAGING LEVEL
        </div>
      )}

      {/* Slider */}
      <div
        className="flex flex-col gap-1 py-2 border-b"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#ffd700" }}
          >
            120dB DECIBEL LEVEL
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {ceilPercent}%
          </span>
        </div>
        <p className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
          WORLD FIRST — controlled by Smart Range Limiter
        </p>
        <input
          data-ocid="mimic120.level_slider"
          type="range"
          min={0}
          max={100}
          value={ceilPercent}
          disabled={srlBlocking}
          onChange={(e) => setProcessorMimic120dB(Number(e.target.value))}
          className="w-full mt-1"
          style={{ accentColor: "#ffd700", opacity: srlBlocking ? 0.4 : 1 }}
        />
        <div className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
          SRL GRADE:{" "}
          <span
            style={{
              color: srlGrade === "D" ? "#ff4444" : "#00ff88",
              fontWeight: "bold",
            }}
          >
            {srlGrade}
          </span>
        </div>
      </div>

      {/* Characteristics ceiling note */}
      <div
        className="px-2 py-1.5 rounded text-xs"
        style={{
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.1)",
          color: "rgba(0,212,255,0.45)",
        }}
      >
        ● At 0%: characteristics muted to 50% ceiling &nbsp;|&nbsp; At 100%:
        full 120dB reference ceiling
      </div>
    </div>
  );
}
