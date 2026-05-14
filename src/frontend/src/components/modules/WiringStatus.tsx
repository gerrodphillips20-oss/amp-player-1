import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function WiringStatus() {
  const engine = useAudioEngine();
  const bothRunning =
    engine.isLoaded &&
    engine.bassContextState === "running" &&
    engine.highsContextState === "running";

  const CONNECTIONS = [
    { from: "THUNDER BATTERY", to: "SIGNAL BOOSTER", gauge: "4 AWG" },
    { from: "SIGNAL BOOSTER", to: "CHIP COMMANDER", gauge: "4 AWG" },
    { from: "CHIP COMMANDER", to: "HELIX DSP AMP", gauge: "4 AWG" },
    { from: "CHIP COMMANDER", to: "INTELLIGENCE LAYER", gauge: "4 AWG" },
    { from: "HEAD UNIT", to: "HELIX DSP AMP (RCA SET 1)", gauge: "RCA" },
    { from: "HEAD UNIT", to: "INTELLIGENCE LAYER (RCA SET 2)", gauge: "RCA" },
    { from: "HELIX DSP AMP", to: "SUBWOOFER", gauge: "4 AWG" },
    { from: "VDA PROCESSOR", to: "SPEAKERS", gauge: "4 AWG" },
  ];

  return (
    <div className="space-y-2">
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        WIRING STATUS • 4 GAUGE AWG THROUGHOUT
      </div>

      {CONNECTIONS.map((conn, i) => (
        <div
          key={conn.from}
          className="flex items-center justify-between px-3 py-2 rounded"
          style={{
            background: "rgba(0,10,30,0.8)",
            border: `1px solid ${
              bothRunning ? "rgba(0,255,136,0.2)" : "rgba(0,212,255,0.15)"
            }`,
          }}
          data-ocid={`wiring.connection.${i + 1}`}
        >
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-bold uppercase"
              style={{ color: "rgba(0,212,255,0.8)", fontSize: "0.65rem" }}
            >
              {conn.from} → {conn.to}
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(0,212,255,0.4)", fontSize: "0.6rem" }}
            >
              {conn.gauge}
            </div>
          </div>
          <span
            className="text-xs font-bold uppercase px-2 py-0.5 rounded ml-2"
            style={{
              background: bothRunning
                ? "rgba(0,255,136,0.1)"
                : "rgba(0,212,255,0.1)",
              border: `1px solid ${
                bothRunning ? "rgba(0,255,136,0.4)" : "rgba(0,212,255,0.4)"
              }`,
              color: bothRunning ? "#00ff88" : "#00d4ff",
              fontSize: "0.55rem",
            }}
          >
            {bothRunning ? "● LIVE" : "● WIRED"}
          </span>
        </div>
      ))}
    </div>
  );
}
