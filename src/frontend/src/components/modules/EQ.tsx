import { EQ_FREQS, useAudioEngine } from "@/hooks/useAudioEngine";
import { useEffect, useState } from "react";

// 6-band EQ: mids/highs only (250Hz and up)
// Bands 0 (19Hz) and 1 (47Hz) REMOVED — Canister handles those ranges
const BANDS = [
  {
    id: "low_mid",
    label: "250Hz",
    freq: EQ_FREQS[2],
    desc: "Low Mids / Warmth",
    color: "#00d4ff",
  },
  {
    id: "mid1",
    label: "500Hz",
    freq: EQ_FREQS[3],
    desc: "Mids / Body",
    color: "#00d4ff",
  },
  {
    id: "vocals",
    label: "1kHz",
    freq: EQ_FREQS[4],
    desc: "Presence / Vocals",
    color: "#00d4ff",
  },
  {
    id: "attack",
    label: "4kHz",
    freq: EQ_FREQS[5],
    desc: "Attack / Definition",
    color: "#00d4ff",
  },
  {
    id: "air",
    label: "8kHz",
    freq: EQ_FREQS[6],
    desc: "Air / Brightness",
    color: "#00ff88",
  },
  {
    id: "top",
    label: "16kHz",
    freq: EQ_FREQS[7],
    desc: "Top End / Sparkle",
    color: "#00ff88",
  },
];

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

export default function EQ() {
  const engine = useAudioEngine();
  const [bass50, setBass50] = useState(() => engine?.eqBands?.[0]?.gainDb ?? 0);
  const [bass80, setBass80] = useState(() => engine?.eqBands?.[1]?.gainDb ?? 0);

  const eqBand0GainDb = engine?.eqBands?.[0]?.gainDb;
  const eqBand1GainDb = engine?.eqBands?.[1]?.gainDb;
  useEffect(() => {
    if (eqBand0GainDb !== undefined) setBass50(eqBand0GainDb);
    if (eqBand1GainDb !== undefined) setBass80(eqBand1GainDb);
  }, [eqBand0GainDb, eqBand1GainDb]);

  const hdMonitorProcess = (rawValue: number, sliderType: string): number => {
    let processed = rawValue;
    if (rawValue < -8) processed = rawValue * 0.9;
    else if (rawValue > 8) processed = rawValue * 0.95;
    console.log(
      `[Superior HD Monitor][${sliderType}] Input: ${rawValue.toFixed(2)}, Processed: ${processed.toFixed(2)}`,
    );
    return processed;
  };

  const getGain = (freq: number) =>
    engine.eqBands.find((b) => b.freq === freq)?.gainDb ?? 0;

  const handleChange = (freq: number, v: number) => engine.setEQBand(freq, v);

  return (
    <div className="space-y-2">
      <div
        className="text-xs font-bold mb-3 px-2 py-1.5 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        8 BAND EQ ● ±12dB RANGE ● BASS (14–80Hz) + MIDS (250Hz+) + HIGHS
      </div>

      {/* Bass Band 1: 14-50Hz */}
      <div
        className="flex items-center gap-3 py-2 border-b"
        style={{ borderColor: "rgba(255,107,53,0.2)" }}
      >
        <div className="w-28 flex-shrink-0">
          <div
            className="text-xs font-bold uppercase tracking-widest flex items-center"
            style={{ color: "#ff6b35" }}
          >
            LOW END 14–50Hz{HD_BADGE}
          </div>
          <div
            className="text-xs leading-tight mt-0.5"
            style={{ color: "rgba(255,107,53,0.45)", fontSize: "0.6rem" }}
          >
            Deep Sub / Bottom
          </div>
        </div>
        <input
          data-ocid="eq.bass50_slider"
          type="range"
          min={-12}
          max={12}
          step={0.1}
          value={bass50}
          style={
            { maxWidth: "180px", accentColor: "#ff6b35" } as React.CSSProperties
          }
          onChange={(e) => {
            const processed = hdMonitorProcess(
              Number(e.target.value),
              "14-50Hz",
            );
            setBass50(processed);
            engine.setEQBand(EQ_FREQS[0], processed);
          }}
        />
        <span
          className="text-xs font-mono w-14 text-right font-bold"
          style={{
            color: bass50 > 0 ? "#00ff88" : bass50 < 0 ? "#ff4444" : "#ffd700",
          }}
        >
          {bass50 >= 0 ? "+" : ""}
          {bass50.toFixed(1)} dB
        </span>
        <button
          type="button"
          data-ocid="eq.bass50_reset"
          onClick={() => {
            setBass50(0);
            engine.setEQBand(EQ_FREQS[0], 0);
          }}
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: "rgba(255,107,53,0.1)",
            color: "rgba(255,107,53,0.7)",
            border: "1px solid rgba(255,107,53,0.3)",
          }}
        >
          RST
        </button>
      </div>

      {/* Bass Band 2: 14-80Hz */}
      <div
        className="flex items-center gap-3 py-2 border-b"
        style={{ borderColor: "rgba(255,107,53,0.2)" }}
      >
        <div className="w-28 flex-shrink-0">
          <div
            className="text-xs font-bold uppercase tracking-widest flex items-center"
            style={{ color: "#ff9500" }}
          >
            LOW END 14–80Hz{HD_BADGE}
          </div>
          <div
            className="text-xs leading-tight mt-0.5"
            style={{ color: "rgba(255,149,0,0.45)", fontSize: "0.6rem" }}
          >
            Punch / Sub Bass
          </div>
        </div>
        <input
          data-ocid="eq.bass80_slider"
          type="range"
          min={-12}
          max={12}
          step={0.1}
          value={bass80}
          style={
            { maxWidth: "180px", accentColor: "#ff9500" } as React.CSSProperties
          }
          onChange={(e) => {
            const processed = hdMonitorProcess(
              Number(e.target.value),
              "14-80Hz",
            );
            setBass80(processed);
            engine.setEQBand(EQ_FREQS[1], processed);
          }}
        />
        <span
          className="text-xs font-mono w-14 text-right font-bold"
          style={{
            color: bass80 > 0 ? "#00ff88" : bass80 < 0 ? "#ff4444" : "#ffd700",
          }}
        >
          {bass80 >= 0 ? "+" : ""}
          {bass80.toFixed(1)} dB
        </span>
        <button
          type="button"
          data-ocid="eq.bass80_reset"
          onClick={() => {
            setBass80(0);
            engine.setEQBand(EQ_FREQS[1], 0);
          }}
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: "rgba(255,149,0,0.1)",
            color: "rgba(255,149,0,0.7)",
            border: "1px solid rgba(255,149,0,0.3)",
          }}
        >
          RST
        </button>
      </div>

      {BANDS.map((band) => {
        const gain = getGain(band.freq);
        return (
          <div
            key={band.id}
            className="flex items-center gap-3 py-2 border-b"
            style={{ borderColor: "rgba(0,212,255,0.1)" }}
          >
            {/* Band info */}
            <div className="w-28 flex-shrink-0">
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: band.color }}
              >
                {band.label}
              </div>
              <div
                className="text-xs leading-tight mt-0.5"
                style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem" }}
              >
                {band.desc}
              </div>
            </div>

            {/* Slider */}
            <input
              data-ocid={`eq.${band.id}_slider`}
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={gain}
              onChange={(e) => handleChange(band.freq, Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: band.color }}
            />

            {/* Value */}
            <span
              className="text-xs font-mono w-14 text-right font-bold"
              style={{
                color: gain > 0 ? "#00ff88" : gain < 0 ? "#ff4444" : "#ffd700",
              }}
            >
              {gain >= 0 ? "+" : ""}
              {gain.toFixed(1)} dB
            </span>

            {/* Reset */}
            <button
              type="button"
              data-ocid={`eq.${band.id}_reset`}
              onClick={() => handleChange(band.freq, 0)}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "rgba(0,212,255,0.1)",
                color: "rgba(0,212,255,0.6)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              RST
            </button>
          </div>
        );
      })}

      {/* Sub/bass handled by Canister note */}
      <div
        className="px-2 py-1 rounded text-xs mt-1"
        style={{
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.1)",
          color: "rgba(0,212,255,0.45)",
        }}
      >
        ● Bass lane EQ (14–80Hz) above — Canister handles parallel boost path
      </div>
    </div>
  );
}
