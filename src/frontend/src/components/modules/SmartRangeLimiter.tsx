import { useAudioEngine } from "@/hooks/useAudioEngine";
import type { SRLGrade } from "@/hooks/useAudioEngine";

const GRADE_COLORS: Record<SRLGrade, string> = {
  "A+": "#00ff88",
  "B+": "#ffd700",
  "C+": "#ff9500",
  D: "#ff4444",
};

const GRADE_BG: Record<SRLGrade, string> = {
  "A+": "rgba(0,255,136,0.1)",
  "B+": "rgba(255,215,0,0.1)",
  "C+": "rgba(255,149,0,0.1)",
  D: "rgba(255,68,68,0.12)",
};

const INSTRUMENT_CHANNELS = [
  { label: "BASS", color: "#ff6b35" },
  { label: "KICK", color: "#ffd700" },
  { label: "LOW MIDS", color: "#00d4ff" },
  { label: "MIDS", color: "#00d4ff" },
  { label: "HIGHS", color: "#00ff88" },
  { label: "TWEETERS", color: "#00ff88" },
];

export default function SmartRangeLimiter() {
  const engine = useAudioEngine();
  const { srlGrade, srlGradeLabel, isPlaying, volume } = engine;

  const gradeColor = GRADE_COLORS[srlGrade];
  const gradeBg = GRADE_BG[srlGrade];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div
        className="px-3 py-2 rounded space-y-1"
        style={{
          background: "rgba(0,212,255,0.06)",
          border: "1px solid rgba(0,212,255,0.25)",
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#00d4ff" }}
          >
            SMART RANGE LIMITER
          </div>
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded uppercase"
            style={{
              background: "rgba(0,212,255,0.18)",
              border: "1px solid rgba(0,212,255,0.5)",
              color: "#00d4ff",
              fontSize: "0.6rem",
              letterSpacing: "0.05em",
            }}
          >
            HD MONITOR: ACTIVE
          </span>
        </div>
        <div
          className="text-xs font-semibold"
          style={{ color: "rgba(0,212,255,0.75)" }}
        >
          SUPERIOR HD MONITOR: BUILT IN — AGGRESSIVE
        </div>
        <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
          GERROD'S DESIGN — 1,000W CHARACTERISTICS
        </div>
        <div className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
          Lives inside: VOLUME → EQ → SUB BASS
        </div>
      </div>

      {/* Grade display */}
      <div
        className="flex items-center gap-4 px-4 py-4 rounded"
        style={{
          background: gradeBg,
          border: `2px solid ${gradeColor}55`,
          boxShadow: `0 0 15px ${gradeColor}20`,
        }}
        data-ocid="srl.grade_display"
      >
        <div
          className="text-5xl font-black font-mono"
          style={{ color: gradeColor, textShadow: `0 0 20px ${gradeColor}` }}
        >
          {srlGrade}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: gradeColor }}
          >
            {srlGradeLabel}
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {srlGrade === "A+" && "Signal is ultra clean. No action needed."}
            {srlGrade === "B+" && "Good signal. Monitoring active."}
            {srlGrade === "C+" && "Moderate signal. Enhanced monitoring."}
            {srlGrade === "D" && "Low quality signal. Protection may activate."}
          </div>
        </div>
      </div>

      {/* Mode */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded"
        style={{
          background: "rgba(0,255,136,0.06)",
          border: "1px solid rgba(0,255,136,0.25)",
        }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: "#00ff88",
            boxShadow: "0 0 8px #00ff88",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div>
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#00ff88" }}
          >
            CLEAN MODE — SUPPORTS CLEAN BASS
          </div>
          <div className="text-xs" style={{ color: "rgba(0,255,136,0.5)" }}>
            MONITORING — acts only in extreme cases
          </div>
        </div>
      </div>

      {/* No gain controls notice */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        <div
          className="text-xs font-bold"
          style={{ color: "rgba(255,215,0,0.7)" }}
        >
          ✓ NO GAIN CONTROLS — READ-ONLY STATUS PANEL
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "rgba(255,215,0,0.4)" }}
        >
          No volume boost. No gain sliders. No distortion sliders. Monitors and
          fixes only.
        </div>
      </div>

      {/* Instrument monitor */}
      <div>
        <div
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(0,212,255,0.7)" }}
        >
          INSTRUMENT MONITOR
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {INSTRUMENT_CHANNELS.map((ch) => {
            const active = isPlaying;
            return (
              <div
                key={ch.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded"
                style={{
                  background: active ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.15)",
                  border: `1px solid ${
                    active ? `${ch.color}33` : "rgba(255,255,255,0.07)"
                  }`,
                }}
                data-ocid={`srl.channel_${ch.label.toLowerCase().replace(" ", "_")}`}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: active ? ch.color : "rgba(255,255,255,0.15)",
                    boxShadow: active ? `0 0 4px ${ch.color}` : "none",
                    animation: active
                      ? "pulse 1.2s ease-in-out infinite"
                      : "none",
                  }}
                />
                <span
                  className="text-xs font-bold uppercase"
                  style={{
                    color: active ? ch.color : "rgba(255,255,255,0.25)",
                    fontSize: "0.65rem",
                  }}
                >
                  {ch.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volume readout */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            VOLUME LEVEL
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: volume >= 80 ? "#ff9500" : "#00d4ff" }}
          >
            {volume} / 100
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            CHAIN POSITION
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "rgba(0,212,255,0.6)" }}
          >
            Vol → EQ → Sub Bass
          </span>
        </div>
      </div>
    </div>
  );
}
