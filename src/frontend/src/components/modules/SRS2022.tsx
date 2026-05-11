import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

export default function SRS2022() {
  const engine = useAudioEngine();
  const [enabled, setEnabled] = useState(false);
  const [wow, setWow] = useState(false);
  const [truBass, setTruBass] = useState(false);

  const handleSRS = (v: boolean) => {
    setEnabled(v);
    engine.setSRSEnhancement(v);
  };

  const handleWOW = (v: boolean) => {
    setWow(v);
    engine.setWOW(v);
  };

  const handleTruBass = (v: boolean) => {
    setTruBass(v);
    engine.setTruBass(v);
  };

  const Toggle = ({
    label,
    desc,
    value,
    onChange,
    ocid,
  }: {
    label: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
    ocid: string;
  }) => (
    <div
      className="flex items-center justify-between py-3 border-b"
      style={{ borderColor: "rgba(0,212,255,0.1)" }}
    >
      <div>
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.8)" }}
        >
          {label}
        </div>
        <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
          {desc}
        </div>
      </div>
      <button
        data-ocid={ocid}
        type="button"
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full transition-smooth relative"
        style={{
          background: value ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)",
          border: `1px solid ${value ? "#00d4ff" : "rgba(255,255,255,0.2)"}`,
          boxShadow: value ? "0 0 10px rgba(0,212,255,0.4)" : "none",
        }}
        aria-label={`Toggle ${label}`}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-smooth"
          style={{
            background: value ? "#00d4ff" : "rgba(255,255,255,0.4)",
            left: value ? "calc(100% - 22px)" : "2px",
          }}
        />
      </button>
    </div>
  );

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
        SRS SURROUND PROCESSING • 2022
      </div>

      <Toggle
        label="SRS ENHANCEMENT"
        desc="Compander: -6dB threshold, 2:1 ratio"
        value={enabled}
        onChange={handleSRS}
        ocid="srs.toggle"
      />
      <Toggle
        label="WOW — 100Hz BOOST"
        desc="+3dB peak at 100Hz"
        value={wow}
        onChange={handleWOW}
        ocid="srs.wow_toggle"
      />
      <Toggle
        label="TRUBASS — 60Hz BOOST"
        desc="+4dB peak at 60Hz sub bass"
        value={truBass}
        onChange={handleTruBass}
        ocid="srs.trubass_toggle"
      />

      <div className="flex justify-center mt-4">
        <span
          className={enabled || wow || truBass ? "badge-live" : "badge-off"}
        >
          {enabled || wow || truBass ? "SRS ACTIVE" : "SRS OFF"}
        </span>
      </div>
    </div>
  );
}
