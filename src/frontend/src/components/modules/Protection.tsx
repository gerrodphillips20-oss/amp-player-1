import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useCallback, useRef } from "react";

const HD_BADGE = (
  <span
    style={{
      background: "rgba(0,0,0,0.5)",
      color: "#00d4ff",
      border: "1px solid rgba(0,212,255,0.4)",
      fontSize: "0.55rem",
      padding: "1px 4px",
      borderRadius: "3px",
      marginLeft: "4px",
      fontWeight: "bold",
    }}
  >
    HD
  </span>
);

const hdMonitorProcess = (rawValue: number, sliderType: string): number => {
  let processed = rawValue;
  if (rawValue < 10) processed = rawValue * 1.2;
  else if (rawValue > 80) processed = Math.min(rawValue * 0.95, 100);
  console.log(
    `[Superior HD Monitor][${sliderType}] Input: ${rawValue.toFixed(2)}, Processed: ${processed.toFixed(2)}`,
  );
  return processed;
};

const GRADE_COLORS: Record<
  string,
  { color: string; bg: string; border: string; glow: string }
> = {
  "A+": {
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.12)",
    border: "rgba(0,212,255,0.5)",
    glow: "0 0 16px rgba(0,212,255,0.5)",
  },
  "B+": {
    color: "#00ff88",
    bg: "rgba(0,255,136,0.1)",
    border: "rgba(0,255,136,0.4)",
    glow: "0 0 12px rgba(0,255,136,0.4)",
  },
  "C+": {
    color: "#ffd700",
    bg: "rgba(255,215,0,0.1)",
    border: "rgba(255,215,0,0.4)",
    glow: "0 0 10px rgba(255,215,0,0.3)",
  },
  D: {
    color: "#888",
    bg: "rgba(128,128,128,0.1)",
    border: "rgba(128,128,128,0.3)",
    glow: "none",
  },
};

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  ocid: string;
}

function SliderRow({ label, value, onChange, ocid }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span
          className="text-xs font-bold uppercase tracking-widest flex items-center"
          style={{ color: "rgba(0,212,255,0.85)" }}
        >
          {label}
          {HD_BADGE}
        </span>
        <span
          className="text-sm font-mono font-bold px-2 py-0.5 rounded"
          style={{
            background: "rgba(255,215,0,0.12)",
            color: "#ffd700",
            border: "1px solid rgba(255,215,0,0.3)",
          }}
          data-ocid={`${ocid}.value`}
        >
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) =>
          onChange(hdMonitorProcess(Number(e.target.value), ocid))
        }
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={
          { maxWidth: "180px", accentColor: "#00d4ff" } as React.CSSProperties
        }
        data-ocid={`${ocid}.slider`}
      />
      <div
        className="flex justify-between text-xs"
        style={{ color: "rgba(0,212,255,0.3)" }}
      >
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default function Protection() {
  const engine = useAudioEngine();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (setter: (v: number) => void) => (v: number) => {
      setter(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => engine.saveAllSettings(), 800);
    },
    [engine],
  );

  const gradeStyle = GRADE_COLORS[engine.srlGrade] ?? GRADE_COLORS.D;
  const systemHealth = Math.round(
    (engine.distortionReduction +
      engine.clippingReduction +
      engine.cleanSignal) /
      3,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: "rgba(0,212,255,0.08)",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              PROTECTION SYSTEM
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "rgba(0,212,255,0.5)" }}
            >
              POWERED BY GERROD
            </div>
          </div>
          <div
            className="px-2 py-1 rounded text-xs font-bold uppercase tracking-widest"
            style={{
              background: "rgba(255,215,0,0.12)",
              border: "1px solid rgba(255,215,0,0.4)",
              color: "#ffd700",
            }}
          >
            5,000W CHARACTERISTICS
          </div>
        </div>
      </div>

      {/* SRL Grade Badge */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded"
        style={{
          background: gradeStyle.bg,
          border: `1px solid ${gradeStyle.border}`,
          boxShadow: gradeStyle.glow,
        }}
        data-ocid="protection.srl_grade"
      >
        <div>
          <div className="text-xs" style={{ color: "rgba(0,212,255,0.6)" }}>
            SMART RANGE LIMITER GRADE
          </div>
          <div
            className="text-xs font-mono mt-0.5"
            style={{ color: gradeStyle.color }}
          >
            {engine.srlGradeLabel}
          </div>
        </div>
        <div
          className="text-2xl font-black font-mono"
          style={{ color: gradeStyle.color, textShadow: gradeStyle.glow }}
        >
          {engine.srlGrade}
        </div>
      </div>

      {/* 3 Sliders */}
      <div className="space-y-5 px-1">
        <SliderRow
          label="DISTORTION REDUCTION"
          value={engine.distortionReduction}
          onChange={handleChange(engine.setDistortionReduction)}
          ocid="protection.distortion"
        />
        <SliderRow
          label="CLIPPING REDUCTION"
          value={engine.clippingReduction}
          onChange={handleChange(engine.setClippingReduction)}
          ocid="protection.clipping"
        />
        <SliderRow
          label="CLEAN SIGNAL"
          value={engine.cleanSignal}
          onChange={handleChange(engine.setCleanSignal)}
          ocid="protection.clean_signal"
        />
      </div>

      {/* System Health — build team contribution */}
      <div
        className="px-3 py-3 rounded"
        style={{
          background: "rgba(0,255,136,0.05)",
          border: "1px solid rgba(0,255,136,0.2)",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#00ff88" }}
          >
            SYSTEM HEALTH
          </span>
          <span
            className="text-sm font-mono font-bold"
            style={{ color: "#00ff88" }}
          >
            {systemHealth}%
          </span>
        </div>
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(0,255,136,0.2)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${systemHealth}%`,
              background:
                systemHealth >= 80
                  ? "linear-gradient(90deg,#00ff88,#00d4ff)"
                  : systemHealth >= 60
                    ? "#00ff88"
                    : systemHealth >= 40
                      ? "#ffd700"
                      : "#ff4444",
              boxShadow:
                systemHealth >= 80 ? "0 0 8px rgba(0,212,255,0.5)" : "none",
            }}
            data-ocid="protection.health_bar"
          />
        </div>
        <div
          className="text-xs mt-1.5"
          style={{ color: "rgba(0,255,136,0.5)" }}
        >
          AVG OF ALL 3 PROTECTION SLIDERS
        </div>
      </div>
    </div>
  );
}
