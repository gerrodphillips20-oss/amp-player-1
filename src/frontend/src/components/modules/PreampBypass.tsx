import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function PreampBypass() {
  const engine = useAudioEngine();

  const handleBypass = () => {
    engine.setEQBypass(!engine.preampBypassed);
  };

  return (
    <div className="space-y-3">
      <div
        className="text-sm font-bold uppercase tracking-widest mb-2"
        style={{ color: "#00ff88" }}
      >
        PREAMP BYPASS
      </div>
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,255,136,0.1)",
          color: "#00ff88",
          border: "1px solid rgba(0,255,136,0.3)",
        }}
      >
        {engine.preampBypassed
          ? "EQ BYPASSED — FLAT SIGNAL"
          : "EQ ACTIVE IN SIGNAL PATH"}
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <button
          type="button"
          data-ocid="preamp.bypass_toggle"
          onClick={handleBypass}
          className="w-20 h-20 rounded-full flex items-center justify-center transition-smooth"
          style={{
            background: engine.preampBypassed
              ? "rgba(0,255,136,0.2)"
              : "rgba(255,68,68,0.1)",
            border: `2px solid ${
              engine.preampBypassed
                ? "rgba(0,255,136,0.8)"
                : "rgba(255,68,68,0.4)"
            }`,
            boxShadow: engine.preampBypassed
              ? "0 0 30px rgba(0,255,136,0.4)"
              : "none",
          }}
          aria-label="Toggle preamp bypass"
        >
          <span style={{ fontSize: "2rem" }}>
            {engine.preampBypassed ? "✅" : "⛔"}
          </span>
        </button>
        <span className={engine.preampBypassed ? "badge-live" : "badge-off"}>
          {engine.preampBypassed ? "BYPASSED • ACTIVE" : "EQ ENGAGED"}
        </span>
        <div
          className="text-xs text-center"
          style={{ color: "rgba(0,212,255,0.5)" }}
        >
          {engine.preampBypassed
            ? "All EQ gains set to 0dB. Signal passes flat."
            : "Signal passes through active EQ chain."}
          <br />
          No preamp stage. No gain staging before filters.
        </div>
      </div>

      {[
        ["PREAMP STAGE", "BYPASSED"],
        ["SIGNAL INTEGRITY", "100%"],
        ["COLORATION", "NONE"],
        ["EQ STATUS", engine.preampBypassed ? "FLAT" : "ACTIVE"],
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
            style={{ color: "#00ff88" }}
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}
