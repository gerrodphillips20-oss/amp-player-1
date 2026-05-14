import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function SafetyProcessor() {
  const engine = useAudioEngine();
  const { volume, safetyProcessorLevel } = engine;

  const strengthPct = safetyProcessorLevel ?? 0;
  const bassIndependent = true;
  const lowEndStrengthened = volume > 50;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#ffd700" }}
        >
          SMART SAFETY PROCESSOR
        </div>
        <div
          className="text-xs mt-0.5 font-mono"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          VOLUME 1-100 PROTECTION
        </div>
      </div>

      {/* Always Active Badge */}
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
        style={{
          background: "rgba(0,255,136,0.12)",
          border: "1px solid rgba(0,255,136,0.4)",
          color: "#00ff88",
        }}
        data-ocid="safety_proc.status_badge"
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "#00ff88",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        ALWAYS ACTIVE &mdash; AUTOMATIC
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
        Tracks volume across the full 1-100 range. Keeps bass and volume
        completely separate. Straightens out the low end as volume climbs. No
        user controls needed.
      </div>

      {/* Volume Level Display */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            VOLUME LEVEL
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ffd700" }}
          >
            {volume} / 100
          </span>
        </div>
        <div
          className="w-full h-3 rounded overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
        >
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${volume}%`,
              background:
                "linear-gradient(90deg, rgba(0,212,255,0.5), rgba(255,215,0,0.7))",
            }}
          />
        </div>
      </div>

      {/* Safety Strength Meter */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            SAFETY STRENGTH
          </span>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#00ff88" }}
          >
            {strengthPct.toFixed(0)}%
          </span>
        </div>
        <div
          className="w-full h-3 rounded overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(0,255,136,0.2)",
          }}
        >
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${strengthPct}%`,
              background:
                "linear-gradient(90deg, rgba(0,255,136,0.4), rgba(0,255,136,0.8))",
              boxShadow:
                strengthPct > 50 ? "0 0 6px rgba(0,255,136,0.5)" : "none",
            }}
          />
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            background: bassIndependent
              ? "rgba(0,255,136,0.12)"
              : "rgba(0,0,0,0.3)",
            border: `1px solid ${bassIndependent ? "rgba(0,255,136,0.4)" : "rgba(0,212,255,0.15)"}`,
            color: bassIndependent ? "#00ff88" : "rgba(0,212,255,0.4)",
          }}
          data-ocid="safety_proc.bass_independent_badge"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "currentColor" }}
          />
          BASS INDEPENDENT
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            background: lowEndStrengthened
              ? "rgba(0,212,255,0.12)"
              : "rgba(0,0,0,0.3)",
            border: `1px solid ${lowEndStrengthened ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.15)"}`,
            color: lowEndStrengthened ? "#00d4ff" : "rgba(0,212,255,0.3)",
          }}
          data-ocid="safety_proc.low_end_badge"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "currentColor" }}
          />
          LOW END STRENGTHENED
        </div>
      </div>

      {/* Power Source */}
      <div
        className="p-2 rounded"
        style={{
          background: "rgba(255,215,0,0.06)",
          border: "1px solid rgba(255,215,0,0.2)",
        }}
        data-ocid="safety_proc.power_display"
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,215,0,0.8)" }}
        >
          THUNDER BATTERY: 1,000W DIRECT
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "rgba(255,215,0,0.4)" }}
        >
          RAW POWER &mdash; NO INTERFERENCE
        </div>
      </div>

      {/* No controls note */}
      <div
        className="px-2 py-1.5 rounded text-xs"
        style={{
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.1)",
          color: "rgba(0,212,255,0.35)",
        }}
      >
        ● Fully automatic — no user controls required &nbsp;|&nbsp; ● Powered by
        1,000W characteristics from Thunder Battery
      </div>
    </div>
  );
}
