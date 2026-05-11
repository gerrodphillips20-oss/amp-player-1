import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

const BAR_FREQS = [30, 60, 80, 95, 85, 70, 55, 75, 90, 65] as const;

export default function WirelessSignal() {
  const engine = useAudioEngine();
  const [freq] = useState("2467.4");

  const bassLevel = engine.bassGainValue;
  const highsLevel = engine.highsGainValue;

  return (
    <div className="space-y-3">
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        WIRELESS / RF SIGNAL MODULE
      </div>

      <div className="flex items-center justify-between py-2">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          FREQUENCY
        </span>
        <span
          className="text-lg font-mono font-bold"
          style={{
            color: "#ffd700",
            textShadow: "0 0 10px rgba(255,215,0,0.4)",
          }}
        >
          {freq} MHz
        </span>
      </div>

      <div className="flex items-end gap-1 h-12 py-2">
        {BAR_FREQS.map((baseH) => (
          <div
            key={baseH}
            className="flex-1 rounded-sm transition-smooth"
            style={{
              height: `${engine.isPlaying ? baseH : 5}%`,
              background: `rgba(0,212,255,${
                engine.isPlaying ? 0.3 + baseH / 200 : 0.1
              })`,
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          />
        ))}
      </div>

      {[
        ["SIGNAL TYPE", "RF/802.11"],
        ["BAND", "5 GHz"],
        ["STATUS", engine.isLoaded ? "CONNECTED" : "IDLE"],
        ["BASS LEVEL", `${(bassLevel * 100).toFixed(0)}%`],
        ["HIGHS LEVEL", `${(highsLevel * 100).toFixed(0)}%`],
      ].map(([k, v]) => (
        <div
          key={k}
          className="flex justify-between py-1 border-b"
          style={{ borderColor: "rgba(0,212,255,0.1)" }}
        >
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
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
  );
}
