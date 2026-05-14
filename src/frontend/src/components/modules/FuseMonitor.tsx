import { useAudioEngine } from "@/hooks/useAudioEngine";

export default function FuseMonitor() {
  const engine = useAudioEngine();
  const bassOk = engine.bassContextState === "running";
  const highsOk = engine.highsContextState === "running";

  const fuses = [
    {
      id: 1,
      label: "FUSE 1 — NOMINAL",
      status: bassOk ? "NOMINAL" : "STANDBY",
      rating: "150A",
      ok: bassOk,
    },
    {
      id: 2,
      label: "FUSE 2 — NOMINAL",
      status: highsOk ? "NOMINAL" : "STANDBY",
      rating: "100A",
      ok: highsOk,
    },
  ];

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
        FUSE MONITOR • PROTECTED COMPARTMENT
      </div>

      {fuses.map((fuse) => (
        <div
          key={fuse.id}
          className="p-4 rounded"
          style={{
            background: fuse.ok
              ? "rgba(0,255,136,0.05)"
              : "rgba(255,68,68,0.05)",
            border: `1px solid ${
              fuse.ok ? "rgba(0,255,136,0.2)" : "rgba(255,68,68,0.2)"
            }`,
          }}
          data-ocid={`fuse.fuse.${fuse.id}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(0,212,255,0.8)" }}
              >
                {fuse.label}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "rgba(0,212,255,0.5)" }}
              >
                RATING: {fuse.rating} • 4 GAUGE WIRED
              </div>
            </div>
            <span className={fuse.ok ? "badge-live" : "badge-off"}>
              {fuse.status}
            </span>
          </div>
        </div>
      ))}

      <div
        className="p-3 rounded mt-2"
        style={{
          background: "rgba(0,255,136,0.05)",
          border: "1px solid rgba(0,255,136,0.2)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#00ff88" }}
        >
          688 PROTECTION STAGES ACTIVE
        </div>
        <div
          className="text-xs mt-1 font-mono"
          style={{ color: "rgba(0,255,136,0.5)" }}
        >
          344,000 BATTERIES — 688 FUSES — HELIX AMP PROTECTED
        </div>
      </div>

      <div
        className="p-3 rounded mt-2"
        style={{
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          HANDSHAKE SEQUENCE
        </div>
        <div
          className="text-xs mt-1 font-mono"
          style={{ color: "rgba(0,212,255,0.4)" }}
        >
          BROWSER → FUSE → MILLIWATTS → HELIX AMP
        </div>
      </div>
    </div>
  );
}
