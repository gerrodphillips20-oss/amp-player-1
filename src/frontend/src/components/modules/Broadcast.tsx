import { useState } from "react";

export default function Broadcast() {
  const [broadcasting, setBroadcasting] = useState(false);

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
        NETWORK BROADCAST MODULE
      </div>

      <div
        className="flex items-center justify-between py-3 border-b"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <div>
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(0,212,255,0.8)" }}
          >
            BROADCAST STATUS
          </div>
        </div>
        <button
          type="button"
          data-ocid="broadcast.toggle"
          onClick={() => setBroadcasting((p) => !p)}
          className="px-3 py-1 rounded text-xs font-bold uppercase transition-smooth"
          style={{
            background: broadcasting
              ? "rgba(0,255,136,0.15)"
              : "rgba(255,68,68,0.1)",
            border: `1px solid ${broadcasting ? "rgba(0,255,136,0.5)" : "rgba(255,68,68,0.4)"}`,
            color: broadcasting ? "#00ff88" : "#ff4444",
          }}
        >
          {broadcasting ? "BROADCASTING" : "STANDBY"}
        </button>
      </div>

      {[
        ["PROTOCOL", "4G/LTE"],
        ["SIGNAL", "ACTIVE"],
        ["FREQUENCY", "2.4 GHz"],
        ["BANDWIDTH", "20 MHz"],
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
