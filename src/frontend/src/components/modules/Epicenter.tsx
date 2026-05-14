import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

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

export default function Epicenter() {
  const engine = useAudioEngine();
  const [restoration, setRestorationLocal] = useState(
    engine.bassRestorationLevel ?? 50,
  );
  const [bassOutput, setBassOutputLocal] = useState(
    engine.bassOutputLevel ?? 50,
  );

  const handleRestoration = (v: number) => {
    setRestorationLocal(v);
    engine.setBassRestorationLevel(v);
  };

  const handleBassOutput = (v: number) => {
    setBassOutputLocal(v);
    engine.setBassOutputLevel(v);
  };

  const restorationDb = ((restoration / 100) * 9.6).toFixed(1);
  const bassOutputPct = `${bassOutput}%  (${(bassOutput / 50).toFixed(2)}x)`;
  const restorationActive = restoration > 0;

  return (
    <div className="space-y-3">
      {/* Panel Header */}
      <div>
        <div
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#ffd700" }}
        >
          BASS EPICENTER
        </div>
        <div
          className="text-xs mt-0.5 font-mono"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          14–40Hz / 14–80Hz &bull; THD 0.002% &bull; SNR 110dB
        </div>
      </div>

      {/* Specs — read only */}
      <div
        className="grid grid-cols-2 gap-1 p-2 rounded"
        style={{
          background: "rgba(0,212,255,0.04)",
          border: "1px solid rgba(0,212,255,0.12)",
        }}
      >
        {[
          ["FREQ RESP", "14–40Hz | 14–80Hz"],
          ["THD", "0.002%"],
          ["SNR", "110dB"],
          ["PFM FLOOR", "14Hz"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span
              className="text-xs font-bold uppercase"
              style={{ color: "rgba(0,212,255,0.5)" }}
            >
              {k}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#ffd700" }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* PFM Status Badge */}
      <div className="flex items-center gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            background: "rgba(0,255,136,0.12)",
            border: "1px solid rgba(0,255,136,0.4)",
            color: "#00ff88",
          }}
          data-ocid="epicenter.pfm_status"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#00ff88" }}
          />
          PFM SUBSONIC FILTER &bull; 14Hz FLOOR &bull; ACTIVE
        </div>
      </div>

      {/* Frequency Lane Display */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-4 rounded flex items-center px-2"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,255,136,0.25) 0%, rgba(0,255,136,0.08) 100%)",
              border: "1px solid rgba(0,255,136,0.3)",
            }}
          >
            <span
              className="text-xs font-bold font-mono uppercase tracking-widest"
              style={{ color: "#00ff88" }}
            >
              14–40Hz &nbsp; BOTTOM NOTE LANE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-4 rounded flex items-center px-2"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.08) 100%)",
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          >
            <span
              className="text-xs font-bold font-mono uppercase tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              14–80Hz &nbsp; PUNCH LANE
            </span>
          </div>
        </div>
      </div>

      {/* Command Chain */}
      <div
        className="px-3 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider"
        style={{
          background: "rgba(255,215,0,0.05)",
          border: "1px solid rgba(255,215,0,0.15)",
          color: "rgba(255,215,0,0.7)",
        }}
        data-ocid="epicenter.command_chain"
      >
        ULTRA &rarr; SRL &rarr; VOLUME + CROSSOVER &rarr; EPICENTER
      </div>

      {/* Sliders — Restoration + Output Level ONLY */}
      <div className="space-y-0.5">
        {/* Bass Restoration */}
        <div
          className="flex flex-col gap-1 py-2 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-widest flex items-center"
              style={{ color: "#ffd700" }}
            >
              BASS RESTORATION{HD_BADGE}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#00d4ff" }}
            >
              {restorationDb} dB
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            Recreates missing fundamental frequencies from harmonics
          </p>
          <input
            data-ocid="epicenter.restoration_slider"
            type="range"
            min={0}
            max={100}
            value={restoration}
            onChange={(e) =>
              handleRestoration(
                hdMonitorProcess(Number(e.target.value), "bass-restoration"),
              )
            }
            className="w-full mt-1"
            style={
              {
                maxWidth: "180px",
                accentColor: "#00d4ff",
              } as React.CSSProperties
            }
          />
        </div>

        {/* Bass Output Level */}
        <div
          className="flex flex-col gap-1 py-2 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-widest flex items-center"
              style={{ color: "#ffd700" }}
            >
              BASS OUTPUT LEVEL{HD_BADGE}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#00ff88" }}
            >
              {bassOutputPct}
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
            Master bass output after all epicenter processing
          </p>
          <input
            data-ocid="epicenter.bass_output_slider"
            type="range"
            min={0}
            max={100}
            value={bassOutput}
            onChange={(e) =>
              handleBassOutput(
                hdMonitorProcess(Number(e.target.value), "bass-output"),
              )
            }
            className="w-full mt-1"
            style={
              {
                maxWidth: "180px",
                accentColor: "#00ff88",
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/* Chip Status Indicators — Restoration + PFM only */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          {
            id: "restoration",
            label: "BASS RESTORATION CHIP",
            active: restorationActive,
            alwaysOn: false,
          },
          {
            id: "pfm",
            label: "PFM CHIP • 14Hz FLOOR",
            active: true,
            alwaysOn: true,
          },
        ].map((chip, idx) => (
          <div
            key={chip.id}
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              background: chip.active
                ? chip.alwaysOn
                  ? "rgba(0,255,136,0.1)"
                  : "rgba(0,212,255,0.1)"
                : "rgba(255,215,0,0.05)",
              border: `1px solid ${
                chip.active
                  ? chip.alwaysOn
                    ? "rgba(0,255,136,0.4)"
                    : "rgba(0,212,255,0.4)"
                  : "rgba(255,215,0,0.2)"
              }`,
            }}
            data-ocid={`epicenter.chip.${idx + 1}`}
          >
            <span
              className="text-xs font-bold uppercase leading-tight"
              style={{
                color: chip.active
                  ? chip.alwaysOn
                    ? "#00ff88"
                    : "#00d4ff"
                  : "rgba(255,215,0,0.6)",
                fontSize: "0.6rem",
              }}
            >
              {chip.label}
            </span>
            <span
              className="text-xs font-bold uppercase px-1.5 py-0.5 rounded ml-1 shrink-0"
              style={{
                background: chip.active
                  ? chip.alwaysOn
                    ? "rgba(0,255,136,0.2)"
                    : "rgba(0,212,255,0.2)"
                  : "rgba(255,215,0,0.1)",
                color: chip.active
                  ? chip.alwaysOn
                    ? "#00ff88"
                    : "#00d4ff"
                  : "rgba(255,215,0,0.5)",
                fontSize: "0.55rem",
              }}
            >
              {chip.active ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
